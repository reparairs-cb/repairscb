import { BaseModel } from "@/types/base-model";

export interface MaintenanceTypeBase extends Omit<BaseModel, "updated_at"> {
  type: string;
  parent_id?: string;
  level: number;
  path?: string;
}

export type MaintenanceTypeDB = MaintenanceTypeBase;

export interface MaintenanceTypeCreate
  extends Omit<MaintenanceTypeBase, "id" | "created_at"> {
  user_id: string;
}

export interface MaintenanceTypeUpdate {
  id: string;
  type?: string;
  parent_id?: string;
  level?: number;
  path?: string;
}

export interface MultiMaintenanceType {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceTypeBase[];
}

export interface DeleteMaintenanceType {
  id: string;
}

export interface MaintenanceTypeWithChildren extends MaintenanceTypeBase {
  children?: MaintenanceTypeBase[];
  activities?: ActivityBase[];
}
