-- CreateTable
CREATE TABLE "ReceiptDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPenerima" TEXT NOT NULL,
    "namaKolejVokasional" TEXT NOT NULL,
    "perkara" TEXT NOT NULL,
    "kuantiti" INTEGER NOT NULL,
    "hargaSeunit" REAL NOT NULL,
    "hargaPostage" REAL NOT NULL,
    "tarikh" DATETIME NOT NULL,
    "semester" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReceiptPerkaraOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptPerkaraOption_label_key" ON "ReceiptPerkaraOption"("label");
