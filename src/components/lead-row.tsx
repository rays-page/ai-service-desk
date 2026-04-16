import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import type { Lead } from "@/lib/types";
import { cn, shortTime, sourceLabel, urgencyClasses } from "@/lib/utils";

export function LeadRow({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="grid gap-3 border-b border-line px-4 py-4 transition last:border-b-0 hover:bg-field/70 md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
          <p className="truncate font-medium">{lead.title}</p>
        </div>
        <p className="mt-1 truncate text-sm text-ink/58">{lead.contact?.name ?? "Unknown contact"}</p>
      </div>
      <div className="text-sm">
        <p className="font-medium">{lead.service_requested ?? "Service pending"}</p>
        <p className="mt-1 text-ink/55">{lead.contact?.location_text ?? "No location"}</p>
      </div>
      <div className="flex items-start gap-2 md:block">
        <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", urgencyClasses(lead.urgency))}>
          {lead.urgency}
        </span>
      </div>
      <div className="text-sm">
        <p className="font-medium">{lead.stage?.name ?? "No stage"}</p>
        <p className="mt-1 text-ink/55">{sourceLabel(lead.source)} | {shortTime(lead.last_activity_at)}</p>
      </div>
      <div className="flex items-center justify-end text-ink/40">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </Link>
  );
}
