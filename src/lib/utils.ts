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
