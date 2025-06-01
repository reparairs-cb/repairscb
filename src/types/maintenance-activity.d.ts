export interface MaintenanceActivityBase {
  id: string;
  maintenance_record_id: string;
  activity_id: string;
  completed: boolean;
  observations?: string;
  created_at: Date;
  updated_at?: Date;
}

export type MaintenanceActivityDB = MaintenanceActivityBase;

export interface MaintenanceActivityCreate
  extends Omit<MaintenanceActivityBase, "id" | "created_at" | "updated_at"> {
  ordered_params: string[];
}

export interface MaintenanceActivityUpdate {
  id: string;
  maintenance_record_id?: string;
  activity_id?: string;
  completed?: boolean;
  observations?: string;
  ordered_params: string[];
}

export interface MultiMaintenanceActivity {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceActivityBase[];
}

export interface DeleteMaintenanceActivity {
  id: string;
}
