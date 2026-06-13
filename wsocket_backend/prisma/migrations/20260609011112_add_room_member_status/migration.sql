-- CreateEnum
CREATE TYPE "RoomMemberStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- AlterTable
ALTER TABLE "RoomMember" ADD COLUMN     "status" "RoomMemberStatus" NOT NULL DEFAULT 'ACTIVE';
