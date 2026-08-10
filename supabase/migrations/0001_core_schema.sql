-- ============================================================
-- Secure Supplies Creator Partner Network — core schema
-- Migration 0001: identity, offers, campaigns, assets
-- All money columns are integer minor units. Currency is ISO 4217.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- roles ----------
create type app_role as enum ('public','creator','reviewer','finance','administrator','super_admin');
create type creator_status as enum ('applied','authorized_creator','producer','elite_producer','certified_team_lead','suspended','terminated');
create type offer_kind as enum ('monthly_membership','annual_membership','digital_product','launch_product','high_touch');
create type commission_status as enum ('estimated','attributed','pending_payment','held','approved','payable','paid','reversed','disputed','cancelled');
create type attribution_method as enum ('promo_code','patreon_identity','tracked_click','manual_claim','organic');
create type submission_status as enum ('draft','submitted','under_review','changes_requested','approved','rejected','published','reward_pending','reward_approved','reward_paid','removed');
create type payout_status as enum ('draft','under_review','approved','processing','paid','partially_failed','failed','cancelled');
create type import_status as enum ('pending','validating','previewed','processing','completed','failed');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role app_role not null default 'creator',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table affiliate_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  partner_code text not null unique check (partner_code ~ '^[A-Z0-9]{4,12}$'),
  status creator_status not null default 'applied',
  compliance_score int not null default 100 check (compliance_score between 0 and 100),
  refund_rate_bps int not null default 0 check (refund_rate_bps between 0 and 10000),
  email_hash text, -- salted hash; raw email lives only in auth.users
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  tax_status_verified boolean not null default false,
  team_lead_id uuid references affiliate_profiles(id), -- one level max, enforced in trigger
  supervision_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_affiliate_profiles_status on affiliate_profiles(status);

-- Enforce ONE level of supervision (a team lead may not have a team lead).
create or replace function enforce_single_level_override() returns trigger as $$
begin
  if new.team_lead_id is not null then
    if exists (select 1 from affiliate_profiles p where p.id = new.team_lead_id and p.team_lead_id is not null) then
      raise exception 'Team Lead structure is limited to one level';
    end if;
    if new.team_lead_id = new.id then
      raise exception 'A creator may not supervise themselves';
    end if;
  end if;
  return new;
end; $$ language plpgsql;
create trigger trg_single_level_override before insert or update on affiliate_profiles
  for each row execute function enforce_single_level_override();

create table creator_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  channels jsonb not null default '[]'::jsonb,
  languages text[] not null default '{en}',
  audience_description text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','waitlisted')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- offers & commission rules ----------
create table offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name text not null,
  kind offer_kind not null,
  description text,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  list_price_minor bigint check (list_price_minor >= 0),
  patreon_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table commission_rules (
  id uuid primary key default gen_random_uuid(),
  version int not null unique check (version >= 1),
  rules jsonb not null,
  effective_from timestamptz not null default now(),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- campaigns & assets ----------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  offer_id uuid not null references offers(id),
  objective text,
  audience text,
  languages text[] not null default '{en}',
  platforms text[] not null default '{}',
  commission_bps_override int check (commission_bps_override between 0 and 3000),
  reward_type text not null default 'view_based' check (reward_type in ('view_based','flat_bonus','none')),
  budget_total_minor bigint not null default 0 check (budget_total_minor >= 0),
  budget_spent_minor bigint not null default 0 check (budget_spent_minor >= 0),
  budget_currency text not null default 'USD',
  starts_at timestamptz,
  ends_at timestamptz,
  requires_approval boolean not null default true,
  difficulty text check (difficulty in ('starter','intermediate','advanced')),
  required_disclosure text not null default 'Paid affiliate link — I may earn a commission if you purchase or join through this link.',
  prohibited_claims text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_spent_minor <= budget_total_minor)
);
create index idx_campaigns_active on campaigns(is_active) where is_active;

create table campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  description text,
  media_type text not null check (media_type in ('mp4','mov','webm','mp3','wav','png','jpg','webp','svg','pdf','zip','vtt','srt','txt','template')),
  language text not null default 'en',
  aspect_ratio text check (aspect_ratio in ('9:16','1:1','16:9','other')),
  duration_seconds int check (duration_seconds >= 0),
  storage_path text not null,
  content_topic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaign_assets_campaign on campaign_assets(campaign_id);

create table asset_rights (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null unique references campaign_assets(id) on delete cascade,
  copyright_status text not null default 'owned' check (copyright_status in ('owned','licensed','public_domain','cleared_promotional')),
  license_type text,
  permitted_platforms text[] not null default '{}',
  permitted_edits text[] not null default '{}',
  geographic_limits text[],
  required_disclosure text,
  prohibited_claims text[],
  download_permitted boolean not null default true,
  remix_permitted boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
