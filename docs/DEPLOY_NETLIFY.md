# DEPLOY_NETLIFY

## A. Static demo (Netlify Drop)
1. Unzip `secure-supplies-creator-network-demo.zip`.
2. Go to https://app.netlify.com/drop and drag the unzipped `site/` folder onto the page.
3. Done. The demo runs entirely on mock data (role switcher: Visitor / Creator / Admin), makes no external calls, and executes no payments or publishing. The included `_redirects` file handles SPA routing.

Note: Netlify Drop serves static files only — serverless functions, scheduled jobs, and environment variables do NOT run on Drop. Use the production path below for those.

## B. Production (Git-connected or Netlify CLI)
1. Push the source to a Git repository.
2. In Netlify: **Add new site → Import an existing project** and select the repo.
3. Build settings (also declared in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Add environment variables (Site settings → Environment): copy every key from `.env.example` and fill real values. Set `DEMO_MODE=false`.
5. Apply Supabase migrations (see `SUPABASE_SETUP.md`):
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies supabase/migrations/*.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # optional seed
   ```
6. Configure the Patreon OAuth callback: `https://<your-domain>/api/patreon-oauth-callback` (see `PATREON_SETUP.md`).
7. Configure the Patreon webhook to `https://<your-domain>/api/patreon-webhook` and set `PATREON_WEBHOOK_SECRET`.
8. Deploy, then run smoke checks:
   ```bash
   curl https://<your-domain>/api/health
   curl https://<your-domain>/api/patreon-health
   ```
9. Scheduled functions (`scheduled-member-sync`, `scheduled-commission-finalize`) activate automatically from `netlify.toml` on Git/CLI deployments — verify under Site → Functions → Scheduled.
10. Watch function logs for the first webhook delivery and first member sync.

### CLI alternative
```bash
npm i -g netlify-cli
netlify login && netlify init
netlify env:import .env      # never commit .env
netlify deploy --build --prod
```

### Suggested domains
creators.securesupplies.us (portal) · go.securesupplies.us (redirect service) · learn.securesupplies.us (campaign landings)
