import Link from "next/link";
import { ArrowLeft, Bot, Check, Clipboard, MapPin, MessageSquare, NotebookPen, Phone, UserRound } from "lucide-react";
import { addNoteAction, recordOutboundReplyAction, updateLeadStageAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { getLeadDetail } from "@/lib/data";
import { cn, shortTime, sourceLabel, urgencyClasses } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> | { leadId: string } }) {
  const { leadId } = await params;
  const { workspace, lead, messages, notes } = await getLeadDetail(leadId);

  if (!lead) {
    return (
      <>
        <PageHeader title="Lead not found" eyebrow="Lead detail" />
        <div className="px-5 py-6 lg:px-8">
          <Link href="/inbox" className="button-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to inbox
          </Link>
        </div>
      </>
    );
  }

  const fields = lead.extracted_fields ?? {};
  const extractedRows: Array<[string, string | null | undefined]> = [
    ["Service", fields.service_requested ?? lead.service_requested],
    ["Urgency", fields.urgency ?? lead.urgency],
    ["Preferred contact", fields.preferred_contact_method ?? lead.contact?.preferred_contact_method],
    ["Budget", fields.budget_hint ?? lead.budget_hint],
    ["Sentiment", fields.sentiment ?? lead.sentiment],
    ["Email", fields.email ?? lead.contact?.email],
    ["Summary", fields.concise_summary]
  ];

  return (
    <>
      <PageHeader
        title={lead.title}
        eyebrow={`${sourceLabel(lead.source)} lead · ${lead.stage?.name ?? "No stage"}`}
        action={
          <Link href="/inbox" className="button-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Inbox
          </Link>
        }
      />

      <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1fr_22rem] lg:px-8">
        <div className="space-y-6">
          <section className="panel rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">AI summary</h2>
                <p className="mt-2 leading-7 text-ink/70">{lead.ai_summary ?? "No AI summary has been written yet."}</p>
              </div>
              <span className={cn("rounded-full px-2 py-1 text-xs font-medium", urgencyClasses(lead.urgency))}>{lead.urgency}</span>
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-moss" aria-hidden="true" />
              <h2 className="font-semibold">Suggested reply</h2>
            </div>
            <form action={recordOutboundReplyAction} className="mt-4 space-y-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <textarea
                className="field min-h-32 leading-7"
                name="body"
                defaultValue={lead.suggested_reply ?? "Generate a suggested reply from the server route when AI is configured."}
              />
              <button className="button-primary">Record reply sent</button>
            </form>
          </section>

          <section className="panel overflow-hidden rounded-lg">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">Message timeline</h2>
            </div>
            <div className="divide-y divide-line">
              {messages.length ? (
                messages.map((message) => (
                  <article key={message.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className={cn("h-4 w-4", message.direction === "inbound" ? "text-sky" : "text-moss")} aria-hidden="true" />
                        <p className="font-medium">{message.direction === "inbound" ? message.sender_name ?? "Customer" : "Office"}</p>
                      </div>
                      <p className="text-sm text-ink/50">{shortTime(message.created_at)}</p>
                    </div>
                    <p className="mt-2 leading-7 text-ink/72">{message.body}</p>
                  </article>
                ))
              ) : (
                <p className="px-5 py-6 text-sm text-ink/58">No messages have been stored for this conversation yet.</p>
              )}
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-moss" aria-hidden="true" />
              <h2 className="font-semibold">Notes</h2>
            </div>
            <form action={addNoteAction} className="mt-4 flex gap-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <input className="field" name="body" placeholder="Add an internal note" />
              <button className="button-primary">Add</button>
            </form>
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-md border border-line bg-white p-3">
                  <p className="text-sm leading-6">{note.body}</p>
                  <p className="mt-2 text-xs text-ink/48">{shortTime(note.created_at)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel rounded-lg p-5">
            <h2 className="font-semibold">Contact</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-moss" aria-hidden="true" />
                {lead.contact?.name ?? fields.contact_name ?? "Unknown contact"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-moss" aria-hidden="true" />
                {lead.contact?.phone ?? fields.phone ?? "No phone"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-moss" aria-hidden="true" />
                {lead.contact?.location_text ?? fields.location_text ?? "No location"}
              </p>
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <h2 className="font-semibold">Stage</h2>
            <form action={updateLeadStageAction} className="mt-4 space-y-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <select className="field" name="stage_id" defaultValue={lead.stage_id ?? ""}>
                {workspace.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <button className="button-primary w-full">
                <Check className="h-4 w-4" aria-hidden="true" />
                Update stage
              </button>
            </form>
          </section>

          <section className="panel rounded-lg p-5">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-moss" aria-hidden="true" />
              <h2 className="font-semibold">Extracted fields</h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {extractedRows.map(([label, value]) => (
                <div key={label} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <dt className="text-ink/48">{label}</dt>
                  <dd className="mt-1 font-medium">{value || "Not captured"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel rounded-lg p-5">
            <h2 className="font-semibold">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead.tags.length ? (
                lead.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-field px-2 py-1 text-xs text-ink/65">{tag}</span>
                ))
              ) : (
                <span className="text-sm text-ink/55">No tags</span>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
