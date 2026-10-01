-- CreateTable
CREATE TABLE "NumberSetting" (
    "docType" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "digits" INTEGER NOT NULL DEFAULT 4,
    "updatedAt" DATETIME NOT NULL
);
