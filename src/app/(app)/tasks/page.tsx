import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/task-row";
import { getWorkspaceData } from "@/lib/data";
import { isOverdue } from "@/lib/utils";

export default async function TasksPage({
  searchParams
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const workspace = await getWorkspaceData();
  const view = params.view ?? "due";

  const tasks = workspace.tasks.filter((task) => {
    if (view === "overdue") return isOverdue(task);
    if (view === "completed") return task.status === "completed";
    return task.status === "open" && !isOverdue(task);
  });

  return (
    <>
      <PageHeader title="Task Queue" eyebrow="Follow-up work" />
      <div className="space-y-4 px-5 py-6 lg:px-8">
        <div className="panel flex flex-wrap gap-2 rounded-lg p-3">
          <Link className="button-secondary" href="/tasks">Due</Link>
          <Link className="button-secondary" href="/tasks?view=overdue">Overdue</Link>
          <Link className="button-secondary" href="/tasks?view=completed">Completed</Link>
        </div>
        {tasks.length ? (
          <div className="panel overflow-hidden rounded-lg">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No tasks in this view" body="Follow-up automation creates tasks when lead activity goes stale." />
        )}
      </div>
    </>
  );
}
