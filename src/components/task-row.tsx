import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { completeTaskAction } from "@/app/actions";
import type { Task } from "@/lib/types";
import { cn, isOverdue, shortTime } from "@/lib/utils";

export function TaskRow({ task }: { task: Task }) {
  const overdue = isOverdue(task);

  return (
    <div className="grid gap-3 border-b border-line px-4 py-4 last:border-b-0 md:grid-cols-[1fr_0.8fr_auto] md:items-center">
      <div>
        <div className="flex items-center gap-2">
          <Clock className={cn("h-4 w-4", overdue ? "text-rust" : "text-moss")} aria-hidden="true" />
          <p className="font-medium">{task.title}</p>
        </div>
        {task.description ? <p className="mt-1 text-sm text-ink/58">{task.description}</p> : null}
        {task.lead_id ? (
          <Link href={`/leads/${task.lead_id}`} className="mt-2 inline-flex text-sm font-medium text-sky hover:text-moss">
            {task.lead?.title ?? "Open lead"}
          </Link>
        ) : null}
      </div>
      <div>
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
            task.status === "completed"
              ? "bg-moss/10 text-moss"
              : overdue
                ? "bg-rust/15 text-rust"
                : "bg-sky/10 text-sky"
          )}
        >
          {task.status === "completed" ? "Completed" : overdue ? "Overdue" : "Due"}
        </span>
        <p className="mt-1 text-sm text-ink/55">{shortTime(task.due_at)}</p>
      </div>
      {task.status === "open" ? (
        <form action={completeTaskAction}>
          <input type="hidden" name="task_id" value={task.id} />
          <button className="button-secondary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Complete
          </button>
        </form>
      ) : null}
    </div>
  );
}
