-- CreateTable
CREATE TABLE "ReceiptSequence" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "nextNo" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);
