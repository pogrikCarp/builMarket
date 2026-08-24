// Рендерит произвольный объект Schema.org как <script type="application/ld+json">.
// JSON.stringify достаточно для безопасности - в отличие от HTML, здесь не нужен
// экранированный текст, но на всякий случай экранируем "</" во избежание преждевременного
// закрытия тега, если в данные попадёт пользовательский текст (например, описание товара).
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
