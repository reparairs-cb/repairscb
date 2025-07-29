import { EquipmentWithMaintenanceCounts } from "@/types/equipment";
import { MaintenanceRecordWithDetails } from "@/types/maintenance-record";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateToLocalISOString = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000; // offset en milisegundos
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

export const getDate = (date: Date | string): string => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDate = (d: Date): string => {
  const dStr = d.toISOString().slice(0, 10);
  const year = dStr.slice(0, 4);
  const month = dStr.slice(5, 7);
  const day = dStr.slice(8, 10);
  return `${day}/${month}/${year}`;
};

export const createLocalDate = (dateString: string): Date => {
  // Extraer la fecha
  const dateOnly = dateString.split("T")[0];

  // Crear fecha local (sin zona horaria)
  const [year, month, day] = dateOnly.split("-").map(Number);

  // Date constructor con parámetros individuales usa zona horaria local
  return new Date(year, month - 1, day); // month - 1 porque Date usa índice 0-11
};

/*
  Utilidad para obtener la etiqueta del estado de mantenimiento
*/

export const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completado" },
];

export const priorityOptions = [
  { value: "no", label: "Sin Prioridad" },
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "immediate", label: "Inmediata" },
];

export const getStatusLabel = (status: string) => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option ? option.label : status;
};

export const getPriorityLabel = (priority: string) => {
  const option = priorityOptions.find((opt) => opt.value === priority);
  return option ? option.label : priority;
};

/*
  Obtener el maintenance_count
*/
export const getMaintenanceCount = (
  maintenanceRecords: MaintenanceRecordWithDetails[]
): EquipmentWithMaintenanceCounts["maintenance_count"] => {
  return {
    total: maintenanceRecords.length,
    status: {
      pending:
        maintenanceRecords.filter((record) =>
          record.activities?.some((activity) => activity.status === "pending")
        ).length || 0,
      in_progress:
        maintenanceRecords.filter((record) =>
          record.activities?.some(
            (activity) => activity.status === "in_progress"
          )
        ).length || 0,
      completed:
        maintenanceRecords.filter((record) =>
          record.activities?.some((activity) => activity.status === "completed")
        ).length || 0,
    },
    priority: {
      low:
        maintenanceRecords.filter((record) =>
          record.activities?.some((activity) => activity.priority === "low")
        ).length || 0,
      medium:
        maintenanceRecords.filter((record) =>
          record.activities?.some((activity) => activity.priority === "medium")
        ).length || 0,
      high:
        maintenanceRecords.filter((record) =>
          record.activities?.some((activity) => activity.priority === "high")
        ).length || 0,
      immediate:
        maintenanceRecords.filter((record) =>
          record.activities?.some(
            (activity) => activity.priority === "immediate"
          )
        ).length || 0,
    },
  };
};
