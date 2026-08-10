/**
 * scheduled-commission-finalize — daily commission lifecycle advancement.
 * Schedule configured in netlify.toml (`@daily`).
 */
import finalize from './finalize-commissions'

export default async () => {
  const res = await finalize()
  console.log('scheduled-commission-finalize completed with status', res.status)
  return new Response(null, { status: 200 })
}
