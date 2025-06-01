import { BaseModel } from "@/types/base-model";

export interface EquipmentBase extends BaseModel {
  type: string;
  license_plate: string;
  code: string;
}

export type EquipmentDB = EquipmentBase;

export interface EquipmentCreate
  extends Omit<EquipmentBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
}

export interface EquipmentUpdate {
  id: string;
  type?: string;
  license_plate?: string;
  code?: string;
}

export interface MultiEquipment {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: EquipmentBase[];
}

export interface DeleteEquipment {
  id: string;
}

export interface EquipmentWithRecords extends EquipmentBase {
  maintenance_records?: MaintenanceRecordBase[];
  mileage_records?: MileageRecordBase[];
}
