import type {
  Business,
  CannedTemplate,
  IntegrationSetting,
  Lead,
  Message,
  Note,
  PipelineStage,
  Task,
  WorkspaceData
} from "@/lib/types";

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60_000).toISOString();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60_000).toISOString();
const daysFromNow = (days: number) => new Date(now + days * 24 * 60 * 60_000).toISOString();

export const demoBusiness: Business = {
  id: "10000000-0000-0000-0000-000000000001",
  name: "Demo Service Co.",
  public_slug: "demo-service-co",
  service_category: "HVAC and plumbing",
  primary_phone: "+13125550100",
  primary_email: "dispatch@demo-service.co",
  timezone: "America/Chicago",
  follow_up_new_hours: 2,
  follow_up_contacted_days: 3,
  business_hours: {
    mon: "8:00-17:00",
    tue: "8:00-17:00",
    wed: "8:00-17:00",
    thu: "8:00-17:00",
    fri: "8:00-17:00"
  }
};

export const demoStages: PipelineStage[] = [
  { id: "stage-new", business_id: demoBusiness.id, name: "New", position: 1, is_terminal: false },
  { id: "stage-contacted", business_id: demoBusiness.id, name: "Contacted", position: 2, is_terminal: false },
  { id: "stage-quote", business_id: demoBusiness.id, name: "Quote Sent", position: 3, is_terminal: false },
  { id: "stage-booked", business_id: demoBusiness.id, name: "Booked", position: 4, is_terminal: true },
  { id: "stage-lost", business_id: demoBusiness.id, name: "Lost", position: 5, is_terminal: true }
];

