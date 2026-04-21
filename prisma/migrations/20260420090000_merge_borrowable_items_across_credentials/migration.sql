WITH ranked_items AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "itemCode"
      ORDER BY
        "totalStock" DESC,
        "updatedAt" DESC,
        "createdAt" DESC,
        "id" ASC
    ) AS row_num
  FROM "BorrowableItem"
),
duplicate_items AS (
  SELECT "id"
  FROM ranked_items
  WHERE row_num > 1
)
DELETE FROM "BorrowableItem"
WHERE "id" IN (SELECT "id" FROM duplicate_items);

DROP INDEX IF EXISTS "BorrowableItem_credentialId_itemCode_key";
DROP INDEX IF EXISTS "BorrowableItem_userId_itemCode_key";
ALTER TABLE "BorrowableItem" DROP CONSTRAINT IF EXISTS "BorrowableItem_userId_fkey";
ALTER TABLE "BorrowableItem" DROP CONSTRAINT IF EXISTS "BorrowableItem_credentialId_fkey";

ALTER TABLE "BorrowableItem" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "BorrowableItem" DROP COLUMN IF EXISTS "credentialId";

CREATE UNIQUE INDEX IF NOT EXISTS "BorrowableItem_itemCode_key"
ON "BorrowableItem"("itemCode");
