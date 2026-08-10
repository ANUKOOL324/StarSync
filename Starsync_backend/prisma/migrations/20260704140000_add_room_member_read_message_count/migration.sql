ALTER TABLE "RoomMember" ADD COLUMN "readMessageCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "RoomMember" rm
SET "readMessageCount" = (
  SELECT COUNT(*)::INTEGER FROM "Message" m WHERE m."roomId" = rm."roomId"
);
