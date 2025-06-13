import { z } from "zod";

export const equipmentSchema = z.object({
  type: z.string().min(1, "Type is required"),
  license_plate: z.string().min(1, "License plate is required"),
  code: z.string().min(1, "Code is required"),
  maintenance_plan_id: z.string().min(1, "Maintenance plan is required"),
});

export const activitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  maintenance_type_ids: z
    .array(
      z.object({
        id: z.string().min(1, "ID is required"),
      })
    )
    .min(1, "Al menos un tipo de mantenimiento es requerido"),
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

export const mileageSchema = z.object({
  equipment_id: z.string().min(1, "Equipment is required"),
  mileage: z.number().min(1, "Mileage value is required"),
  record_date: z.date({
    required_error: "Record Date is required",
  }),
});

export const maintenanceSparePartSchema = z.object({
  spare_part_id: z.string().min(1, "Spare part is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().positive().optional(),
  id: z.string().optional(),
});

export const maintenanceActivitySchema = z.object({
  activity_id: z.string().min(1, "Activity is required"),
  completed: z.boolean(),
  observations: z.string().optional(),
  id: z.string().optional(),
});

export const maintenanceRecordSchema = z
  .object({
    equipment_id: z.string().min(1, "Equipment is required"),
    start_datetime: z.date({
      required_error: "Start datetime is required",
    }),
    end_datetime: z.date().optional(),
    maintenance_type_id: z.string().min(1, "Maintenance type is required"),
    observations: z.string().optional(),
    mileage: z.number().min(1, "Mileage value is required"),
    spare_parts: z.array(maintenanceSparePartSchema),
    activities: z.array(maintenanceActivitySchema),
  })
  .refine(
    (data) => {
      if (data.end_datetime && data.start_datetime) {
        return data.end_datetime > data.start_datetime;
      }
      return true;
    },
    {
      message: "End datetime must be after start datetime",
      path: ["end_datetime"],
    }
  );

export const maintenanceStageSchema = z.object({
  maintenance_type_id: z.string().min(1, "Tipo de mantenimiento es requerido"),
  value: z.number().min(0, "El valor debe ser mayor o igual a 0"),
});

export type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>;
export type MaintenanceSparePartFormData = z.infer<
  typeof maintenanceSparePartSchema
>;
export type MaintenanceActivityFormData = z.infer<
  typeof maintenanceActivitySchema
>;
export type EquipmentFormData = z.infer<typeof equipmentSchema>;
export type ActivityFormData = z.infer<typeof activitySchema>;
export type MaintenanceTypeFormData = z.infer<typeof maintenanceTypeSchema>;
export type SparePartFormData = z.infer<typeof sparePartSchema>;
export type MileageFormData = z.infer<typeof mileageSchema>;
export type MaintenanceStageFormData = z.infer<typeof maintenanceStageSchema>;
