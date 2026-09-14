-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "planner";

-- CreateEnum
CREATE TYPE "planner"."SportType" AS ENUM ('RUNNING', 'CYCLING', 'SWIMMING', 'STRENGTH', 'YOGA', 'OTHER');

-- CreateTable
CREATE TABLE "planner"."events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "start_time" TIME,
    "end_time" TIME,
    "timezone" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "sport_type" "planner"."SportType" NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planner"."event_participants" (
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("event_id","user_id")
);

-- AddForeignKey
ALTER TABLE "planner"."event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "planner"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
