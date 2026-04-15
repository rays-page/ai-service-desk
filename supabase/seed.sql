insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'owner@demo-service.co',
  crypt('demo-password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Jordan Lee"}'::jsonb
) on conflict (id) do nothing;

insert into public.profiles (id, full_name)
values ('00000000-0000-0000-0000-000000000001', 'Jordan Lee')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.businesses (
  id,
  name,
  public_slug,
  service_category,
  primary_phone,
  primary_email,
  timezone,
  follow_up_new_hours,
  follow_up_contacted_days
) values (
  '10000000-0000-0000-0000-000000000001',
  'Demo Service Co.',
  'demo-service-co',
  'HVAC and plumbing',
  '+13125550100',
  'dispatch@demo-service.co',
  'America/Chicago',
  2,
  3
) on conflict (id) do update set
  name = excluded.name,
  public_slug = excluded.public_slug,
  service_category = excluded.service_category;

insert into public.business_memberships (business_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner')
on conflict (business_id, user_id) do update set role = excluded.role;

insert into public.pipeline_stages (id, business_id, name, position, is_terminal)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'New', 1, false),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Contacted', 2, false),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Quote Sent', 3, false),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Booked', 4, true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Lost', 5, true)
on conflict (id) do update set name = excluded.name, position = excluded.position, is_terminal = excluded.is_terminal;

insert into public.contacts (id, business_id, name, phone, email, location_text, preferred_contact_method)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Maya Ortiz', '+13125550144', 'maya@example.com', 'Oak Park, IL', 'sms'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Evan Brooks', '+13125550177', 'evan@example.com', 'Logan Square, Chicago', 'phone'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Priya Shah', '+13125550188', 'priya@example.com', 'Evanston, IL', 'email'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Cal Morgan', '+13125550199', null, 'Berwyn, IL', 'sms'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Nina Patel', '+13125550222', 'nina@example.com', 'Cicero, IL', 'email')
on conflict (id) do update set name = excluded.name, phone = excluded.phone, email = excluded.email;

insert into public.leads (
  id,
  business_id,
  contact_id,
  stage_id,
  owner_id,
  source,
  title,
  service_requested,
  urgency,
  ai_summary,
  suggested_reply,
  extracted_fields,
  sentiment,
  budget_hint,
  tags,
  last_inbound_at,
  last_outbound_at,
  last_activity_at,
  created_at
) values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'form',
    'AC stopped cooling upstairs',
    'AC repair',
    'emergency',
    'Maya needs same-day help for an upstairs AC that stopped cooling in Oak Park.',
    'Hi Maya, thanks for reaching out. We can help with the AC issue today. What time window works best for a technician to come by?',
    '{"contact_name":"Maya Ortiz","phone":"+13125550144","email":"maya@example.com","location_text":"Oak Park, IL","service_requested":"AC repair","urgency":"emergency","preferred_contact_method":"sms","budget_hint":"not mentioned","sentiment":"stressed","concise_summary":"Same-day AC repair request in Oak Park."}'::jsonb,
    'stressed',
    'not mentioned',
    '{"same-day","hot lead"}',
    now() - interval '45 minutes',
    null,
    now() - interval '45 minutes',
    now() - interval '45 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'sms',
    'Water heater pilot issue',
    'Water heater repair',
    'high',
    'Evan texted about a water heater pilot that will not stay lit and prefers a phone call.',
    'Hi Evan, we can take a look at the water heater. Are you available for a quick call so we can confirm the model and schedule a visit?',
    '{"contact_name":"Evan Brooks","phone":"+13125550177","email":"","location_text":"Logan Square, Chicago","service_requested":"Water heater repair","urgency":"high","preferred_contact_method":"phone","budget_hint":"not mentioned","sentiment":"concerned","concise_summary":"Water heater pilot will not stay lit."}'::jsonb,
    'concerned',
    'not mentioned',
    '{"sms"}',
    now() - interval '2 days',
    now() - interval '2 days',
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'form',
    'Spring AC tune-up quote',
    'AC maintenance',
    'normal',
    'Priya requested a quote for spring AC maintenance at an Evanston home.',
    'Hi Priya, we can quote the spring AC tune-up. How many systems should we include?',
    '{"contact_name":"Priya Shah","phone":"+13125550188","email":"priya@example.com","location_text":"Evanston, IL","service_requested":"AC maintenance","urgency":"normal","preferred_contact_method":"email","budget_hint":"asked for quote","sentiment":"neutral","concise_summary":"Quote request for spring AC tune-up."}'::jsonb,
    'neutral',
    'asked for quote',
    '{"quote"}',
    now() - interval '5 days',
    now() - interval '4 days',
    now() - interval '4 days',
    now() - interval '5 days'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'sms',
    'Booked drain clearing',
    'Drain clearing',
    'normal',
    'Cal booked a drain clearing visit for tomorrow morning in Berwyn.',
    'You are booked for tomorrow morning. Reply here if anything changes.',
    '{"contact_name":"Cal Morgan","phone":"+13125550199","email":"","location_text":"Berwyn, IL","service_requested":"Drain clearing","urgency":"normal","preferred_contact_method":"sms","budget_hint":"not mentioned","sentiment":"positive","concise_summary":"Drain clearing appointment booked."}'::jsonb,
    'positive',
    'not mentioned',
    '{"booked"}',
    now() - interval '1 day',
    now() - interval '20 hours',
    now() - interval '20 hours',
    now() - interval '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'email_stub',
    'Lost cleaning estimate',
    'Duct cleaning',
    'low',
    'Nina asked about duct cleaning pricing, then chose another provider.',
    'Thanks for considering us. We are here if you need future HVAC help.',
    '{"contact_name":"Nina Patel","phone":"+13125550222","email":"nina@example.com","location_text":"Cicero, IL","service_requested":"Duct cleaning","urgency":"low","preferred_contact_method":"email","budget_hint":"price sensitive","sentiment":"neutral","concise_summary":"Duct cleaning estimate lost to another provider."}'::jsonb,
    'neutral',
    'price sensitive',
    '{"lost"}',
    now() - interval '9 days',
    now() - interval '8 days',
    now() - interval '8 days',
    now() - interval '9 days'
  )
