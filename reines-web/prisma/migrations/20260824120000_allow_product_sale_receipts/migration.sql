-- Allow receipts for direct product sales without a project.
ALTER TABLE "Payment" ALTER COLUMN "projectId" DROP NOT NULL;
