import { BaseModel } from "@/types/base-model";
import { MaintenanceSparePartBase } from "./maintenance-spare-part";
import { MaintenanceActivityBase } from "./maintenance-activity";
import { MaintenanceTypeBase } from "./maintenance-type";
import { EquipmentBase } from "./equipment";
import { ActivityBase } from "./activity";
import { SparePartBase } from "./spare-part";

export interface MaintenanceRecordBase extends BaseModel {
  equipment_id: string;
  start_datetime: Date;
  end_datetime?: Date;
  maintenance_type_id: string;
  observations?: string;
  mileage_record_id: string;
}

export interface MaintenanceRecordCreate
  extends Omit<MaintenanceRecordBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
}

export interface MaintenanceRecordUpdate {
  id: string;
  equipment_id?: string;
  start_datetime?: Date;
  end_datetime?: Date;
  maintenance_type_id?: string;
  observations?: string;
  mileage_record_id?: string;
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
  mileage_info?: {
    id: string;
    record_date: Date;
    kilometers: number;
  };
  duration_hours?: number;
  status?: "completed" | "in_progress";
}
