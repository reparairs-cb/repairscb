import { BaseModel } from "@/types/base-model";

// Interface para tipos de mantenimiento
export interface MaintenanceType {
  id: string;
  type: string;
  level: number;
  path: string;
}
export interface ActivityBase extends BaseModel {
  name: string;
  description?: string;
  maintenance_types: MaintenanceType[]; // Array de todos los tipos asociados
}

export interface ActivityCreate
  extends Omit<
    ActivityBase,
    "id" | "created_at" | "updated_at" | "maintenance_types"
  > {
  user_id: string;
  maintenance_type_ids: string[]; // Array obligatorio de IDs de tipos
}

export interface ActivityUpdate {
  id: string;
  name?: string;
  description?: string;
  maintenance_type_ids?: string[]; // Array opcional para reemplazar todos los tipos
}

export interface MultiActivity {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: ActivityBase[];
}

export interface DeleteActivity {
  id: string;
}
