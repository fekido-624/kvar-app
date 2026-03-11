-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReceiptDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noResit" TEXT NOT NULL DEFAULT '',
    "namaPenerima" TEXT NOT NULL,
    "namaKolejVokasional" TEXT NOT NULL,
    "tajuk" TEXT NOT NULL DEFAULT '',
    "perkara" TEXT NOT NULL,
    "kuantiti" INTEGER NOT NULL,
    "hargaSeunit" REAL NOT NULL,
    "hargaPostage" REAL NOT NULL,
    "tarikh" DATETIME NOT NULL,
    "semester" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ReceiptDraft" ("createdAt", "hargaPostage", "hargaSeunit", "id", "kuantiti", "namaKolejVokasional", "namaPenerima", "noResit", "perkara", "semester", "tarikh", "updatedAt") SELECT "createdAt", "hargaPostage", "hargaSeunit", "id", "kuantiti", "namaKolejVokasional", "namaPenerima", "noResit", "perkara", "semester", "tarikh", "updatedAt" FROM "ReceiptDraft";
DROP TABLE "ReceiptDraft";
ALTER TABLE "new_ReceiptDraft" RENAME TO "ReceiptDraft";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
