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
  ordered_params: string[];
}

export interface MaintenanceSparePartUpdate {
  id: string;
  maintenance_record_id?: string;
  spare_part_id?: string;
  quantity?: number;
  unit_price?: number;
  ordered_params: string[];
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
}
