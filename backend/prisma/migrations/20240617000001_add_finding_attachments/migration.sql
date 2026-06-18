-- CreateTable
CREATE TABLE "FindingAttachment" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FindingAttachment_findingId_idx" ON "FindingAttachment"("findingId");

-- AddForeignKey
ALTER TABLE "FindingAttachment" ADD CONSTRAINT "FindingAttachment_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingAttachment" ADD CONSTRAINT "FindingAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
