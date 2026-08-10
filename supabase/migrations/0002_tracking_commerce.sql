-- ============================================================
-- Migration 0002: referral tracking, attribution, Patreon,
-- conversions, commissions, content, payouts, compliance, audit
-- ============================================================

-- ---------- referral tracking ----------
create table referral_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliate_profiles(id) on delete cascade,
  campaign_id uuid references campaigns(id),
  offer_id uuid not null references offers(id),
  slug text not null,
  destination_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (affiliate_id, offer_id, slug)
);

create table click_events (
  id uuid primary key default gen_random_uuid(),
  click_id text not null unique, -- signed click identifier
  referral_link_id uuid not null references referral_links(id),
  affiliate_id uuid not null references affiliate_profiles(id),
  campaign_id uuid references campaigns(id),
  offer_id uuid references offers(id),
  utm jsonb not null default '{}'::jsonb,
  landing_page text,
  referrer text,
  visitor_id text, -- anonymous first-party identifier; no fingerprinting
  user_agent_class text, -- coarse device class only
  is_suspected_bot boolean not null default false,
  clicked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_click_events_affiliate_time on click_events(affiliate_id, clicked_at desc);
create index idx_click_events_visitor on click_events(visitor_id, clicked_at desc);

create table patreon_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  patreon_user_id text not null unique,
  email_hash text,
  access_token_encrypted text, -- encrypted at rest; never exposed via RLS
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  affiliate_id uuid references affiliate_profiles(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  offer_id uuid references offers(id),
  code_type text not null default 'product' check (code_type in ('product','membership')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attributions (
  id uuid primary key default gen_random_uuid(),
  method attribution_method not null,
  affiliate_id uuid references affiliate_profiles(id),
  click_event_id uuid references click_events(id),
  discount_code_id uuid references discount_codes(id),
  patreon_identity_id uuid references patreon_identities(id),
  manual_claim_note text,
  approved_by uuid references profiles(id),
  window_days int not null default 30,
  self_referral_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'patreon',
  event_type text not null,
  external_event_id text,
  signature_verified boolean not null default false,
  raw_payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_event_id) -- idempotency
);

-- ---------- conversions & commissions ----------
create table conversions (
  id uuid primary key default gen_random_uuid(),
  external_transaction_id text not null,
  source text not null default 'patreon_membership' check (source in ('patreon_membership','patreon_shop_import','manual','whop')),
  offer_id uuid not null references offers(id),
  attribution_id uuid references attributions(id),
  customer_ref_hash text, -- masked customer identity
  payment_number int not null default 1 check (payment_number >= 1),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  tax_amount_minor bigint not null default 0 check (tax_amount_minor >= 0),
  discount_amount_minor bigint not null default 0 check (discount_amount_minor >= 0),
  platform_fee_minor bigint not null default 0 check (platform_fee_minor >= 0),
  processing_fee_minor bigint not null default 0 check (processing_fee_minor >= 0),
  refund_amount_minor bigint not null default 0 check (refund_amount_minor >= 0),
  chargeback_amount_minor bigint not null default 0 check (chargeback_amount_minor >= 0),
  fx_fee_minor bigint not null default 0 check (fx_fee_minor >= 0),
  payout_fee_minor bigint not null default 0 check (payout_fee_minor >= 0),
  net_collected_revenue_minor bigint not null default 0 check (net_collected_revenue_minor >= 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_transaction_id) -- duplicate-import protection
);
create index idx_conversions_offer on conversions(offer_id);
create index idx_conversions_occurred on conversions(occurred_at desc);

create table commission_entries (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid not null references conversions(id),
  affiliate_id uuid not null references affiliate_profiles(id),
  rule_version int not null,
  entry_kind text not null default 'retail' check (entry_kind in ('retail','team_lead_override','adjustment','reversal')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  rate_bps int not null check (rate_bps between 0 and 10000),
  commission_amount_minor bigint not null, -- may be negative for reversals
  status commission_status not null default 'estimated',
  hold_release_at timestamptz,
  payout_item_id uuid,
  adjustment_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entry_kind != 'adjustment' or adjustment_reason is not null)
);
create index idx_commissions_affiliate on commission_entries(affiliate_id, status);
create index idx_commissions_conversion on commission_entries(conversion_id);

-- ---------- content ----------
create table content_submissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliate_profiles(id) on delete cascade,
  campaign_id uuid not null references campaigns(id),
  platform text not null,
  live_url text not null,
  content_type text not null check (content_type in ('remix','original')),
  language text not null default 'en',
  disclosure_confirmed boolean not null default false,
  paid_traffic_declared boolean not null default false,
  asset_sources uuid[],
  caption text,
  evidence_storage_path text,
  status submission_status not null default 'draft',
  review_score jsonb, -- {originality,brand,hook,cta,relevance,disclosure}
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, live_url) -- duplicate URL protection
);
create index idx_submissions_affiliate on content_submissions(affiliate_id, status);

