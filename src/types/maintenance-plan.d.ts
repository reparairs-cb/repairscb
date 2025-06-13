import { BaseModel } from "./base-model";

export interface MaintenanceType {
  id: string;
  type: string;
  level: number;
  path: string;
  parent_id?: string;
}

// Maintenance Plan interfaces
export interface MaintenancePlanBase extends BaseModel {
  name: string;
  description?: string;
  stage_count?: number;
  maintenance_type_count?: number;
}

export interface MaintenancePlanCreate {
  name: string;
  description?: string;
  user_id: string;
}

export interface MaintenancePlanUpdate {
  id: string;
  name?: string;
  description?: string;
}

export interface MultiMaintenancePlan {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenancePlanBase[];
}

export interface MaintenancePlanWithStages extends MaintenancePlanBase {
  stages: MaintenanceStageBase[];
}

export interface CanDeleteResult {
  id: string;
  name: string;
  can_delete: boolean;
  stage_count: number;
  blocking_reason?: string;
}
