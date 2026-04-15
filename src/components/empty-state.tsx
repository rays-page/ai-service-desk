import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="panel flex min-h-52 flex-col items-center justify-center rounded-lg px-6 py-10 text-center">
      <div className="rounded-md bg-field p-3 text-moss">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink/58">{body}</p>
    </div>
  );
}