create table social_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references content_submissions(id) on delete cascade,
  captured_at timestamptz not null default now(),
  view_count bigint not null check (view_count >= 0),
  engagement_count bigint check (engagement_count >= 0),
  source text not null check (source in ('platform_api','provider_import','manual_evidence')),
  suspicious_growth_flag boolean not null default false,
  verified_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table content_rewards (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references content_submissions(id),
  affiliate_id uuid not null references affiliate_profiles(id),
  currency text not null default 'USD',
  approval_bonus_minor bigint not null default 0,
  qualified_views bigint not null default 0,
  view_reward_minor bigint not null default 0,
  capped_total_minor bigint not null default 0,
  payable_minor bigint not null default 0,
  observation_ends_at timestamptz, -- 30-day observation before settlement
  status commission_status not null default 'estimated',
  payout_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- payouts ----------
create table payout_methods (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliate_profiles(id) on delete cascade,
  method_type text not null check (method_type in ('bank_transfer','paypal','wise','manual')),
  details_masked text not null, -- only masked data stored here
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payout_batches (
  id uuid primary key default gen_random_uuid(),
  batch_reference text not null unique,
  currency text not null,
  total_amount_minor bigint not null default 0,
  status payout_status not null default 'draft',
  created_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payout_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references payout_batches(id) on delete cascade,
  affiliate_id uuid not null references affiliate_profiles(id),
  currency text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  payment_reference text,
  status payout_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payout_items_affiliate on payout_items(affiliate_id);

alter table commission_entries
  add constraint fk_commission_payout_item foreign key (payout_item_id) references payout_items(id);
alter table content_rewards
  add constraint fk_reward_payout_item foreign key (payout_item_id) references payout_items(id);

-- ---------- imports ----------
create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('patreon_sales','discount_code_map','manual_conversion','refund_adjustment','social_metrics')),
  filename text not null,
  column_mapping jsonb,
  mapping_template_name text,
  status import_status not null default 'pending',
  total_rows int not null default 0,
  valid_rows int not null default 0,
  error_rows int not null default 0,
  duplicate_rows int not null default 0,
  error_report jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references import_jobs(id) on delete cascade,
  row_number int not null,
  raw jsonb not null,
  validation_errors jsonb,
  status text not null default 'pending' check (status in ('pending','valid','invalid','duplicate','imported')),
  conversion_id uuid references conversions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, row_number)
);

-- ---------- compliance & audit ----------
create table compliance_flags (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references affiliate_profiles(id) on delete cascade,
  submission_id uuid references content_submissions(id),
  flag_type text not null,
  severity text not null default 'review' check (severity in ('info','review','serious','critical')),
  detail text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed','escalated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compliance_actions (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid references compliance_flags(id) on delete cascade,
  affiliate_id uuid references affiliate_profiles(id),
  action text not null check (action in ('education_notice','content_correction','content_removal','campaign_suspension','commission_hold','program_suspension','termination')),
  note text,
  actioned_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  version int not null,
  title text not null,
  body_storage_path text not null,
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_key, version)
);

create table policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  policy_version_id uuid not null references policy_versions(id),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, policy_version_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);
-- Immutable: no update/delete permitted (enforced via RLS + revoked grants).

create table system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- updated_at trigger ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
    group by table_name
  loop
    execute format('create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
