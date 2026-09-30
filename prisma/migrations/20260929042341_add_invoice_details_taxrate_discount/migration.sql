-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "estimateId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "subject" TEXT,
    "notes" TEXT,
    "terms" TEXT,
    "bankInfo" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 10,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("bankInfo", "createdAt", "customerId", "dueDate", "estimateId", "id", "invoiceNumber", "issueDate", "notes", "paidAt", "status", "subject", "subtotal", "taxAmount", "taxRate", "terms", "totalAmount", "updatedAt") SELECT "bankInfo", "createdAt", "customerId", "dueDate", "estimateId", "id", "invoiceNumber", "issueDate", "notes", "paidAt", "status", "subject", "subtotal", "taxAmount", "taxRate", "terms", "totalAmount", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE TABLE "new_InvoiceLineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 10,
    CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InvoiceLineItem" ("amount", "description", "id", "invoiceId", "quantity", "sortOrder", "unit", "unitPrice") SELECT "amount", "description", "id", "invoiceId", "quantity", "sortOrder", "unit", "unitPrice" FROM "InvoiceLineItem";
DROP TABLE "InvoiceLineItem";
ALTER TABLE "new_InvoiceLineItem" RENAME TO "InvoiceLineItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
