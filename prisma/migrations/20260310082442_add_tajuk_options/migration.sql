-- CreateTable
CREATE TABLE "ReceiptTajukOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptTajukOption_label_key" ON "ReceiptTajukOption"("label");
