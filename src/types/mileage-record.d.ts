/**
 * Interfaz base para registros de kilometraje
 */
export interface MileageRecordBase {
  id: string;
  equipment_id: string;
  record_date: Date;
  kilometers: number;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Interfaz para crear un nuevo registro de kilometraje
 */
export interface MileageRecordCreate {
  equipment_id: string;
  record_date: Date;
  kilometers: number;
  user_id: string;
}

/**
 * Interfaz para actualizar un registro de kilometraje
 */
export interface MileageRecordUpdate {
  id: string;
  user_id: string;
  equipment_id?: string;
  record_date?: Date;
  kilometers?: number;
}

/**
 * Interfaz para registro de kilometraje con información del equipo
 */
export interface MileageRecordWithEquipment extends MileageRecordBase {
  equipment: {
    id: string;
    type: string;
    license_plate?: string;
    code?: string;
  };
  daily_distance: number;
}

/**
 * Interfaz para respuesta paginada de registros de kilometraje
 */
export interface MultiMileageRecord {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MileageRecordBase[];
}

/**
 * Interfaz para respuesta paginada con información del equipo
 */
export interface MileageRecordsWithEquipmentResponse {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MileageRecordWithEquipment[];
}

/**
 * Interfaz para respuesta paginada por equipo
 */
export interface MileageRecordsByEquipmentResponse {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  equipment_id: string;
  data: MileageRecordBase[];
}

/**
 * Interfaz para respuesta paginada por rango de fechas
 */
export interface MileageRecordsByDateRangeResponse {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  start_date: Date;
  end_date: Date;
  equipment_id?: string;
  data: MileageRecordWithEquipment[];
}