export const demoLeads: Lead[] = [
  {
    id: "lead-maya",
    business_id: demoBusiness.id,
    contact_id: "contact-maya",
    stage_id: "stage-new",
    source: "form",
    title: "AC stopped cooling upstairs",
    service_requested: "AC repair",
    urgency: "emergency",
    ai_summary: "Maya needs same-day help for an upstairs AC that stopped cooling in Oak Park.",
    suggested_reply:
      "Hi Maya, thanks for reaching out. We can help with the AC issue today. What time window works best for a technician to come by?",
    extracted_fields: {
      contact_name: "Maya Ortiz",
      phone: "+13125550144",
      email: "maya@example.com",
      location_text: "Oak Park, IL",
      service_requested: "AC repair",
      urgency: "emergency",
      preferred_contact_method: "sms",
      budget_hint: "not mentioned",
      sentiment: "stressed",
      concise_summary: "Same-day AC repair request in Oak Park."
    },
    sentiment: "stressed",
    budget_hint: "not mentioned",
    tags: ["same-day", "hot lead"],
    last_inbound_at: minutesAgo(45),
    last_outbound_at: null,
    last_activity_at: minutesAgo(45),
    created_at: minutesAgo(45),
    contact: {
      id: "contact-maya",
      business_id: demoBusiness.id,
      name: "Maya Ortiz",
      phone: "+13125550144",
      email: "maya@example.com",
      location_text: "Oak Park, IL",
      preferred_contact_method: "sms"
    },
    stage: demoStages[0]
  },
  {
    id: "lead-evan",
    business_id: demoBusiness.id,
    contact_id: "contact-evan",
    stage_id: "stage-contacted",
    source: "sms",
    title: "Water heater pilot issue",
    service_requested: "Water heater repair",
    urgency: "high",
    ai_summary: "Evan texted about a water heater pilot that will not stay lit and prefers a phone call.",
    suggested_reply:
      "Hi Evan, we can take a look at the water heater. Are you available for a quick call so we can confirm the model and schedule a visit?",
    extracted_fields: {
      contact_name: "Evan Brooks",
      phone: "+13125550177",
      email: "",
      location_text: "Logan Square, Chicago",
      service_requested: "Water heater repair",
      urgency: "high",
      preferred_contact_method: "phone",
      budget_hint: "not mentioned",
      sentiment: "concerned",
      concise_summary: "Water heater pilot will not stay lit."
    },
    sentiment: "concerned",
    budget_hint: "not mentioned",
    tags: ["sms"],
    last_inbound_at: daysAgo(2),
    last_outbound_at: daysAgo(2),
    last_activity_at: daysAgo(2),
    created_at: daysAgo(2),
    contact: {
      id: "contact-evan",
      business_id: demoBusiness.id,
      name: "Evan Brooks",
      phone: "+13125550177",
      email: "evan@example.com",
      location_text: "Logan Square, Chicago",
      preferred_contact_method: "phone"
    },
    stage: demoStages[1]
  },
  {
    id: "lead-priya",
    business_id: demoBusiness.id,
    contact_id: "contact-priya",
    stage_id: "stage-quote",
    source: "form",
    title: "Spring AC tune-up quote",
    service_requested: "AC maintenance",
    urgency: "normal",
    ai_summary: "Priya requested a quote for spring AC maintenance at an Evanston home.",
    suggested_reply: "Hi Priya, we can quote the spring AC tune-up. How many systems should we include?",
    extracted_fields: {
      contact_name: "Priya Shah",
      phone: "+13125550188",
      email: "priya@example.com",
      location_text: "Evanston, IL",
      service_requested: "AC maintenance",
      urgency: "normal",
      preferred_contact_method: "email",
      budget_hint: "asked for quote",
      sentiment: "neutral",
      concise_summary: "Quote request for spring AC tune-up."
    },
    sentiment: "neutral",
    budget_hint: "asked for quote",
    tags: ["quote"],
    last_inbound_at: daysAgo(5),
    last_outbound_at: daysAgo(4),
    last_activity_at: daysAgo(4),
    created_at: daysAgo(5),
    contact: {
      id: "contact-priya",
      business_id: demoBusiness.id,
      name: "Priya Shah",
      phone: "+13125550188",
      email: "priya@example.com",
      location_text: "Evanston, IL",
      preferred_contact_method: "email"
    },
    stage: demoStages[2]
  },
  {
    id: "lead-cal",
    business_id: demoBusiness.id,
    contact_id: "contact-cal",
    stage_id: "stage-booked",
    source: "sms",
    title: "Booked drain clearing",
    service_requested: "Drain clearing",
    urgency: "normal",
    ai_summary: "Cal booked a drain clearing visit for tomorrow morning in Berwyn.",
    suggested_reply: "You are booked for tomorrow morning. Reply here if anything changes.",
    extracted_fields: {
      contact_name: "Cal Morgan",
      phone: "+13125550199",
      email: "",
      location_text: "Berwyn, IL",
      service_requested: "Drain clearing",
      urgency: "normal",
      preferred_contact_method: "sms",
      budget_hint: "not mentioned",
      sentiment: "positive",
      concise_summary: "Drain clearing appointment booked."
    },
    sentiment: "positive",
    budget_hint: "not mentioned",
    tags: ["booked"],
    last_inbound_at: daysAgo(1),
    last_outbound_at: hoursAgo(20),
    last_activity_at: hoursAgo(20),
    created_at: daysAgo(1),
    contact: {
      id: "contact-cal",
      business_id: demoBusiness.id,
      name: "Cal Morgan",
      phone: "+13125550199",
      email: null,
      location_text: "Berwyn, IL",
      preferred_contact_method: "sms"
    },
    stage: demoStages[3]
  },
  {
    id: "lead-nina",
    business_id: demoBusiness.id,
    contact_id: "contact-nina",
    stage_id: "stage-lost",
    source: "email_stub",
    title: "Lost cleaning estimate",
    service_requested: "Duct cleaning",
    urgency: "low",
    ai_summary: "Nina asked about duct cleaning pricing, then chose another provider.",
    suggested_reply: "Thanks for considering us. We are here if you need future HVAC help.",
    extracted_fields: {
      contact_name: "Nina Patel",
      phone: "+13125550222",
      email: "nina@example.com",
      location_text: "Cicero, IL",
      service_requested: "Duct cleaning",
      urgency: "low",
      preferred_contact_method: "email",
      budget_hint: "price sensitive",
      sentiment: "neutral",
      concise_summary: "Duct cleaning estimate lost to another provider."
    },
    sentiment: "neutral",
    budget_hint: "price sensitive",
    tags: ["lost"],
    last_inbound_at: daysAgo(9),
    last_outbound_at: daysAgo(8),
    last_activity_at: daysAgo(8),
    created_at: daysAgo(9),
    contact: {
      id: "contact-nina",
      business_id: demoBusiness.id,
      name: "Nina Patel",
      phone: "+13125550222",
      email: "nina@example.com",
      location_text: "Cicero, IL",
      preferred_contact_method: "email"
    },
    stage: demoStages[4]
  }
];

