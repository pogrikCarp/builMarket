// Анонимные сигналы идут только в локальную БД сайта, не в API МойСклад.
export type CatalogInterestKind = "VIEW" | "CART" | "FAVORITE";
const VISITOR_KEY = "domstroy_catalog_visitor";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sentEvents = new Set<string>();
let visitorId: string | null = null;

function getVisitorId(): string | null {
  if (visitorId) return visitorId;
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored && UUID_RE.test(stored)) return (visitorId = stored);
    visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, visitorId);
  } catch {
    // При запрете localStorage идентификатор живёт только в памяти страницы.
    visitorId ??= window.crypto.randomUUID?.() ?? null;
  }
  return visitorId;
}

export function recordCatalogInterest(productId: string, kind: CatalogInterestKind): void {
  if (typeof window === "undefined" || !UUID_RE.test(productId)) return;
  const id = getVisitorId();
  if (!id) return;
  const key = `${new Date().toISOString().slice(0, 10)}:${productId}:${kind}`;
  if (sentEvents.has(key)) return;
  sentEvents.add(key);

  // Не ждём статистику перед переходом, добавлением в корзину или избранное.
  void fetch("/api/catalog/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, kind, visitorId: id }),
    keepalive: true,
  }).then((response) => {
    if (!response.ok && response.status !== 429) sentEvents.delete(key);
  }).catch(() => sentEvents.delete(key));
}
