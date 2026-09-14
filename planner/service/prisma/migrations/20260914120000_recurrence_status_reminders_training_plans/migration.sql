-- CreateEnum
CREATE TYPE "planner"."ParticipantStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE', 'SKIPPED');

-- AlterTable
ALTER TABLE "planner"."events" ADD COLUMN     "recurrence_rule" TEXT,
ADD COLUMN     "series_id" UUID,
ADD COLUMN     "plan_id" UUID;

-- AlterTable
ALTER TABLE "planner"."event_participants" ADD COLUMN     "status" "planner"."ParticipantStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "planner"."event_reminders" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "minutes_before" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planner"."plans" (
    "id" UUID NOT NULL,
    "sport_type" "planner"."SportType" NOT NULL,
    "notes" TEXT,
    "details" JSONB NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_reminders_event_id_user_id_minutes_before_key" ON "planner"."event_reminders"("event_id", "user_id", "minutes_before");

-- CreateIndex
CREATE INDEX "events_series_id_idx" ON "planner"."events"("series_id");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "planner"."events"("start_date");

-- AddForeignKey
ALTER TABLE "planner"."events" ADD CONSTRAINT "events_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "planner"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner"."events" ADD CONSTRAINT "events_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planner"."plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner"."event_reminders" ADD CONSTRAINT "event_reminders_event_id_user_id_fkey" FOREIGN KEY ("event_id", "user_id") REFERENCES "planner"."event_participants"("event_id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;
