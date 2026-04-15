import twilio from "twilio";
import {
  createLeadFromInbound,
  mapTwilioInputToIntake,
  resolveTwilioBusinessSlug
} from "@/lib/intake";
import { twilioInboundSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody).entries());
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL || request.url;

  if (process.env.TWILIO_AUTH_TOKEN) {
    const valid = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, webhookUrl, params);
    if (!valid) {
      return new Response("Invalid Twilio signature", { status: 403 });
    }
  }

  const parsed = twilioInboundSchema.safeParse(params);
  const response = new twilio.twiml.MessagingResponse();

  if (!parsed.success) {
    response.message("We could not read that message. Please call the office for help.");
    return new Response(response.toString(), {
      status: 200,
      headers: { "content-type": "text/xml" }
    });
  }

  try {
    const businessSlug = await resolveTwilioBusinessSlug(parsed.data);
    await createLeadFromInbound(mapTwilioInputToIntake(parsed.data, businessSlug));
  } catch {
    response.message("Thanks for the message. The office has been notified and will follow up.");
  }

  return new Response(response.toString(), {
    status: 200,
    headers: { "content-type": "text/xml" }
  });
}
