/**
 * scheduled-member-sync — daily Patreon member reconciliation.
 * Schedule configured in netlify.toml (`@daily`).
 */
import syncMembers from './patreon-sync-members'

export default async () => {
  const res = await syncMembers()
  console.log('scheduled-member-sync completed with status', res.status)
  return new Response(null, { status: 200 })
}
