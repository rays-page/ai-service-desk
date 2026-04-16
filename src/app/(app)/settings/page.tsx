import { ExternalLink, MessageSquareMore, Save, ShieldCheck } from "lucide-react";
import { updateSettingsAction, updateTwilioSettingsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { getWorkspaceData } from "@/lib/data";
import { getTwilioSetupSummary, readTwilioIntegrationConfig } from "@/lib/twilio";
import { shortTime } from "@/lib/utils";

export default async function SettingsPage() {
  const workspace = await getWorkspaceData();
  const business = workspace.business;
  const twilioIntegration = workspace.integrations.find((integration) => integration.provider === "twilio_sms");
  const twilioConfig = readTwilioIntegrationConfig(twilioIntegration?.config);
  const twilioSetup = getTwilioSetupSummary(twilioIntegration);
  const twilioStatusClasses =
    twilioSetup.status === "healthy"
      ? "bg-moss/10 text-moss"
      : twilioSetup.status === "needs_attention"
        ? "bg-amber/15 text-amber"
        : "bg-field text-ink/65";

  return (
    <>
      <PageHeader title="Settings" eyebrow="Business profile and rules" />
      <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <form action={updateSettingsAction} className="panel rounded-lg p-5">
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Twilio inbound SMS</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  Map the Twilio number for this business, then paste the webhook URL into Twilio so inbound texts land in the inbox.
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${twilioStatusClasses}`}>
                {twilioSetup.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-4 rounded-md border border-line bg-white p-4">
              <p className="text-sm font-medium">Current status</p>
              <p className="mt-1 text-sm leading-6 text-ink/60">{twilioSetup.statusMessage}</p>
            </div>

            <form action={updateTwilioSettingsAction} className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Twilio business number
                <input
                  className="field mt-2"
                  name="phone_number"
                  placeholder="+13125550100"
                  defaultValue={twilioConfig.phone_number ?? business.primary_phone ?? ""}
                />
                <span className="mt-2 block text-xs leading-5 text-ink/55">
                  Use the number Twilio sends inbound SMS to. Formatting like <code>+1 (312) 555-0100</code> is fine; it will be saved in E.164.
                </span>
              </label>

              <div>
                <p className="text-sm font-medium">Webhook URL</p>
                <input className="field mt-2 font-mono text-xs" readOnly value={twilioSetup.webhookUrl ?? ""} />
                <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-ink/55">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Set your Twilio Messaging webhook to this exact URL with HTTP POST.</span>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-line bg-field/70 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-ink">Signature validation</p>
                  <p className="mt-1 text-ink/60">{twilioSetup.authTokenConfigured ? "Enabled via TWILIO_AUTH_TOKEN" : "Disabled until TWILIO_AUTH_TOKEN is set"}</p>
                </div>
                <div>
                  <p className="font-medium text-ink">Webhook source</p>
                  <p className="mt-1 text-ink/60">
                    {twilioSetup.webhookOverrideConfigured
                      ? "Using TWILIO_WEBHOOK_URL override"
                      : twilioSetup.publicAppUrlConfigured
                        ? "Built from NEXT_PUBLIC_APP_URL"
                        : "Missing public app URL"}
                  </p>
                </div>
              </div>

              <button className="button-primary">
                <MessageSquareMore className="h-4 w-4" aria-hidden="true" />
                Save Twilio settings
              </button>
            </form>

            <ol className="mt-4 space-y-2 text-sm leading-6 text-ink/60">
              <li>1. Save the Twilio number that receives inbound texts for this business.</li>
              <li>2. In Twilio, set the incoming message webhook to the URL shown above using HTTP POST.</li>
              <li>3. Keep <code>TWILIO_AUTH_TOKEN</code> on the server so webhook signatures are verified.</li>
            </ol>
          </section>

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
