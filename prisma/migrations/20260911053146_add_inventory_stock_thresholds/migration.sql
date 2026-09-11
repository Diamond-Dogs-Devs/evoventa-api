-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "criticalStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lowStock" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "InventoryItem_inventoryId_idx" ON "InventoryItem"("inventoryId");
