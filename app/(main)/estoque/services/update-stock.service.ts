import { db } from "@/db";
import { stockItemsTable, InsertStockItem } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateStockService(
    id: number, 
    item: Omit<InsertStockItem, 'id' | 'createdAt' | 'updatedAt'>
) {
    return await db.update(stockItemsTable)
        .set({
            ...item,
            updatedAt: new Date(),
        })
        .where(eq(stockItemsTable.id, id));
}
