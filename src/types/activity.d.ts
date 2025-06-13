import { BaseModel } from "@/types/base-model";

// Interface para tipos de mantenimiento
export interface MaintenanceType {
  id: string;
  type: string;
  level: number;
  path: string;
}
export interface ActivityBase extends BaseModel {
  name: string;
  description?: string;
  maintenance_types: MaintenanceType[]; // Array de todos los tipos asociados
}

export type ActivityDB = ActivityBase;

export interface ActivityCreate
  extends Omit<
    ActivityBase,
    "id" | "created_at" | "updated_at" | "maintenance_types"
  > {
  user_id: string;
  maintenance_type_ids: string[]; // Array obligatorio de IDs de tipos
}

export interface ActivityUpdate {
  id: string;
  name?: string;
  description?: string;
  maintenance_type_ids?: string[]; // Array opcional para reemplazar todos los tipos
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

export interface ActivityGroupedByType {
  maintenance_type: MaintenanceType;
  activities: ActivityBase[];
  activity_count: number;
}

export interface BulkValidationResult {
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

// Interfaces para manejo de tipos de mantenimiento
export interface ActivityMaintenanceTypeAdd {
  activity_id: string;
  maintenance_type_ids: string[];
}

export interface ActivityMaintenanceTypeRemove {
  activity_id: string;
  maintenance_type_ids: string[];
}

export interface ActivityMaintenanceTypeResult {
  activity_id: string;
  added_count?: number;
  removed_count?: number;
}

// Interface para buscar actividades por múltiples tipos
export interface ActivityByMultipleTypes {
  maintenance_type_ids: string[];
  match_all?: boolean; // true = debe tener TODOS los tipos, false = debe tener AL MENOS UNO
  user_id: string;
}


// Interface para validación de tipos en actividades
export interface ActivityValidation {
  activity_id: string;
  name: string;
  total_maintenance_types: number;
  orphaned_types: MaintenanceType[]; // Tipos que no existen o no pertenecen al usuario
  duplicate_types: string[]; // IDs de tipos duplicados (si hubiera)
  has_no_types: boolean; // Si la actividad no tiene tipos asociados
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

// Interface para importación masiva de actividades
export interface BulkActivityImport {
  activities: {
    name: string;
    description?: string;
    maintenance_type_names: string[]; // Nombres de tipos (se resolverán a IDs)
  }[];
  options: {
    create_missing_types?: boolean; // Crear tipos que no existen
    skip_duplicates?: boolean; // Saltar actividades con nombres duplicados
    update_existing?: boolean; // Actualizar actividades existentes
  };
}

export interface BulkActivityImportResult {
  created_activities: ActivityBase[];
  updated_activities: ActivityBase[];
  skipped_activities: {
    name: string;
    reason: string;
  }[];
  created_types: MaintenanceType[];
  errors: {
    row: number;
    name: string;
    error: string;
  }[];
  summary: {
    total_processed: number;
    successful: number;
    failed: number;
    types_created: number;
  };
}
