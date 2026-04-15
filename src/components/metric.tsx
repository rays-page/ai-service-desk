import type { LucideIcon } from "lucide-react";

export function Metric({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/58">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-md bg-field p-2 text-moss">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-xs text-ink/55">{detail}</p>
    </div>
  );
}
