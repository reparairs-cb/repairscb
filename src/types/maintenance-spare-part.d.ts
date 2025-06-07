export interface MaintenanceSparePartBase {
  id: string;
  maintenance_record_id: string;
  spare_part_id: string;
  quantity: number;
  unit_price?: number;
  created_at: Date;
}

export type MaintenanceSparePartDB = MaintenanceSparePartBase;

export interface MaintenanceSparePartCreate
  extends Omit<MaintenanceSparePartBase, "id" | "created_at"> {
  user_id: string;
}

export interface MaintenanceSparePartUpdate {
  id: string;
  quantity?: number;
  unit_price?: number;
  user_id: string;
}

export interface MaintenanceSparePartWithDetails
  extends MaintenanceSparePartBase {
  spare_part: SparePartBase;
  total_cost?: number;
}

export interface MultiMaintenanceSparePart {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MaintenanceSparePartBase[];
}

export interface DeleteMaintenanceSparePart {
  id: string;
  user_id: string;
}

export interface MaintenanceSparePartSummary {
  maintenance_record_id: string;
  total_spare_parts: number;
  total_quantity: number;
  total_cost: number;
  spare_parts_list: {
    spare_part_name: string;
    quatity: number;
    unit_price?: number;
    total_cost?: number;
  }[];
}

export interface MostUsedSparePart {
  spare_part_id: string;
  spare_part_name: string;
  part_number: string;
  total_usage_count: number;
  total_quantity_used: number;
  average_quantity_per_maintenance: number;
}

export interface BulkMaintenanceSparePartUpdate {
  maintenance_record_id: string;
  spare_parts: Array<{
    spare_part_id: string;
    quantity: number;
    unit_price?: number;
  }>;
  user_id: string;
}
