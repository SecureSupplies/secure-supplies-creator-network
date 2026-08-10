# CONTENT_REWARDS

## Rates
- Approved remix: **$5** publication bonus + **$1.25 per 1,000 verified qualified views**, max **$150 per post**.
- Original creator video: **$20** approval bonus + **$3.00 per 1,000 verified qualified views**, max **$400 per post**.
- Conversion commissions are separate and additive.
- Campaign owners may use flat bonuses where social metrics cannot be reliably verified (`reward_type: flat_bonus`).

## Controls (enforced in `calculate-content-reward` + `capture-social-metrics`)
1. Rewards only for APPROVED submissions.
2. Views settle after a 30-day observation period (`observation_ends_at`).
3. Every campaign has a hard budget; payable amount never exceeds remaining budget.
4. Paid-ad views excluded unless pre-approved (declared at submission).
5. Bot views, purchased engagement, duplicated content, engagement groups: excluded; suspicious growth (>20× in <24h from a non-trivial base) auto-flags for review.
6. Creator must submit the live post URL + platform analytics evidence; creator-entered view counts are NEVER auto-approved — an administrator verifies the qualified-view figure.
7. Content can be rejected for misleading claims, poor quality, missing disclosure, copyright problems, or brand noncompliance.

## Review scoring (100 points)
originality 20 · brand compliance 20 · hook & retention 20 · CTA clarity 15 · conversion relevance 15 · disclosure & compliance 10.
