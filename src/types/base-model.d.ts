export interface BaseModel {
  id: string; // UUID4 as string in TypeScript
  created_at: Date;
  updated_at?: Date;
  user_id: string;
}