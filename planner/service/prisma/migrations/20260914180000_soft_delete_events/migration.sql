-- AlterTable
ALTER TABLE "planner"."events" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "events_deleted_at_idx" ON "planner"."events"("deleted_at");
