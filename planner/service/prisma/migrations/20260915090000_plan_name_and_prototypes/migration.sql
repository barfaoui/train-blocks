-- AlterTable
ALTER TABLE "planner"."plans" ADD COLUMN     "name" VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE "planner"."plan_prototypes" (
    "id" UUID NOT NULL,
    "sport_type" "planner"."SportType" NOT NULL,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_prototypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_prototypes_sport_type_key" ON "planner"."plan_prototypes"("sport_type");

-- CreateIndex
CREATE INDEX "plans_created_by_id_sport_type_idx" ON "planner"."plans"("created_by_id", "sport_type");
