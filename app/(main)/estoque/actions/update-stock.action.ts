'use server'

import { getUser } from "@/lib/auth";
import { updateStockService } from "../services/update-stock.service";
import { revalidatePath } from "next/cache";
import { stockCategoryEnum, stockUnitEnum } from "@/db/schema";

export async function updateStock(formData: FormData) {
    const { user } = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const category = formData.get('category') as typeof stockCategoryEnum.enumValues[number];
    const unit = formData.get('unit') as typeof stockUnitEnum.enumValues[number];
    const currentQuantity = formData.get('currentQuantity') as string;
    const minQuantity = formData.get('minQuantity') as string;
    const costPrice = formData.get('costPrice') as string;
    const salePrice = formData.get('salePrice') as string;
    const supplier = formData.get('supplier') as string;
    const barcode = formData.get('barcode') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!id || !name || !category || !costPrice || !salePrice) {
        throw new Error('ID, name, category, cost price, and sale price are required');
    }

    try {
        await updateStockService(id, {
            name,
            category,
            unit: unit || 'unidade',
            currentQuantity: currentQuantity || '0',
            minQuantity: minQuantity || '0',
            costPrice,
            salePrice,
            supplier: supplier || null,
            barcode: barcode || null,
            isActive,
        });
        revalidatePath('/estoque');
    } catch (error) {
        console.error('Error updating stock item:', error);
        throw new Error('Failed to update stock item');
    }
}
