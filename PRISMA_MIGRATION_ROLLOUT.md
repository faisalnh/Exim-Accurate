# Prisma Migration Rollout

This project previously relied on `entrypoint.sh` schema patches for borrowing tables.
That created drift between the real database schema and `_prisma_migrations`.

The runtime image now uses:

```sh
npx prisma migrate deploy
```

on startup, so Prisma migration history is the source of truth again.

## One-Time Production Reconciliation

Use this only on an existing production database that already has borrowing tables created by the old startup patch.

1. Back up the production database.
2. Pull and deploy the new image, but do not rely on the app container starting cleanly yet.
3. Run the following against the production database connection:

```sh
npx prisma migrate resolve --applied 20260216105500_add_borrowing_feature
npx prisma migrate resolve --applied 20260420090000_merge_borrowable_items_across_credentials
npx prisma migrate deploy
```

You can also use the bundled helper for the two `resolve` steps:

```sh
npm run db:resolve:borrowing-history
npm run db:deploy
```

## Why This Is Required

Existing production already has the borrowing schema, but Prisma history may not.
Without `migrate resolve --applied`, `prisma migrate deploy` may try to replay old borrowing migrations and fail on objects that already exist.

## Expected State After Reconciliation

- `_prisma_migrations` contains:
  - `20260216105500_add_borrowing_feature`
  - `20260420090000_merge_borrowable_items_across_credentials`
- `BorrowableItem` is global/shared with:
  - no `userId`
  - no `credentialId`
  - unique index on `itemCode`
- future deploys can rely on normal `prisma migrate deploy`

## New Environments

For a fresh environment with an empty database, no manual reconciliation is needed.
The container startup will run `prisma migrate deploy` and apply the full migration history normally.
