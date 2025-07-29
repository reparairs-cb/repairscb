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

export type MaintenanceActivityDB = MaintenanceActivityBase;

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

export interface MaintenanceActivityProgress {
  maintenance_record_id: string;
  total_activities: number;
  completed_activities: number;
  pending_activities: number;
  progress_percentage: number;
  is_complete: boolean;
}

export interface MaintenanceActivityStats {
  total_activities: number;
  completed_activities: number;
  pending_activities: number;
  completion_rate_percentage: number;
  most_common_activities: {
    activity_id: string;
    activity_name: string;
    usage_count: number;
  }[];
}

export interface PendingMaintenanceActivity extends MaintenanceActivityBase {
  activity?: Pick<ActivityBase, "id" | "name" | "status" | "description" | "priority">;
  maintenance_info?: Pick<
    MaintenanceRecordBase,
    "id" | "equipment_id" | "start_datetime" | "maintenance_type_id"
  >;
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
