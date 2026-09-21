-- AlterTable
ALTER TABLE "auth"."user_preferences" DROP COLUMN "profile_visibility",
ADD COLUMN     "searchable" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "auth"."ProfileVisibility";