export const demoMessages: Message[] = [
  {
    id: "msg-maya-1",
    business_id: demoBusiness.id,
    conversation_id: "conv-maya",
    direction: "inbound",
    source: "form",
    body: "The upstairs AC stopped cooling and the house is getting hot. Can someone come today?",
    sender_name: "Maya Ortiz",
    sender_phone: "+13125550144",
    sender_email: "maya@example.com",
    created_at: minutesAgo(45)
  },
  {
    id: "msg-evan-1",
    business_id: demoBusiness.id,
    conversation_id: "conv-evan",
    direction: "inbound",
    source: "sms",
    body: "Hi, our water heater pilot keeps going out. Can you call me?",
    sender_name: "Evan Brooks",
    sender_phone: "+13125550177",
    created_at: daysAgo(2)
  },
  {
    id: "msg-evan-2",
    business_id: demoBusiness.id,
    conversation_id: "conv-evan",
    direction: "outbound",
    source: "sms",
    body: "Hi Evan, yes. I can call shortly and get this scheduled.",
    sender_name: "Demo Service Co.",
    created_at: daysAgo(2)
  }
];

export const demoTasks: Task[] = [
  {
    id: "task-maya",
    business_id: demoBusiness.id,
    lead_id: "lead-maya",
    title: "Reply to Maya",
    description: "New emergency lead has not received an outbound response.",
    due_at: minutesAgo(15),
    status: "open",
    lead: { id: "lead-maya", title: "AC stopped cooling upstairs", urgency: "emergency" }
  },
  {
    id: "task-evan",
    business_id: demoBusiness.id,
    lead_id: "lead-evan",
    title: "Check back with Evan",
    description: "Contacted lead has been quiet after initial call.",
    due_at: daysFromNow(1),
    status: "open",
    lead: { id: "lead-evan", title: "Water heater pilot issue", urgency: "high" }
  },
  {
    id: "task-priya",
    business_id: demoBusiness.id,
    lead_id: "lead-priya",
    title: "Send maintenance quote",
    description: "Prepare and send the spring tune-up quote.",
    due_at: daysAgo(1),
    status: "completed",
    completed_at: hoursAgo(20),
    lead: { id: "lead-priya", title: "Spring AC tune-up quote", urgency: "normal" }
  }
];

export const demoNotes: Note[] = [
  {
    id: "note-maya",
    business_id: demoBusiness.id,
    lead_id: "lead-maya",
    author_id: "demo-user",
    body: "Likely compressor issue. Prioritize today if route opens.",
    created_at: minutesAgo(30)
  },
  {
    id: "note-priya",
    business_id: demoBusiness.id,
    lead_id: "lead-priya",
    author_id: "demo-user",
    body: "Customer wants maintenance before warmer weather.",
    created_at: daysAgo(4)
  }
];

export const demoTemplates: CannedTemplate[] = [
  {
    id: "template-first-reply",
    business_id: demoBusiness.id,
    name: "First reply",
    body: "Hi {{contact_name}}, thanks for reaching out. We can help with {{service_requested}}. What time window works best?",
    is_active: true
  },
  {
    id: "template-follow-up",
    business_id: demoBusiness.id,
    name: "Follow-up",
    body: "Hi {{contact_name}}, just checking in to see if you still need help with {{service_requested}}.",
    is_active: true
  }
];

export const demoIntegrations: IntegrationSetting[] = [
  {
    id: "integration-form",
    business_id: demoBusiness.id,
    provider: "web_form",
    status: "healthy",
    config: { public_slug: "demo-service-co" },
    last_checked_at: minutesAgo(10)
  },
  {
    id: "integration-twilio",
    business_id: demoBusiness.id,
    provider: "twilio_sms",
    status: "needs_configuration",
    config: { phone_number: "+13125550100" },
    last_checked_at: hoursAgo(2)
  },
  {
    id: "integration-email",
    business_id: demoBusiness.id,
    provider: "email_stub",
    status: "stub_only",
    config: { forwarding_address: "leads@demo-service.co" },
    last_checked_at: daysAgo(1)
  }
];

export const demoWorkspace: WorkspaceData = {
  business: demoBusiness,
  stages: demoStages,
  leads: demoLeads,
  tasks: demoTasks,
  templates: demoTemplates,
  integrations: demoIntegrations
};
