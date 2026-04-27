-- CreateEnum
CREATE TYPE "HomeSectionLayout" AS ENUM ('SPLIT', 'FULL');

-- CreateEnum
CREATE TYPE "PopupTrigger" AS ENUM ('ON_LOAD', 'AFTER_DELAY');

-- AlterEnum
ALTER TYPE "ImageSection" ADD VALUE 'POPUP';

-- AlterTable
ALTER TABLE "home_sections" ADD COLUMN     "ctaLabel" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "layout" "HomeSectionLayout" NOT NULL DEFAULT 'SPLIT';

-- CreateTable
CREATE TABLE "popups" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageId" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "trigger" "PopupTrigger" NOT NULL DEFAULT 'ON_LOAD',
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "showOncePerSession" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "popups" ADD CONSTRAINT "popups_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
