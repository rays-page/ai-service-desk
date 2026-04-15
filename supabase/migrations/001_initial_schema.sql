create extension if not exists pgcrypto;

create type public.lead_source as enum ('form', 'sms', 'email_stub');
create type public.lead_urgency as enum ('low', 'normal', 'high', 'emergency');
create type public.message_direction as enum ('inbound', 'outbound', 'internal');
create type public.task_status as enum ('open', 'completed', 'canceled');
create type public.membership_role as enum ('owner', 'dispatcher', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  public_slug text not null unique,
  service_category text not null default 'home services',
  primary_phone text,
  primary_email text,
  timezone text not null default 'America/Chicago',
  business_hours jsonb not null default '{"mon":"8:00-17:00","tue":"8:00-17:00","wed":"8:00-17:00","thu":"8:00-17:00","fri":"8:00-17:00"}'::jsonb,
  follow_up_new_hours integer not null default 2 check (follow_up_new_hours between 1 and 168),
  follow_up_contacted_days integer not null default 3 check (follow_up_contacted_days between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  position integer not null,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, name),
  unique (business_id, position)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default 'Unknown contact',
  phone text,
  email text,
  location_text text,
  preferred_contact_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  stage_id uuid references public.pipeline_stages(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  source public.lead_source not null,
  title text not null,
  service_requested text,
  urgency public.lead_urgency not null default 'normal',
  ai_summary text,
  suggested_reply text,
  extracted_fields jsonb not null default '{}'::jsonb,
  sentiment text,
  budget_hint text,
  tags text[] not null default '{}',
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction public.message_direction not null,
  source public.lead_source,
  body text not null,
  sender_name text,
  sender_phone text,
  sender_email text,
  provider_message_id text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz not null,
  status public.task_status not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid references public.pipeline_stages(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.canned_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null,
  status text not null default 'not_configured',
  config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index contacts_business_idx on public.contacts(business_id);
create index leads_business_stage_idx on public.leads(business_id, stage_id);
create index leads_activity_idx on public.leads(business_id, last_activity_at);
create index messages_conversation_idx on public.messages(conversation_id, created_at);
create index tasks_business_due_idx on public.tasks(business_id, status, due_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger canned_templates_updated_at before update on public.canned_templates for each row execute function public.set_updated_at();
create trigger integration_settings_updated_at before update on public.integration_settings for each row execute function public.set_updated_at();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_memberships bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.canned_templates enable row level security;
alter table public.integration_settings enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());

create policy "business member read" on public.businesses for select using (public.is_business_member(id));
create policy "business owner update" on public.businesses for update using (
  exists (
    select 1 from public.business_memberships bm
    where bm.business_id = businesses.id and bm.user_id = auth.uid() and bm.role in ('owner', 'dispatcher')
  )
) with check (public.is_business_member(id));

create policy "membership member read" on public.business_memberships for select using (public.is_business_member(business_id));

create policy "stage member read" on public.pipeline_stages for select using (public.is_business_member(business_id));
create policy "stage dispatcher write" on public.pipeline_stages for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "contact member read" on public.contacts for select using (public.is_business_member(business_id));
create policy "contact member write" on public.contacts for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "lead member read" on public.leads for select using (public.is_business_member(business_id));
create policy "lead member write" on public.leads for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "conversation member read" on public.conversations for select using (public.is_business_member(business_id));
create policy "conversation member write" on public.conversations for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "message member read" on public.messages for select using (public.is_business_member(business_id));
create policy "message member write" on public.messages for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "task member read" on public.tasks for select using (public.is_business_member(business_id));
create policy "task member write" on public.tasks for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "note member read" on public.notes for select using (public.is_business_member(business_id));
create policy "note member write" on public.notes for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "history member read" on public.lead_stage_history for select using (public.is_business_member(business_id));
create policy "history member write" on public.lead_stage_history for insert with check (public.is_business_member(business_id));

create policy "template member read" on public.canned_templates for select using (public.is_business_member(business_id));
create policy "template member write" on public.canned_templates for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "integration member read" on public.integration_settings for select using (public.is_business_member(business_id));
create policy "integration dispatcher write" on public.integration_settings for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

create policy "audit member read" on public.audit_log for select using (public.is_business_member(business_id));
