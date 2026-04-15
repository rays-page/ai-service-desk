import { Save, ShieldCheck } from "lucide-react";
import { updateSettingsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { getWorkspaceData } from "@/lib/data";
import { shortTime } from "@/lib/utils";

export default async function SettingsPage() {
  const workspace = await getWorkspaceData();
  const business = workspace.business;

  return (
    <>
      <PageHeader title="Settings" eyebrow="Business profile and rules" />
      <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <form action={updateSettingsAction} className="panel rounded-lg p-5">
          <input type="hidden" name="business_id" value={business.id} />
          <h2 className="font-semibold">Business profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Business name
              <input className="field mt-2" name="name" defaultValue={business.name} />
            </label>
            <label className="block text-sm font-medium">
              Service category
              <input className="field mt-2" value={business.service_category} readOnly />
            </label>
            <label className="block text-sm font-medium">
              Phone
              <input className="field mt-2" name="primary_phone" defaultValue={business.primary_phone ?? ""} />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input className="field mt-2" name="primary_email" defaultValue={business.primary_email ?? ""} />
            </label>
            <label className="block text-sm font-medium">
              New lead follow-up hours
              <input className="field mt-2" name="follow_up_new_hours" type="number" min="1" max="168" defaultValue={business.follow_up_new_hours} />
            </label>
            <label className="block text-sm font-medium">
              Contacted follow-up days
              <input className="field mt-2" name="follow_up_contacted_days" type="number" min="1" max="30" defaultValue={business.follow_up_contacted_days} />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium">
            Business hours
            <textarea
              className="field mt-2 min-h-28 font-mono text-xs"
              name="business_hours_json"
              defaultValue={JSON.stringify(business.business_hours ?? {}, null, 2)}
            />
          </label>
          <button className="button-primary mt-5">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save settings
          </button>
        </form>

        <div className="space-y-6">
          <section className="panel rounded-lg p-5">
            <h2 className="font-semibold">Integration health</h2>
            <div className="mt-4 space-y-3">
              {workspace.integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-field p-2 text-moss">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{integration.provider.replace("_", " ")}</p>
                      <p className="text-sm text-ink/55">{integration.last_checked_at ? shortTime(integration.last_checked_at) : "Never checked"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-field px-2 py-1 text-xs text-ink/65">{integration.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <h2 className="font-semibold">Canned templates</h2>
            <div className="mt-4 space-y-3">
              {workspace.templates.map((template) => (
                <div key={template.id} className="rounded-md border border-line bg-white p-3">
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/60">{template.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
