-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "path" TEXT NOT NULL,
    "thumbPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "fps" INTEGER,
    "videoCodec" TEXT,
    "audioCodec" TEXT,
    "bitrate" INTEGER,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "path" TEXT NOT NULL,
    "thumbPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageTag" (
    "imageId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "ImageTag_pkey" PRIMARY KEY ("imageId","tag")
);

-- CreateTable
CREATE TABLE "VideoTag" (
    "videoId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "VideoTag_pkey" PRIMARY KEY ("videoId","tag")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_sha256_key" ON "Image"("sha256");

-- CreateIndex
CREATE INDEX "Image_provider_idx" ON "Image"("provider");

-- CreateIndex
CREATE INDEX "Image_lastUsedAt_idx" ON "Image"("lastUsedAt");

-- CreateIndex
CREATE INDEX "Image_width_height_idx" ON "Image"("width", "height");

-- CreateIndex
CREATE UNIQUE INDEX "Video_sha256_key" ON "Video"("sha256");

-- CreateIndex
CREATE INDEX "Video_provider_idx" ON "Video"("provider");

-- CreateIndex
CREATE INDEX "Video_lastUsedAt_idx" ON "Video"("lastUsedAt");

-- CreateIndex
CREATE INDEX "Video_width_height_idx" ON "Video"("width", "height");

-- CreateIndex
CREATE INDEX "Video_durationMs_idx" ON "Video"("durationMs");

-- CreateIndex
CREATE INDEX "ImageTag_tag_idx" ON "ImageTag"("tag");

-- CreateIndex
CREATE INDEX "VideoTag_tag_idx" ON "VideoTag"("tag");

-- AddForeignKey
ALTER TABLE "ImageTag" ADD CONSTRAINT "ImageTag_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTag" ADD CONSTRAINT "VideoTag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
