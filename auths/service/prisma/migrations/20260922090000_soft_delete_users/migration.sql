-- AlterTable
ALTER TABLE "auth"."users" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "auth"."users"("deleted_at");

