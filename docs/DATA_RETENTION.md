# DATA_RETENTION (template — confirm with counsel)

| Data | Retention | Notes |
|---|---|---|
| Click events | 13 months | attribution window is 30 days; aggregate after 90 days |
| Attribution + conversions | 7 years | financial records |
| Commission entries / payouts | 7 years | tax and audit |
| Webhook raw payloads | 12 months | debugging + idempotency |
| Content submissions & evidence | life of program + 2 years | claims defense |
| Compliance flags/actions | 5 years | enforcement history |
| Audit logs | 7 years | immutable |
| OAuth tokens | until disconnect + immediate revoke | encrypted at rest |
| Email hashes | while account active | salted; raw emails never stored in app DB |
| Rejected applications | 12 months | then delete |

Deletion requests: honor data-subject requests for identity data (hash removal, profile deletion) while retaining legally required financial records; document the legal basis per record class (GDPR/CCPA/LGPD as applicable).
