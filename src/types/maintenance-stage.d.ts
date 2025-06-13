import { BaseModel } from "./base-model";
import { MaintenanceType } from "./maintenance-plan";

export interface MaintenanceStageBase extends BaseModel {
  maintenance_type_id: string;
  maintenance_plan_id: string;
  stage_index: number;
  kilometers: number;
  days: number;
  maintenance_type?: MaintenanceType;
  maintenance_plan?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface MaintenanceStageCreate {
  maintenance_type_id: string;
  maintenance_plan_id: string;
  stage_index: number;
  kilometers: number;
  days: number;
  user_id: string;
}

export interface MaintenanceStageUpdate {
  id: string;
  maintenance_type_id?: string;
  maintenance_plan_id?: string;
  stage_index?: number;
  kilometers?: number;
  days?: number;
}

export interface MultiMaintenanceStage {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  maintenance_type_id?: string;
  maintenance_plan_id?: string;
  data: MaintenanceStageBase[];
}
