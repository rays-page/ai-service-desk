import { z } from "zod";

export const leadFormSchema = z.object({
  business_slug: z.string().min(2),
  contact_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  location_text: z.string().max(240).optional().default(""),
  service_requested: z.string().min(1).max(160),
  message: z.string().min(1).max(4000),
  preferred_contact_method: z.string().max(40).optional().default("unknown")
}).refine((value) => value.phone || value.email, {
  message: "A phone number or email is required.",
  path: ["phone"]
});

export const twilioInboundSchema = z.object({
  MessageSid: z.string().optional(),
  From: z.string().min(1),
  To: z.string().min(1),
  Body: z.string().min(1),
  ProfileName: z.string().optional()
}).passthrough();

export const leadAiRequestSchema = z.object({
  lead_id: z.string().uuid()
});

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  business_name: z.string().trim().min(2).max(120),
  service_category: z.string().trim().min(2).max(120)
});

export const workspaceSetupSchema = signUpSchema.pick({
  business_name: true,
  service_category: true
});

export const twilioSettingsSchema = z.object({
  phone_number: z.string().trim().max(40).optional().default("")
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;
export type TwilioInboundInput = z.infer<typeof twilioInboundSchema>;
