-- CreateTable
CREATE TABLE "CodeDocument" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'main',
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeDocument_roomId_key" ON "CodeDocument"("roomId");

-- AddForeignKey
ALTER TABLE "CodeDocument" ADD CONSTRAINT "CodeDocument_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
