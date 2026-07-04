-- Add room code and capacity in a data-safe order because existing rooms already exist.
ALTER TABLE "Room" ADD COLUMN "joinCode" TEXT;
ALTER TABLE "Room" ADD COLUMN "maxMembers" INTEGER;

-- Existing rooms need unique codes before joinCode can become required.
-- Group room codes are public. DM codes are internal and are not used by the join API.
UPDATE "Room"
SET "joinCode" = CASE
  WHEN "type" = 'GROUP' THEN 'RM-' || upper(substring("id" from 1 for 8))
  ELSE 'DM-' || upper(substring("id" from 1 for 20))
END
WHERE "joinCode" IS NULL;

ALTER TABLE "Room" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "Room_joinCode_key" ON "Room"("joinCode");
