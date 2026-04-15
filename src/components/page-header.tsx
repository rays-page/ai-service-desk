export function PageHeader({
  title,
  eyebrow,
  action
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between lg:px-8">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase text-moss">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold text-ink">{title}</h1>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
