export interface MaintenanceSparePartBase {
  id: string;
  maintenance_record_id: string;
  spare_part_id: string;
  quantity: number;
  unit_price?: number;
  created_at: Date;
}
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

export interface BulkMaintenanceSparePartUpdate {
  maintenance_record_id: string;
  spare_parts: Array<{
    spare_part_id: string;
    quantity: number;
    unit_price?: number;
  }>;
  user_id: string;
}
