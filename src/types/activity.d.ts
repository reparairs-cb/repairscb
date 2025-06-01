import { BaseModel } from "@/types/base-model";

export interface ActivityBase extends BaseModel {
  name: string;
  description?: string;
  maintenance_type_id: string;
}

export type ActivityDB = ActivityBase;

export interface ActivityCreate
  extends Omit<ActivityBase, "id" | "created_at" | "updated_at"> {
  user_id: string;
}

export interface ActivityUpdate {
  id: string;
  name?: string;
  description?: string;
  maintenance_type_id?: string;
}

export interface MultiActivity {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: ActivityBase[];
}

export interface DeleteActivity {
  id: string;
}

// Interfaces adicionales para funciones avanzadas
interface ActivityWithMaintenanceType extends ActivityBase {
  maintenance_type: {
    id: string;
    type: string;
    level: number;
    path: string;
  };
}

interface ActivityWithUsage extends ActivityBase {
  usage_count: number;
  completion_rate: number;
  last_used?: Date;
}

interface ActivityStats {
  total_activities: number;
  activities_by_maintenance_type: Record<string, number>;
  activities_with_description: number;
  activities_without_description: number;
  most_used_activity: ActivityWithUsage | null;
  latest_activity: ActivityBase | null;
}

interface AdvancedActivitySearch {
  searchTerm?: string;
  maintenanceTypeId?: string;
  hasDescription?: boolean;
  limit?: number;
  offset?: number;
}

interface ActivityGroupedByType {
  maintenance_type: {
    id: string;
    type: string;
    level: number;
    path: string;
  };
  activities: ActivityBase[];
  activity_count: number;
}

// Interfaces para funciones avanzadas
interface ActivityWithMaintenanceType extends ActivityBase {
  maintenance_type: {
    id: string;
    type: string;
    level: number;
    path: string;
  };
}

interface ActivityWithUsage extends ActivityBase {
  usage_count: number;
  completion_rate: number;
  last_used?: Date;
}

interface ActivityStats {
  total_activities: number;
  activities_by_maintenance_type: Record<string, number>;
  activities_with_description: number;
  activities_without_description: number;
  most_used_activity: ActivityWithUsage | null;
  latest_activity: ActivityBase | null;
}

interface AdvancedActivitySearch {
  searchTerm?: string;
  maintenanceTypeId?: string;
  hasDescription?: boolean;
  limit?: number;
  offset?: number;
}

interface ActivityGroupedByType {
  maintenance_type: {
    id: string;
    type: string;
    level: number;
    path: string;
  };
  activities: ActivityBase[];
  activity_count: number;
}

interface ActivityDashboard {
  stats: ActivityStats;
  mostUsed: ActivityWithUsage[];
  problematic: ActivityWithUsage[];
  recentlyAdded: ActivityBase[];
  groupedByType: ActivityGroupedByType[];
}

interface BulkValidationResult {
  valid: Omit<ActivityCreate, "user_id">[];
  invalid: {
    index: number;
    data: Omit<ActivityCreate, "user_id">;
    errors: string[];
  }[];
  warnings: {
    index: number;
    data: Omit<ActivityCreate, "user_id">;
    warnings: string[];
  }[];
}
