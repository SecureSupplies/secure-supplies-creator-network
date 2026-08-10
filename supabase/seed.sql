-- ============================================================
-- Seed data — FICTIONAL DEMO DATA ONLY.
-- Every customer, transaction, and creator below is invented.
-- Run after migrations: supabase db reset  (applies migrations + seed)
-- ============================================================

insert into commission_rules (version, rules) values (1, '{
  "monthly_membership": {"first_payment_bps": 2500, "renewal_bps": 1500, "renewal_start_number": 2, "renewal_end_number": 12},
  "annual_membership": {"payment_bps": 2000},
  "digital_product": {"payment_bps": 2500},
  "launch_product": {"maximum_bps": 3000},
  "high_touch": {"first_payment_min_bps": 1000, "first_payment_max_bps": 1500},
  "team_lead_override": {"enabled": false, "bps": 300, "maximum_months": 6, "maximum_levels": 1},
  "content_rewards": {
    "remix": {"approval_bonus_minor": 500, "per_1000_views_minor": 125, "cap_minor": 15000},
    "original": {"approval_bonus_minor": 2000, "per_1000_views_minor": 300, "cap_minor": 40000}
  }
}'::jsonb);

insert into offers (slug, name, kind, currency, list_price_minor, description, patreon_url) values
  ('hot-rod-lab', 'Hydrogen Hot Rod Lab Membership', 'monthly_membership', 'USD', 4900, 'Monthly lab access, research feed, builder community. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies'),
  ('hot-rod-lab-annual', 'Hydrogen Hot Rod Lab — Annual', 'annual_membership', 'USD', 49900, 'Annual membership. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies'),
  ('coil-calculator', 'Stanley A. Meyer Coil Calculators', 'digital_product', 'USD', 5600, 'Research & preservation calculator collection. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies'),
  ('vic-library', 'VIC Research Library', 'digital_product', 'USD', 3900, 'Annotated VIC research collection. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies'),
  ('nano-bubble-collection', 'Nano-Bubble Research Collection', 'launch_product', 'USD', 7900, 'Launch-window research collection. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies'),
  ('builder-training', 'Hydrogen Builder Training Videos', 'digital_product', 'USD', 4500, 'Build-education video set. DEMO DATA.', 'https://www.patreon.com/cw/securesupplies');

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'hot-rod-lab-membership', 'Hydrogen Hot Rod Lab Membership', id,
  'Grow lab membership among hydrogen builders', 'Hydrogen enthusiasts, mechanics, home builders',
  '{en,es,de,pt-BR}', '{youtube,tiktok,instagram}', 'view_based', 500000, 'starter', true
from offers where slug = 'hot-rod-lab';

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'coil-calculators', 'Stanley A. Meyer Coil Calculators', id,
  'Sell the calculator research collection', 'VIC researchers, electronics hobbyists',
  '{en,es,de,pt-BR}', '{youtube,tiktok,instagram,facebook}', 'view_based', 300000, 'starter', true
from offers where slug = 'coil-calculator';

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'vic-research-library', 'VIC Research Library', id,
  'Promote the annotated VIC research library', 'Meyer researchers, historical-technology communities',
  '{en,de}', '{youtube,facebook}', 'flat_bonus', 200000, 'intermediate', true
from offers where slug = 'vic-library';

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'nano-bubble-launch', 'Nano-Bubble Research Collection', id,
  'Launch campaign with enhanced commission', 'Alternative-energy researchers',
  '{en,pt-BR}', '{youtube,instagram,x}', 'view_based', 250000, 'intermediate', true
from offers where slug = 'nano-bubble-collection';

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'builder-training-videos', 'Hydrogen Builder Training Videos', id,
  'Promote build-education videos', 'Makers, machinists, fabrication communities',
  '{en,es}', '{youtube,tiktok}', 'view_based', 150000, 'starter', true
from offers where slug = 'builder-training';

insert into campaigns (slug, name, offer_id, objective, audience, languages, platforms, reward_type, budget_total_minor, difficulty, is_active)
select 'multilingual-translation', 'Multilingual Research Translation Campaign', id,
  'Translate approved research content into new languages', 'Bilingual creators',
  '{es,de,pt-BR}', '{youtube,tiktok,instagram}', 'flat_bonus', 100000, 'advanced', true
from offers where slug = 'hot-rod-lab';

-- NOTE: creator profiles reference auth.users and are created through the
-- application flow. For local development, create demo users with
-- `supabase auth` or the admin API, then link affiliate_profiles.
-- The static demo build ships with a self-contained mock dataset instead.
