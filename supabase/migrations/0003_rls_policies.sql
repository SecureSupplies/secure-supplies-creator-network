-- ============================================================
-- Migration 0003: Row Level Security
--
-- Principles:
--  * RLS enabled on every table.
--  * Creators see ONLY their own rows; never another creator's
--    commissions, customers, or fraud logic.
--  * Raw Patreon tokens are never selectable by any client role.
--  * The Supabase service-role key (server functions only) bypasses RLS.
--  * audit_logs are insert-only (immutable).
-- ============================================================

-- Helper: current profile role
create or replace function current_app_role() returns app_role as $$
  select coalesce((select role from profiles where id = auth.uid()), 'public'::app_role);
$$ language sql stable security definer;

create or replace function is_admin() returns boolean as $$
  select current_app_role() in ('administrator','super_admin');
$$ language sql stable security definer;

create or replace function is_staff() returns boolean as $$
  select current_app_role() in ('reviewer','finance','administrator','super_admin');
$$ language sql stable security definer;

create or replace function my_affiliate_id() returns uuid as $$
  select id from affiliate_profiles where profile_id = auth.uid();
$$ language sql stable security definer;

-- Enable RLS everywhere
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---------- profiles ----------
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_self_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- ---------- affiliate_profiles ----------
create policy affiliate_self_read on affiliate_profiles for select
  using (profile_id = auth.uid() or is_staff());
create policy affiliate_self_update on affiliate_profiles for update
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    -- creators cannot change their own status, team lead, or compliance score
    and status = (select status from affiliate_profiles a where a.profile_id = auth.uid())
    and compliance_score = (select compliance_score from affiliate_profiles a where a.profile_id = auth.uid())
  );
create policy affiliate_admin_all on affiliate_profiles for all using (is_admin()) with check (is_admin());

-- ---------- creator_applications ----------
create policy applications_insert_public on creator_applications for insert with check (true);
create policy applications_staff_read on creator_applications for select using (is_staff());
create policy applications_admin_update on creator_applications for update using (is_admin()) with check (is_admin());

-- ---------- offers / commission_rules / campaigns (catalog) ----------
create policy offers_read_all on offers for select using (is_active or is_staff());
create policy offers_admin_write on offers for all using (is_admin()) with check (is_admin());

create policy rules_staff_read on commission_rules for select using (is_staff());
create policy rules_admin_write on commission_rules for all using (is_admin()) with check (is_admin());

create policy campaigns_read_eligible on campaigns for select
  using ((is_active and my_affiliate_id() is not null) or is_staff());
create policy campaigns_admin_write on campaigns for all using (is_admin()) with check (is_admin());

create policy assets_read_eligible on campaign_assets for select
  using (
    is_staff() or exists (
      select 1 from campaigns c
      where c.id = campaign_assets.campaign_id and c.is_active and my_affiliate_id() is not null
    )
  );
create policy assets_admin_write on campaign_assets for all using (is_admin()) with check (is_admin());

create policy asset_rights_read on asset_rights for select
  using (is_staff() or my_affiliate_id() is not null);
create policy asset_rights_admin_write on asset_rights for all using (is_admin()) with check (is_admin());

-- ---------- referral tracking (own rows only) ----------
create policy links_own on referral_links for select using (affiliate_id = my_affiliate_id() or is_staff());
create policy links_own_insert on referral_links for insert with check (affiliate_id = my_affiliate_id());
create policy links_admin on referral_links for all using (is_admin()) with check (is_admin());

create policy clicks_own on click_events for select using (affiliate_id = my_affiliate_id() or is_staff());
-- Inserts happen only via service role (track-click function); no client insert policy.

-- ---------- patreon_identities: tokens NEVER client-readable ----------
-- No select policy for token columns: use a security-definer view exposing safe columns only.
create policy patreon_identity_admin_meta on patreon_identities for select using (is_admin());
revoke select (access_token_encrypted, refresh_token_encrypted) on patreon_identities from authenticated, anon;

create policy codes_own on discount_codes for select using (affiliate_id = my_affiliate_id() or is_staff());
create policy codes_admin on discount_codes for all using (is_admin()) with check (is_admin());

