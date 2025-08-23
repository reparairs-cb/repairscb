import { BaseModel } from "@/types/base-model";

export interface SparePartBase extends BaseModel {
  factory_code: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
}

export interface SparePartCreate
  extends Omit<SparePartBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
}

export interface SparePartUpdate {
  id: string;
  factory_code?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
}

export interface MultiSparePart {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: SparePartBase[];
}

export interface DeleteSparePart {
  id: string;
}
