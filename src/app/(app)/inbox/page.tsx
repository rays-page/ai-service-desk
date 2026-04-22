import Link from "next/link";
import { Filter, Inbox } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LeadRow } from "@/components/lead-row";
import { PageHeader } from "@/components/page-header";
import { getWorkspaceData } from "@/lib/data";

export default async function InboxPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const workspace = await getWorkspaceData();
  const source = params.source;
  const stage = params.stage;
  const urgency = params.urgency;

  const leads = workspace.leads.filter((lead) => {
    if (source && lead.source !== source) return false;
    if (stage && lead.stage_id !== stage) return false;
    if (urgency && lead.urgency !== urgency) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Inbox" eyebrow="Unified inbound conversations" />
      <div className="space-y-4 px-5 py-6 lg:px-8">
        <div className="panel flex flex-wrap items-center gap-2 rounded-lg p-3">
          <Filter className="h-4 w-4 text-moss" aria-hidden="true" />
          <Link className="button-secondary" href="/inbox">All</Link>
          {["form", "sms", "email_stub"].map((item) => (
            <Link key={item} className="button-secondary" href={`/inbox?source=${item}`}>{item === "email_stub" ? "Email" : item.toUpperCase()}</Link>
          ))}
          {workspace.stages.map((item) => (
            <Link key={item.id} className="button-secondary" href={`/inbox?stage=${item.id}`}>{item.name}</Link>
          ))}
          {["emergency", "high", "normal", "low"].map((item) => (
            <Link key={item} className="button-secondary" href={`/inbox?urgency=${item}`}>{item}</Link>
          ))}
        </div>

        {leads.length ? (
          <div className="panel overflow-hidden rounded-lg">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No leads match these filters" body="Clear the filters or wait for the next inbound form or SMS lead." />
        )}
      </div>
    </>
  );
}
