export interface MileageRecordBase {
  id: string;
  equipment_id: string;
  record_date: Date;
  kilometers: number;
  created_at: Date;
  updated_at?: Date;
}

export type MileageRecordDB = MileageRecordBase;

export interface MileageRecordCreate
  extends Omit<MileageRecordBase, "id" | "created_at" | "updated_at"> {
  ordered_params: string[];
}

export interface MileageRecordUpdate {
  id: string;
  equipment_id?: string;
  record_date?: Date;
  kilometers?: number;
  ordered_params: string[];
}

export interface MultiMileageRecord {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  data: MileageRecordBase[];
}

export interface DeleteMileageRecord {
  id: string;
}
