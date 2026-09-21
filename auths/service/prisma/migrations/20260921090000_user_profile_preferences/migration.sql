-- CreateEnum
CREATE TYPE "auth"."WeekStart" AS ENUM ('SUNDAY', 'MONDAY', 'SATURDAY');

-- CreateEnum
CREATE TYPE "auth"."TimeFormat" AS ENUM ('H12', 'H24');

-- CreateEnum
CREATE TYPE "auth"."CalendarView" AS ENUM ('MONTH', 'WEEK', 'DAY');

-- CreateEnum
CREATE TYPE "auth"."UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "auth"."Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "auth"."ProfileVisibility" AS ENUM ('PRIVATE', 'PARTICIPANTS');

-- AlterTable
ALTER TABLE "auth"."users" ADD COLUMN     "avatar_color" VARCHAR(7),
ADD COLUMN     "avatar_icon" VARCHAR(32),
ADD COLUMN     "display_name" VARCHAR(64),
ADD COLUMN     "email_verified_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "auth"."user_preferences" (
    "user_id" UUID NOT NULL,
    "week_start" "auth"."WeekStart" NOT NULL DEFAULT 'MONDAY',
    "time_format" "auth"."TimeFormat" NOT NULL DEFAULT 'H24',
    "default_view" "auth"."CalendarView" NOT NULL DEFAULT 'WEEK',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'en',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "show_week_numbers" BOOLEAN NOT NULL DEFAULT false,
    "work_day_start" INTEGER NOT NULL DEFAULT 8,
    "work_day_end" INTEGER NOT NULL DEFAULT 20,
    "units" "auth"."UnitSystem" NOT NULL DEFAULT 'METRIC',
    "favorite_sports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_sport_type" VARCHAR(64),
    "default_event_duration_min" INTEGER NOT NULL DEFAULT 60,
    "default_reminders" INTEGER[] DEFAULT ARRAY[30]::INTEGER[],
    "theme" "auth"."Theme" NOT NULL DEFAULT 'SYSTEM',
    "notify_by_email" BOOLEAN NOT NULL DEFAULT false,
    "profile_visibility" "auth"."ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "auth"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

