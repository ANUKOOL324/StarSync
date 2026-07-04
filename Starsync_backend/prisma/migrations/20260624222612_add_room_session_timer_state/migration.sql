-- CreateEnum
CREATE TYPE "RoomSessionStatus" AS ENUM ('WAITING', 'RUNNING', 'ENDED');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "sessionStartedAt" TIMESTAMP(3),
ADD COLUMN     "sessionStatus" "RoomSessionStatus" NOT NULL DEFAULT 'WAITING';
