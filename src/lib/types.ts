export type LeadSource = "form" | "sms" | "email_stub";
export type LeadUrgency = "low" | "normal" | "high" | "emergency";
export type MessageDirection = "inbound" | "outbound" | "internal";
export type TaskStatus = "open" | "completed" | "canceled";

export type Business = {
  id: string;
  name: string;
  public_slug: string;
  service_category: string;
  primary_phone?: string | null;
  primary_email?: string | null;
  timezone: string;
  follow_up_new_hours: number;
  follow_up_contacted_days: number;
  business_hours?: Record<string, string>;
};

export type PipelineStage = {
  id: string;
  business_id: string;
  name: "New" | "Contacted" | "Quote Sent" | "Booked" | "Lost" | string;
  position: number;
  is_terminal: boolean;
};

export type Contact = {
  id: string;
  business_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  location_text?: string | null;
  preferred_contact_method?: string | null;
};

export type ExtractedFields = {
  contact_name: string;
  phone: string;
  email: string;
  location_text: string;
  service_requested: string;
  urgency: LeadUrgency;
  preferred_contact_method: string;
  budget_hint: string;
  sentiment: string;
  concise_summary: string;
};

export type Lead = {
  id: string;
  business_id: string;
  contact_id: string;
  stage_id: string | null;
  owner_id?: string | null;
  source: LeadSource;
  title: string;
  service_requested?: string | null;
  urgency: LeadUrgency;
  ai_summary?: string | null;
  suggested_reply?: string | null;
  extracted_fields: Partial<ExtractedFields>;
  sentiment?: string | null;
  budget_hint?: string | null;
  tags: string[];
  last_inbound_at?: string | null;
  last_outbound_at?: string | null;
  last_activity_at: string;
  created_at: string;
  contact?: Contact;
  stage?: PipelineStage | null;
};

export type Conversation = {
  id: string;
  business_id: string;
  lead_id: string;
  subject?: string | null;
};

export type Message = {
  id: string;
  business_id: string;
  conversation_id: string;
  direction: MessageDirection;
  source?: LeadSource | null;
  body: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  business_id: string;
  lead_id?: string | null;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  due_at: string;
  status: TaskStatus;
  completed_at?: string | null;
  lead?: Pick<Lead, "id" | "title" | "urgency"> | null;
};

export type Note = {
  id: string;
  business_id: string;
  lead_id: string;
  author_id?: string | null;
  body: string;
  created_at: string;
};

export type CannedTemplate = {
  id: string;
  business_id: string;
  name: string;
  body: string;
  is_active: boolean;
};

export type IntegrationSetting = {
  id: string;
  business_id: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  last_checked_at?: string | null;
};

export type WorkspaceData = {
  business: Business;
  stages: PipelineStage[];
  leads: Lead[];
  tasks: Task[];
  templates: CannedTemplate[];
  integrations: IntegrationSetting[];
};
