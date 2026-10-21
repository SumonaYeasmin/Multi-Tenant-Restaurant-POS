export interface Category {
  id: string;
  tenantId: string;
  name: string;
  sort: number;
}

export interface Variant {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  tenantId: string;
  name: string;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface RecipeLine {
  ingredientKey: string;
  qty: number;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  variants: Variant[];
  modifierGroupIds: string[];
  recipe: RecipeLine[];
  available: boolean;
  tags: string[];
}

export interface ComboItemSlot {
  slotId: string;
  label: string;
  categoryIds: string[];
  defaultMenuItemId?: string;
}

export interface ComboItem {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  available: boolean;
  slots: ComboItemSlot[];
}
