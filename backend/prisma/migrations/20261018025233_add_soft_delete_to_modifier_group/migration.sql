-- DropIndex
DROP INDEX "modifier_groups_tenantId_name_key";

-- AlterTable
ALTER TABLE "modifier_groups" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
