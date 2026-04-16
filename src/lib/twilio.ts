import "server-only";

import type { IntegrationSetting, TwilioIntegrationConfig, TwilioSetupStatus } from "@/lib/types";

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const TWILIO_INBOUND_PATH = "/api/twilio/inbound";

function normalizeAbsoluteUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeAppUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeTwilioPhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Enter a valid Twilio number in E.164 format, like +13125550100.");
  }

  const normalized =
    trimmed.startsWith("+")
      ? `+${digits}`
      : digits.length === 10
        ? `+1${digits}`
        : digits.length === 11 && digits.startsWith("1")
          ? `+${digits}`
          : `+${digits}`;

  if (!E164_PHONE_REGEX.test(normalized)) {
    throw new Error("Enter a valid Twilio number in E.164 format, like +13125550100.");
  }

  return normalized;
}

export function readTwilioIntegrationConfig(config: Record<string, unknown> | null | undefined): TwilioIntegrationConfig {
  if (!config) return {};

  return {
    phone_number: typeof config.phone_number === "string" ? config.phone_number : undefined,
    phone_number_normalized:
      typeof config.phone_number_normalized === "string" ? config.phone_number_normalized : undefined
  };
}

export function getConfiguredPublicAppUrl() {
  return normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
}

export function getConfiguredTwilioWebhookOverride() {
  return normalizeAbsoluteUrl(process.env.TWILIO_WEBHOOK_URL);
}

export function getTwilioInboundWebhookUrl(requestUrl?: string) {
  const webhookOverride = getConfiguredTwilioWebhookOverride();
  if (webhookOverride) return webhookOverride;

  const publicAppUrl = getConfiguredPublicAppUrl();
  if (publicAppUrl) {
    return new URL(TWILIO_INBOUND_PATH, `${publicAppUrl}/`).toString();
  }

  return normalizeAbsoluteUrl(requestUrl);
}

export function getTwilioSetupSummary(integration?: IntegrationSetting | null) {
  const config = readTwilioIntegrationConfig(integration?.config);
  const mappedPhoneNumber = config.phone_number_normalized ?? config.phone_number ?? "";
  const webhookUrl = getTwilioInboundWebhookUrl();
  const authTokenConfigured = Boolean(process.env.TWILIO_AUTH_TOKEN);
  const webhookOverrideConfigured = Boolean(getConfiguredTwilioWebhookOverride());
  const publicAppUrlConfigured = Boolean(getConfiguredPublicAppUrl());

  let status: TwilioSetupStatus = "healthy";
  let statusMessage = "Inbound SMS is mapped and ready for this business.";

  if (!mappedPhoneNumber) {
    status = "needs_configuration";
    statusMessage = "Add the Twilio number that should route inbound SMS into this business.";
  } else if (!webhookUrl) {
    status = "needs_attention";
    statusMessage = "Set NEXT_PUBLIC_APP_URL or TWILIO_WEBHOOK_URL so the exact webhook URL can be generated.";
  } else if (!authTokenConfigured) {
    status = "needs_attention";
    statusMessage = "Inbound SMS can route, but requests are not signature-validated until TWILIO_AUTH_TOKEN is set.";
  }

  return {
    status,
    statusMessage,
    mappedPhoneNumber,
    webhookUrl,
    authTokenConfigured,
    webhookOverrideConfigured,
    publicAppUrlConfigured
  };
}
