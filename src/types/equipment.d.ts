import { BaseModel } from "@/types/base-model";
import { MileageRecordBase } from "./mileage-record";
import {
  MaintenanceRecordBase,
  MaintenanceRecordWithDetails,
} from "./maintenance-record";

export interface EquipmentBase extends BaseModel {
  type: string;
  license_plate: string;
  code: string;
  maintenance_plan_id: string;
  maintenance_plan?: {
    id: string;
    name: string;
    description?: string;
  };
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
  maintenance_plan_id?: string;
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

export interface EquipmentWithPaginatedRecords extends EquipmentBase {
  maintenance_records?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    data: MaintenanceRecordBase[];
  };
  mileage_records?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    data: MileageRecordBase[];
  };
}

export interface MultiEquipmentWithRecords extends MultiEquipment {
  data: EquipmentWithPaginatedRecords[];
}

export interface EquipmentMileageRecord {
  id: string;
  code: string;
  license_plate: string;
  type: string;
  avg_mileage: number;
  last_mileage_value?: number;
  last_mileage_record_date?: Date;
  maintenance_plan_name?: string;
}

export interface MaintenanceTypePlan {
  id: string;
  type: string;
  path: string;
}

export interface EquipmentMaintenancePlan {
  equipment: EquipmentMileageRecord;
  last_maintenance_type?: MaintenanceTypePlan;
  next_maintenance_type?: MaintenanceTypePlan;
  remaining_days?: number;
  remaining_mileage?: number;
}

export interface MultiEquipmentMaintenancePlan {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: EquipmentMaintenancePlan[];
}

export interface EqWithPendingInProgressMRs extends EquipmentBase {
  maintenance_records: Pick<
    MaintenanceRecordWithDetails,
    | "activities"
    | "start_datetime"
    | "end_datetime"
    | "observations"
    | "id"
    | "maintenance_type"
  >[];
}

export interface MultiEqWithPendingInProgressMRs {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: EqWithPendingInProgressMRs[];
}
