import { moyskladFetch } from "./moysklad-limiter";
import { buildUrl, getAuthHeaders, getAssortmentByIds, getProductById, type MoyskladAssortmentItem } from "./moysklad";

// Эта часть отвечает за ЗАПИСЬ в МойСклад (в отличие от moysklad.ts, который
// только читает каталог): при оформлении заказа на сайте сюда создаётся
// документ "Отгрузка" (demand) с applicable=true, который списывает товары
// со склада - количество в МойСклад реально уменьшается, а не просто
// отображается на сайте.

type MetaRef = { meta: { href: string; type: string } };

const REF_CACHE_TTL_MS = 60 * 60 * 1000; // организация/склад в МойСклад меняются очень редко
const refCache = new Map<string, { value: MetaRef; expiresAt: number }>();

/**
 * Определяет организацию или склад, которые нужно указывать в документах
 * отгрузки. Если в аккаунте МойСклад ровно одна запись нужного типа - берём
 * её автоматически. Если их несколько (например, завели второй склад) -
 * нужно явно указать ID через переменную окружения, иначе бросаем понятную
 * ошибку (без риска списать товар со случайного склада).
 */
async function getSingleEntityRef(entityType: "organization" | "store", envVarName: string): Promise<MetaRef> {
  const cached = refCache.get(entityType);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const envId = process.env[envVarName];
  let value: MetaRef;

  if (envId) {
    value = { meta: { href: buildUrl(`/entity/${entityType}/${envId}`), type: entityType } };
  } else {
    const res = await moyskladFetch(buildUrl(`/entity/${entityType}`, new URLSearchParams({ limit: "100" })), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`MoySklad API error (${entityType}): ${res.status} ${await res.text()}`);
    }
    const data: { rows: { id: string; meta: { href: string; type: string } }[] } = await res.json();

    if (data.rows.length === 0) {
      throw new Error(`В МойСклад не найдено ни одной записи "${entityType}" - списание остатков невозможно`);
    }
    if (data.rows.length > 1) {
      throw new Error(
        `В МойСклад несколько записей "${entityType}" (${data.rows.length}) - укажите нужную явно переменной окружения ${envVarName}`
      );
    }
    value = { meta: data.rows[0].meta };
  }

  refCache.set(entityType, { value, expiresAt: Date.now() + REF_CACHE_TTL_MS });
  return value;
}

function getOrganizationRef() {
  return getSingleEntityRef("organization", "MOYSKLAD_ORGANIZATION_ID");
}

function getStoreRef() {
  return getSingleEntityRef("store", "MOYSKLAD_STORE_ID");
}

type MoyskladCounterparty = MetaRef & { id: string };

/**
 * Ищет контрагента (покупателя) в МойСклад по телефону, чтобы повторные заказы
 * того же человека привязывались к одной карточке, а не плодили дубли. Если не
 * найден - создаёт нового физлицом с именем и телефоном из формы заказа.
 */
async function findOrCreateCounterparty(options: {
  name: string;
  phone: string;
  email?: string | null;
}): Promise<MoyskladCounterparty> {
  const { name, phone, email } = options;

  const searchUrl = buildUrl("/entity/counterparty", new URLSearchParams({ filter: `phone=${phone}`, limit: "1" }));
  const searchRes = await moyskladFetch(searchUrl, { headers: getAuthHeaders(), cache: "no-store" });
  if (searchRes.ok) {
    const data: { rows: MoyskladCounterparty[] } = await searchRes.json();
    if (data.rows.length > 0) return data.rows[0];
  }

  const createRes = await moyskladFetch(buildUrl("/entity/counterparty"), {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name || phone,
      companyType: "individual",
      phone,
      ...(email ? { email } : {}),
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Не удалось создать контрагента в МойСклад: ${createRes.status} ${await createRes.text()}`);
  }
  return createRes.json();
}

export type DemandPositionInput = {
  productId: string;
  quantity: number;
  priceKopecks: number;
};

/**
 * Создаёт документ "Отгрузка" в МойСклад и сразу проводит его (applicable:
 * true), из-за чего указанное количество товара списывается со склада.
 * Идемпотентно по номеру заказа (externalCode) - повторный вызов для того же
 * заказа (например, повтор после сетевого сбоя) не создаёт вторую отгрузку.
 */
export async function createDemandForOrder(options: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  positions: DemandPositionInput[];
}): Promise<{ id: string }> {
  const externalCode = `site-order-${options.orderNumber}`;

  const existingUrl = buildUrl("/entity/demand", new URLSearchParams({ filter: `externalCode=${externalCode}`, limit: "1" }));
  const existingRes = await moyskladFetch(existingUrl, { headers: getAuthHeaders(), cache: "no-store" });
  if (existingRes.ok) {
    const data: { rows: { id: string }[] } = await existingRes.json();
    if (data.rows.length > 0) return data.rows[0];
  }

  const [organization, store, agent] = await Promise.all([
    getOrganizationRef(),
    getStoreRef(),
    findOrCreateCounterparty({ name: options.customerName, phone: options.phone, email: options.email }),
  ]);

  const positions = await Promise.all(
    options.positions.map(async (position) => {
      const item: MoyskladAssortmentItem = await getProductById(position.productId);
      return {
        quantity: position.quantity,
        price: position.priceKopecks,
        assortment: { meta: item.meta },
      };
    })
  );

  const res = await moyskladFetch(buildUrl("/entity/demand"), {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      organization: { meta: organization.meta },
      agent: { meta: agent.meta },
      store: { meta: store.meta },
      externalCode,
      description: `Заказ с сайта №${options.orderNumber}`,
      applicable: true,
      vatEnabled: false,
      vatIncluded: false,
      positions,
    }),
  });

  if (!res.ok) {
    throw new Error(`Не удалось создать отгрузку в МойСклад: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export type StockCheckProblem = { id: string; name: string; available: number; requested: number };

/**
 * Проверяет по свежим данным МойСклад, что каждой позиции заказа хватает на
 * складе. Одним батч-запросом к entity/assortment (getAssortmentByIds) - тем
 * же источником остатка, что показывает "В наличии: N" в каталоге на сайте.
 *
 * Раньше здесь стоял getProductById() (GET entity/{type}/{id}) - у этого
 * эндпоинта нет поля quantity, поэтому проверка перед покупкой всегда видела
 * available=0 и блокировала оформление даже реально имеющихся на складе
 * товаров. Если сам запрос к МойСклад не удался целиком (сеть, лимиты) -
 * getAssortmentByIds бросает ошибку, и мы честно отказываем в оформлении,
 * а не пропускаем непроверенный товар.
 */
export async function checkStockAvailability(
  items: { id: string; name: string; quantity: number }[]
): Promise<{ problems: StockCheckProblem[]; itemsById: Map<string, MoyskladAssortmentItem> }> {
  const uniqueIds = Array.from(new Set(items.map((item) => item.id)));

  const itemsById = await getAssortmentByIds(uniqueIds);

  const problems: StockCheckProblem[] = [];
  for (const item of items) {
    // Товара нет в ответе - удалён/снят с продажи в МойСклад, считаем как 0.
    const liveItem = itemsById.get(item.id);
    const available = liveItem?.quantity ?? 0;
    if (item.quantity > available) {
      problems.push({ id: item.id, name: liveItem?.name ?? item.name, available, requested: item.quantity });
    }
  }

  return { problems, itemsById };
}
