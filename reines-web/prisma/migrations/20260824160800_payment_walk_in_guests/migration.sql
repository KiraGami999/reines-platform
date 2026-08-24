-- Allow walk-in product buyers on manual receipts (name + email, no portal account).
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "Payment" ALTER COLUMN "userId" DROP NOT NULL;
