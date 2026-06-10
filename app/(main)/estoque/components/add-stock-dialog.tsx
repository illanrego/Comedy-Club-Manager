'use client'

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SelectStockItem } from "@/db/schema";
import { addStock } from "../actions/add-stock.action";
import { updateStock } from "../actions/update-stock.action";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface AddStockDialogProps {
    children: React.ReactNode;
    onStockAdded?: () => void;
    item?: SelectStockItem;
    mode?: 'add' | 'edit';
}

// Stock categories and units (must match schema enum values)
const stockCategories = [
    'cerveja', 'vinho', 'destilado', 'refrigerante', 'agua', 
    'suco', 'energetico', 'petisco', 'ingrediente', 'descartavel', 'outro'
] as const;

const stockUnits = ['unidade', 'ml', 'litro', 'kg', 'g', 'pacote', 'caixa'] as const;

const categoryLabels: Record<string, string> = {
    cerveja: 'Cerveja',
    vinho: 'Vinho',
    destilado: 'Destilado',
    refrigerante: 'Refrigerante',
    agua: 'Água',
    suco: 'Suco',
    energetico: 'Energético',
    petisco: 'Petisco',
    ingrediente: 'Ingrediente',
    descartavel: 'Descartável',
    outro: 'Outro',
};

const unitLabels: Record<string, string> = {
    unidade: 'Unidade',
    ml: 'mL',
    litro: 'Litro',
    kg: 'Kg',
    g: 'Gramas',
    pacote: 'Pacote',
    caixa: 'Caixa',
};

export function AddStockDialog({ children, onStockAdded, item, mode = 'add' }: AddStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [isActive, setIsActive] = useState(item?.isActive ?? true);

    async function onSubmit(formData: FormData) {
        formData.set('isActive', isActive.toString());
        
        if (mode === 'edit' && item) {
            formData.append('id', item.id.toString());
            await updateStock(formData);
        } else {
            await addStock(formData);
        }
        setOpen(false);
        onStockAdded?.();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Editar Item' : 'Adicionar Novo Item'}
                    </DialogTitle>
                </DialogHeader>
                <form action={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="name">Nome do Produto *</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                defaultValue={item?.name}
                                placeholder="Ex: Heineken Long Neck"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria *</Label>
                            <Select name="category" defaultValue={item?.category} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {categoryLabels[cat] || cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidade</Label>
                            <Select name="unit" defaultValue={item?.unit || 'unidade'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockUnits.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {unitLabels[unit] || unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currentQuantity">
                                {mode === 'edit' ? 'Quantidade Atual' : 'Quantidade Inicial'}
                            </Label>
                            <Input
                                id="currentQuantity"
                                name="currentQuantity"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item?.currentQuantity || '0'}
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                            <Input
                                id="minQuantity"
                                name="minQuantity"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item?.minQuantity || '0'}
                                placeholder="Alerta de estoque baixo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="costPrice">Preço de Custo (R$) *</Label>
                            <Input
                                id="costPrice"
                                name="costPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={item?.costPrice}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salePrice">Preço de Venda (R$) *</Label>
                            <Input
                                id="salePrice"
                                name="salePrice"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={item?.salePrice}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier">Fornecedor</Label>
                            <Input
                                id="supplier"
                                name="supplier"
                                defaultValue={item?.supplier || ''}
                                placeholder="Nome do fornecedor"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="barcode">Código de Barras</Label>
                            <Input
                                id="barcode"
                                name="barcode"
                                defaultValue={item?.barcode || ''}
                                placeholder="EAN/UPC"
                            />
                        </div>

                        {mode === 'edit' && (
                            <div className="col-span-2 flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <Label htmlFor="isActive">Item ativo</Label>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="w-full">
                        {mode === 'edit' ? 'Salvar Alterações' : 'Adicionar Item'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
