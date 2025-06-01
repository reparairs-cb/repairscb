import { BaseModel } from "@/types/base-model";

export interface MaintenanceRecordBase extends BaseModel {
  equipment_id: string;
  start_datetime: Date;
  end_datetime?: Date;
  maintenance_type_id: string;
  observations?: string;
}

export type MaintenanceRecordDB = MaintenanceRecordBase;

export interface MaintenanceRecordCreate
  extends Omit<MaintenanceRecordBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
  ordered_params: string[];
}

export interface MaintenanceRecordUpdate {
  id: string;
  equipment_id?: string;
  start_datetime?: Date;
  end_datetime?: Date;
  maintenance_type_id?: string;
  observations?: string;
  ordered_params: string[];
}

export interface MultiMaintenanceRecord {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceRecordBase[];
}

export interface DeleteMaintenanceRecord {
  id: string;
}

export interface MaintenanceRecordWithDetails extends MaintenanceRecordBase {
  equipment?: EquipmentBase;
  maintenance_type?: MaintenanceTypeBase;
  spare_parts?: (MaintenanceSparePartBase & { spare_part: SparePartBase })[];
  activities?: (MaintenanceActivityBase & { activity: ActivityBase })[];
}
