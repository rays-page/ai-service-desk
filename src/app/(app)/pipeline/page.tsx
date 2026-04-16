import Link from "next/link";
import { ArrowRight, KanbanSquare } from "lucide-react";
import { updateLeadStageAction } from "@/app/actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getWorkspaceData } from "@/lib/data";
import { cn, shortTime, urgencyClasses } from "@/lib/utils";

export default async function PipelinePage() {
  const workspace = await getWorkspaceData();

  return (
    <>
      <PageHeader title="Pipeline" eyebrow="Lead stage board" />
      <div className="px-5 py-6 lg:px-8">
        {workspace.leads.length ? (
          <div className="grid gap-4 xl:grid-cols-5">
            {workspace.stages.map((stage) => {
              const leads = workspace.leads.filter((lead) => lead.stage_id === stage.id);

              return (
                <section key={stage.id} className="panel min-h-72 rounded-lg">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <h2 className="font-semibold">{stage.name}</h2>
                    <span className="rounded-full bg-field px-2 py-1 text-xs text-ink/60">{leads.length}</span>
                  </div>
                  <div className="space-y-3 p-3">
                    {leads.map((lead) => (
                      <article key={lead.id} className="rounded-md border border-line bg-white p-3 transition hover:border-moss">
                        <Link href={`/leads/${lead.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-medium leading-5">{lead.title}</h3>
                            <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-medium", urgencyClasses(lead.urgency))}>
                              {lead.urgency}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-ink/58">{lead.contact?.name ?? "Unknown"} | {shortTime(lead.last_activity_at)}</p>
                        </Link>
                        <form action={updateLeadStageAction} className="mt-3 flex items-center gap-2">
                          <input type="hidden" name="lead_id" value={lead.id} />
                          <select name="stage_id" defaultValue={lead.stage_id ?? ""} className="field py-1.5 text-xs">
                            {workspace.stages.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <button className="button-secondary px-2 py-1.5" title="Move lead">
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </form>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={KanbanSquare} title="Pipeline is empty" body="New form or SMS leads will appear in the New column." />
        )}
      </div>
    </>
  );
}
