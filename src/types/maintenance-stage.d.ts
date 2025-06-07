import { BaseModel } from "./base-model";

export interface MaintenanceStageBase extends BaseModel {
  maintenance_type_id: string;
  stage_index: number;
  value: number;
}

export interface MaintenanceStageCreate {
  maintenance_type_id: string;
  stage_index: number;
  value: number;
  user_id: string;
}

export interface MaintenanceStageUpdate {
  id: string;
  maintenance_type_id?: string;
  stage_index?: number;
  value?: number;
  user_id: string;
}

export interface MultiMaintenanceStage {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceStageBase[];
}

export interface MaintenanceStagesByTypeResponse {
  maintenance_type_id: string;
  data: MaintenanceStageBase[];
}

export interface NextStageIndexResponse {
  maintenance_type_id: string;
  next_index: number;
}

export interface StageIndexExistsResponse {
  maintenance_type_id: string;
  stage_index: number;
  exists: boolean;
  existing_id?: string;
}

export interface MaintenanceStageStatistics {
  maintenance_type_id: string;
  total_stages: number;
  min_value: number;
  max_value: number;
  avg_value: number;
  total_value: number;
}