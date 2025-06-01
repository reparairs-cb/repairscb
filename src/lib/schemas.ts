import { z } from "zod";

export const equipmentSchema = z.object({
  type: z.string().min(1, "Type is required"),
  license_plate: z.string().min(1, "License plate is required"),
  code: z.string().min(1, "Code is required"),
});

export const activitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  maintenance_type_id: z.string().min(1, "Maintenance type is required"),
});

export const maintenanceTypeSchema = z.object({
  type: z.string().min(1, "Type is required"),
  parent_id: z.string().optional(),
});

export const sparePartSchema = z.object({
  factory_code: z.string().min(1, "Factory code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;
export type ActivityFormData = z.infer<typeof activitySchema>;
export type MaintenanceTypeFormData = z.infer<typeof maintenanceTypeSchema>;
export type SparePartFormData = z.infer<typeof sparePartSchema>;
