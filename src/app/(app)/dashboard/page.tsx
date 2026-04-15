import { CalendarCheck2, Clock3, MessageSquarePlus, TimerReset } from "lucide-react";
import { LeadRow } from "@/components/lead-row";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/task-row";
import { getDashboardStats, getWorkspaceData } from "@/lib/data";
import { isOverdue } from "@/lib/utils";

export default async function DashboardPage() {
  const workspace = await getWorkspaceData();
  const stats = getDashboardStats(workspace);
  const activeLeads = workspace.leads.slice(0, 5);
  const urgentTasks = workspace.tasks.filter((task) => task.status === "open").sort((a, b) => +new Date(a.due_at) - +new Date(b.due_at)).slice(0, 4);

  return (
    <>
      <PageHeader title="Dashboard" eyebrow={workspace.business.name} />
      <div className="space-y-6 px-5 py-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="New leads today" value={stats.newLeadsToday} detail="Created since local midnight" icon={MessageSquarePlus} />
          <Metric label="Overdue follow-ups" value={stats.overdueFollowups} detail="Open tasks past due" icon={TimerReset} />
          <Metric label="Booked count" value={stats.bookedCount} detail="Leads currently in Booked" icon={CalendarCheck2} />
          <Metric
            label="Avg first response"
            value={stats.avgFirstResponseMinutes === null ? "None" : `${stats.avgFirstResponseMinutes}m`}
            detail="Inbound to first outbound"
            icon={Clock3}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="panel overflow-hidden rounded-lg">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-semibold">Active lead queue</h2>
            </div>
            {activeLeads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </div>

          <div className="panel overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-semibold">Next follow-ups</h2>
              <span className="text-sm text-ink/55">{urgentTasks.filter(isOverdue).length} overdue</span>
            </div>
            {urgentTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
