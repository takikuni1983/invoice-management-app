-- AlterTable
ALTER TABLE "CompanyInfo" ADD COLUMN "bankInfo" TEXT;

-- 既存の請求書で使っていた振込先（最後に更新した請求書のもの）を自社情報の初期値にする
UPDATE "CompanyInfo"
SET "bankInfo" = (
  SELECT "bankInfo" FROM "Invoice"
  WHERE "bankInfo" IS NOT NULL AND TRIM("bankInfo") <> ''
  ORDER BY "updatedAt" DESC
  LIMIT 1
)
WHERE "bankInfo" IS NULL;
