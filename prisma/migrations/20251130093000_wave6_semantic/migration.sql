-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
ALTER TABLE "Image" ADD COLUMN     "originalSha256" TEXT;
UPDATE "Image" SET "originalSha256" = COALESCE("originalSha256", "sha256");
ALTER TABLE "Image" ALTER COLUMN "originalSha256" SET NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
ALTER TABLE "Video" ADD COLUMN     "originalSha256" TEXT;
UPDATE "Video" SET "originalSha256" = COALESCE("originalSha256", "sha256");
ALTER TABLE "Video" ALTER COLUMN "originalSha256" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Image_originalSha256_key" ON "Image"("originalSha256");

-- CreateIndex
CREATE UNIQUE INDEX "Video_originalSha256_key" ON "Video"("originalSha256");