on conflict (id) do update set title = excluded.title, stage_id = excluded.stage_id, ai_summary = excluded.ai_summary;

insert into public.conversations (id, business_id, lead_id, subject)
values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'AC stopped cooling upstairs'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Water heater pilot issue'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Spring AC tune-up quote'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'Booked drain clearing'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'Lost cleaning estimate')
on conflict (lead_id) do update set subject = excluded.subject;

insert into public.messages (id, business_id, conversation_id, direction, source, body, sender_name, sender_phone, sender_email, created_at)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'inbound', 'form', 'The upstairs AC stopped cooling and the house is getting hot. Can someone come today?', 'Maya Ortiz', '+13125550144', 'maya@example.com', now() - interval '45 minutes'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'inbound', 'sms', 'Hi, our water heater pilot keeps going out. Can you call me?', 'Evan Brooks', '+13125550177', null, now() - interval '2 days'),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'outbound', 'sms', 'Hi Evan, yes. I can call shortly and get this scheduled.', 'Demo Service Co.', '+13125550100', null, now() - interval '2 days'),
  ('70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'inbound', 'form', 'Looking for a quote for spring AC maintenance before May.', 'Priya Shah', '+13125550188', 'priya@example.com', now() - interval '5 days'),
  ('70000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'inbound', 'sms', 'Drain is backing up in the basement sink.', 'Cal Morgan', '+13125550199', null, now() - interval '1 day'),
  ('70000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'outbound', 'sms', 'We have you booked for tomorrow morning.', 'Demo Service Co.', '+13125550100', null, now() - interval '20 hours')
on conflict (id) do nothing;

insert into public.tasks (id, business_id, lead_id, assigned_to, title, description, due_at, status, completed_at)
values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Reply to Maya', 'New emergency lead has not received an outbound response.', now() - interval '15 minutes', 'open', null),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Check back with Evan', 'Contacted lead has been quiet after initial call.', now() + interval '1 day', 'open', null),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Send maintenance quote', 'Prepare and send the spring tune-up quote.', now() - interval '1 day', 'completed', now() - interval '20 hours')
on conflict (id) do update set title = excluded.title, status = excluded.status, due_at = excluded.due_at;

insert into public.notes (id, business_id, lead_id, author_id, body)
values
  ('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Likely compressor issue. Prioritize today if route opens.'),
  ('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Customer wants maintenance before warmer weather.')
on conflict (id) do nothing;

insert into public.canned_templates (id, business_id, name, body)
values
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'First reply', 'Hi {{contact_name}}, thanks for reaching out. We can help with {{service_requested}}. What time window works best?'),
  ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Follow-up', 'Hi {{contact_name}}, just checking in to see if you still need help with {{service_requested}}.'),
  ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Booked confirmation', 'You are booked for {{appointment_window}}. Reply here if anything changes.')
on conflict (id) do update set name = excluded.name, body = excluded.body;

insert into public.integration_settings (business_id, provider, status, config, last_checked_at)
values
  ('10000000-0000-0000-0000-000000000001', 'web_form', 'healthy', '{"public_slug":"demo-service-co"}'::jsonb, now()),
  ('10000000-0000-0000-0000-000000000001', 'twilio_sms', 'needs_configuration', '{"phone_number":"+13125550100"}'::jsonb, now()),
  ('10000000-0000-0000-0000-000000000001', 'email_stub', 'stub_only', '{"forwarding_address":"leads@demo-service.co"}'::jsonb, now())
on conflict (business_id, provider) do update set status = excluded.status, config = excluded.config;
