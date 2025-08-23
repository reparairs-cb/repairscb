export interface MaintenanceActivityBase {
  id: string;
  maintenance_record_id: string;
  activity_id: string;
  status: "completed" | "pending" | "in_progress";
  priority: "no" | "low" | "medium" | "high" | "immediate";
  observations?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface MultiMaintenanceActivity {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceActivityBase[];
}

export interface MaintenanceActivityCreate
  extends Omit<MaintenanceActivityBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
}

export interface MaintenanceActivityUpdate {
  id: string;
  maintenance_record_id?: string;
  activity_id?: string;
  status?: "completed" | "pending" | "in_progress";
  priority?: "no" | "low" | "medium" | "high" | "immediate";
  observations?: string;
  user_id: string;
}

export interface MaintenanceActivityWithDetails
  extends MaintenanceActivityBase {
  activity: ActivityBase;
  completion_status?: "completed" | "pending" | "in_progress";
}

export interface BulkMaintenanceActivityUpdate {
  maintenance_record_id: string;
  activities: Array<{
    activity_id: string;
    status?: "completed" | "pending" | "in_progress";
    priority?: "no" | "low" | "medium" | "high" | "immediate";
    observations?: string;
  }>;
  user_id: string;
}

export interface DeleteMaintenanceActivity {
  id: string;
  user_id: string;
}
