import Link from "next/link";

export function PageHeader({
  title,
  crumb,
}: {
  title: string;
  crumb?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">Главная</Link>
        <span>—</span>
        <Link href="/personal" className="hover:text-slate-600">Личный кабинет</Link>
        {crumb && (
          <>
            <span>—</span>
            <span>{crumb}</span>
          </>
        )}
      </div>
    </div>
  );
}