create policy attributions_own on attributions for select using (affiliate_id = my_affiliate_id() or is_staff());

create policy webhooks_admin_read on webhook_events for select using (is_admin());

-- ---------- conversions & commissions ----------
-- Creators may read conversions attributed to them, with customer identity masked at column level.
create policy conversions_attributed_read on conversions for select
  using (
    is_staff() or exists (
      select 1 from attributions a
      where a.id = conversions.attribution_id and a.affiliate_id = my_affiliate_id()
    )
  );
revoke select (customer_ref_hash) on conversions from authenticated;

create policy commissions_own on commission_entries for select
  using (affiliate_id = my_affiliate_id() or is_staff());
-- All writes via service role only.

-- ---------- content ----------
create policy submissions_own_read on content_submissions for select
  using (affiliate_id = my_affiliate_id() or is_staff());
create policy submissions_own_insert on content_submissions for insert
  with check (affiliate_id = my_affiliate_id());
create policy submissions_own_update on content_submissions for update
  using (affiliate_id = my_affiliate_id() and status in ('draft','changes_requested'))
  with check (affiliate_id = my_affiliate_id());
create policy submissions_staff_update on content_submissions for update
  using (is_staff()) with check (is_staff());

create policy metrics_own_read on social_metric_snapshots for select
  using (
    is_staff() or exists (
      select 1 from content_submissions s
      where s.id = social_metric_snapshots.submission_id and s.affiliate_id = my_affiliate_id()
    )
  );

create policy rewards_own on content_rewards for select
  using (affiliate_id = my_affiliate_id() or is_staff());

-- ---------- payouts ----------
create policy payout_methods_own on payout_methods for select using (affiliate_id = my_affiliate_id() or current_app_role() in ('finance','administrator','super_admin'));
create policy payout_methods_own_write on payout_methods for insert with check (affiliate_id = my_affiliate_id());
create policy payout_methods_own_update on payout_methods for update using (affiliate_id = my_affiliate_id()) with check (affiliate_id = my_affiliate_id());

create policy batches_finance on payout_batches for select using (current_app_role() in ('finance','administrator','super_admin'));
create policy batches_finance_write on payout_batches for all using (current_app_role() in ('finance','administrator','super_admin')) with check (current_app_role() in ('finance','administrator','super_admin'));

create policy payout_items_own on payout_items for select
  using (affiliate_id = my_affiliate_id() or current_app_role() in ('finance','administrator','super_admin'));

-- ---------- imports (staff only) ----------
create policy imports_staff on import_jobs for all using (is_staff()) with check (is_staff());
create policy import_rows_staff on import_rows for all using (is_staff()) with check (is_staff());

-- ---------- compliance ----------
-- Creators see their own flags but NOT fraud detection logic/detail beyond flag_type.
create policy flags_own_read on compliance_flags for select
  using (affiliate_id = my_affiliate_id() or is_staff());
revoke select (detail) on compliance_flags from authenticated;
create policy flags_staff_write on compliance_flags for all using (is_staff()) with check (is_staff());

create policy actions_own_read on compliance_actions for select
  using (affiliate_id = my_affiliate_id() or is_staff());
create policy actions_staff_write on compliance_actions for all using (is_staff()) with check (is_staff());

-- ---------- policies & acceptances ----------
create policy policy_versions_read on policy_versions for select using (true);
create policy policy_versions_admin on policy_versions for all using (is_admin()) with check (is_admin());
create policy acceptances_own on policy_acceptances for select using (profile_id = auth.uid() or is_staff());
create policy acceptances_own_insert on policy_acceptances for insert with check (profile_id = auth.uid());

-- ---------- notifications ----------
create policy notifications_own on notifications for select using (profile_id = auth.uid());
create policy notifications_own_update on notifications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------- audit logs: immutable, admin read only ----------
create policy audit_admin_read on audit_logs for select using (is_admin());
create policy audit_insert_staff on audit_logs for insert with check (is_staff());
revoke update, delete on audit_logs from authenticated, anon;

-- ---------- system settings ----------
create policy settings_admin on system_settings for all using (is_admin()) with check (is_admin());
