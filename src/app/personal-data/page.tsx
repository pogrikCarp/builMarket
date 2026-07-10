import Link from "next/link";
import type { ReactNode } from "react";

const Mark = ({ children }: { children: ReactNode }) => <span className="font-semibold text-red-600">{children}</span>;

const tableClass = "mt-4 w-full min-w-[720px] border-collapse text-left text-sm";
const thClass = "border border-slate-200 bg-amber-50 px-4 py-3 font-semibold text-slate-900";
const tdClass = "border border-slate-200 px-4 py-3 align-top text-slate-600";

export default function PersonalDataPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-[36px] bg-white/90 p-8 shadow-sm md:p-12">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-600">
          ← ДомСтрой
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">Политика обработки персональных данных</h1>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Дата вступления в силу: <Mark>[01.01.2026]</Mark>
        </p>

        <div className="mt-8 space-y-8 text-base leading-8 text-slate-600">
          <p>
            Настоящая Политика обработки персональных данных (далее – Политика) разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые <Mark>[Название компании/ИП]</Mark> (далее – Оператор).
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">1. Общие положения</h2>
            <p className="mt-4">1.1. Настоящая Политика является официальным документом Оператора и обязательна для исполнения всеми сотрудниками Оператора.</p>
            <p>1.2. Политика применяется ко всем персональным данным, которые Оператор получает от Пользователей сайта <Mark>[Адрес вашего сайта]</Mark> (далее – Сайт).</p>
            <p>1.3. Используя Сайт, Пользователь даёт своё согласие на обработку своих персональных данных в порядке, описанном в настоящей Политике.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">2. Принципы обработки персональных данных</h2>
            <p className="mt-4">Оператор придерживается следующих принципов:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Обработка данных осуществляется на законной и справедливой основе.</li>
              <li>Обрабатываются только конкретные, заранее определённые и законные цели.</li>
              <li>Не допускается объединение баз данных, обрабатываемых в несовместимых целях.</li>
              <li>Содержание и объём данных соответствуют заявленным целям обработки.</li>
              <li>Обеспечивается точность, достаточность и актуальность данных.</li>
              <li>Данные хранятся в форме, позволяющей идентифицировать Пользователя не дольше, чем этого требуют цели обработки.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">3. Категории обрабатываемых персональных данных</h2>
            <p className="mt-4">Оператор обрабатывает следующие категории данных:</p>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr><th className={thClass}>Категория</th><th className={thClass}>Перечень данных</th></tr>
                </thead>
                <tbody>
                  <tr><td className={tdClass}>Общегражданские данные</td><td className={tdClass}>Фамилия, Имя, Отчество</td></tr>
                  <tr><td className={tdClass}>Контактные данные</td><td className={tdClass}>Номер телефона, адрес электронной почты, почтовый адрес</td></tr>
                  <tr><td className={tdClass}>Технические данные</td><td className={tdClass}>IP-адрес, данные файлов cookie, информация о браузере и устройстве, сведения о действиях на Сайте</td></tr>
                  <tr><td className={tdClass}>Финансовые данные (при необходимости)</td><td className={tdClass}>Данные банковских карт (только через защищённые платёжные шлюзы, не хранятся у Оператора)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">4. Категории субъектов персональных данных</h2>
            <p className="mt-4">Обработке подлежат данные следующих категорий субъектов:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Пользователи Сайта – все посетители, оставляющие заявки, регистрирующиеся или совершающие покупки.</li>
              <li>Клиенты – лица, заключившие с Оператором договор.</li>
              <li>Контрагенты и представители юридических лиц – при взаимодействии в рамках хозяйственной деятельности.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">5. Цели обработки персональных данных</h2>
            <p className="mt-4">Оператор обрабатывает данные в следующих целях:</p>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr><th className={thClass}>№</th><th className={thClass}>Цель обработки</th><th className={thClass}>Правовое основание</th></tr>
                </thead>
                <tbody>
                  <tr><td className={tdClass}>1</td><td className={tdClass}>Обработка заявок и обращений Пользователей</td><td className={tdClass}>Согласие Пользователя, исполнение договора</td></tr>
                  <tr><td className={tdClass}>2</td><td className={tdClass}>Заключение и исполнение договоров (в т.ч. доставка товаров)</td><td className={tdClass}>Договор, оферта</td></tr>
                  <tr><td className={tdClass}>3</td><td className={tdClass}>Информирование о новостях, акциях, специальных предложениях</td><td className={tdClass}>Согласие Пользователя</td></tr>
                  <tr><td className={tdClass}>4</td><td className={tdClass}>Анализ поведения Пользователей на Сайте для улучшения сервиса</td><td className={tdClass}>Законный интерес, согласие (cookie)</td></tr>
                  <tr><td className={tdClass}>5</td><td className={tdClass}>Ведение бухгалтерского и налогового учёта</td><td className={tdClass}>Требования законодательства</td></tr>
                  <tr><td className={tdClass}>6</td><td className={tdClass}>Обеспечение безопасности Сайта и предотвращение мошенничества</td><td className={tdClass}>Законный интерес</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">6. Сроки обработки и хранения персональных данных</h2>
            <p className="mt-4">6.1. Персональные данные обрабатываются до момента достижения целей обработки, но не дольше:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>для данных, связанных с договорными отношениями – в течение срока действия договора и 5 лет после его окончания (для налогового учёта);</li>
              <li>для данных, используемых в маркетинговых целях – до момента отзыва согласия;</li>
              <li>для технических данных (cookie) – в течение срока, установленного настройками браузера.</li>
            </ul>
            <p className="mt-3">6.2. По истечении сроков хранения данные удаляются или обезличиваются.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">7. Условия обработки и передачи персональных данных</h2>
            <p className="mt-4">7.1. Обработка данных осуществляется с использованием средств автоматизации (в информационных системах) и без их использования (на бумажных носителях).</p>
            <p>7.2. Оператор не передаёт персональные данные третьим лицам, за исключением случаев, прямо предусмотренных законодательством РФ, и случаев, необходимых для исполнения договора. В таких случаях передача осуществляется на основании отдельного договора с третьим лицом, предусматривающего обязанность обеспечения конфиденциальности.</p>
            <p>7.3. При передаче данных за пределы РФ Оператор гарантирует соблюдение требований 152-ФЗ.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">8. Меры по обеспечению безопасности</h2>
            <p className="mt-4">Оператор принимает следующие меры защиты:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Назначение ответственного лица за организацию обработки данных.</li>
              <li>Разработка и утверждение внутренних документов по обработке данных.</li>
              <li>Применение организационных и технических мер (антивирусы, межсетевые экраны, шифрование, разграничение доступа).</li>
              <li>Ведение журналов учёта и контроля доступа.</li>
              <li>Обучение сотрудников правилам работы с персональными данными.</li>
              <li>Проверка готовности к восстановлению данных при сбоях.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">9. Права субъектов персональных данных</h2>
            <p className="mt-4">Пользователь имеет право:</p>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr><th className={thClass}>Право</th><th className={thClass}>Как реализовать</th></tr>
                </thead>
                <tbody>
                  <tr><td className={tdClass}>Получить информацию об обработке своих данных</td><td className={tdClass}>Направить запрос на email Оператора</td></tr>
                  <tr><td className={tdClass}>Уточнить, заблокировать или удалить свои данные</td><td className={tdClass}>Направить запрос на email Оператора</td></tr>
                  <tr><td className={tdClass}>Отозвать согласие на обработку</td><td className={tdClass}>Направить заявление об отзыве согласия</td></tr>
                  <tr><td className={tdClass}>Обжаловать действия Оператора</td><td className={tdClass}>Обратиться в Роскомнадзор</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">Срок ответа на запрос: 10 рабочих дней (по 152-ФЗ) или 30 дней (по сложным запросам с уведомлением).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">10. Обработка файлов cookie</h2>
            <p className="mt-4">10.1. Сайт использует файлы cookie для идентификации Пользователя, сбора статистики посещений и обеспечения работы функционала Сайта.</p>
            <p>10.2. Пользователь может управлять cookie через настройки своего браузера (полностью отключить или ограничить их использование).</p>
            <p>10.3. Продолжая использовать Сайт, Пользователь даёт согласие на использование cookie. При первом посещении отображается уведомление с выбором «Принять» или «Настроить».</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">11. Ответственность</h2>
            <p className="mt-4">11.1. Оператор несёт ответственность за неисполнение или ненадлежащее исполнение обязанностей по обработке данных в соответствии с законодательством РФ.</p>
            <p>11.2. Пользователь несёт ответственность за достоверность предоставленных данных.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">12. Заключительные положения</h2>
            <p className="mt-4">12.1. Настоящая Политика вступает в силу с момента её размещения на Сайте и действует бессрочно до замены новой версией.</p>
            <p>12.2. Изменения в Политику вносятся при изменении законодательства или внутренних регламентов Оператора. Новая редакция публикуется на Сайте.</p>
            <p>12.3. При несогласии с изменениями Пользователь обязан прекратить использование Сайта.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">13. Контактная информация Оператора</h2>
            <p className="mt-4">По всем вопросам, связанным с обработкой персональных данных, можно обратиться:</p>
            <ul className="mt-3 space-y-2">
              <li>Наименование организации/ИП: <Mark>[Название]</Mark></li>
              <li>Юридический адрес: <Mark>[Адрес]</Mark></li>
              <li>Фактический адрес: <Mark>[Адрес]</Mark></li>
              <li>Email для запросов: <Mark>[Ваш email]</Mark></li>
              <li>Телефон: <Mark>[Ваш телефон]</Mark></li>
              <li>Ответственный за обработку данных: <Mark>[ФИО или должность]</Mark></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
