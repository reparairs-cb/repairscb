"use client";
import { MaintenanceRecordWithDetails } from "@/types/maintenance-record";
import ExcelJS from "exceljs";
import { formatDate, getPriorityLabel, getStatusLabel } from "./utils";

interface MaintenanceExcel {
  "ID Mantenimiento": string;
  "Equipo - Placa": string;
  "Equipo - Código": string;
  "Equipo - Tipo": string;
  "Plan de Mantenimiento": string;
  "Tipo de Mantenimiento": string;
  "Fecha Inicio": string;
  "Fecha Fin": string;
  Kilometraje: number;
  "Fecha Registro Kilometraje": string;
  Observaciones: string;
  "Total Actividades": number;
  "Total Repuestos": number;
  Creado: string;
}

interface MaintenanceActivityExcel {
  "ID Mantenimiento": string;
  Equipo: string;
  "Tipo Mantenimiento": string;
  "Nombre Actividad": string;
  "Descripción Actividad": string;
  Estado: string;
  Prioridad: string;
  Observaciones: string;
  "Prioridad Visual"?: string;
}

interface MaintenanceSparePartExcel {
  "ID Mantenimiento": string;
  Equipo: string;
  "ID Repuesto": string;
  "Código Fábrica": string;
  "Nombre Repuesto": string;
  Cantidad: number;
  "Precio Unitario": number;
  "Precio Total": number;
}

interface EquipmentExcel {
  ID: string;
  Tipo: string;
  Placa: string;
  Código: string;
  "Plan de Mantenimiento": string;
  Creado: string;
}

const createExcelTable = async (
  worksheet: ExcelJS.Worksheet,
  data: (
    | MaintenanceExcel
    | MaintenanceActivityExcel
    | MaintenanceSparePartExcel
    | EquipmentExcel
  )[],
  tableName: string,
  startRow: number = 1
) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const endRow = startRow + data.length;
  const endCol = headers.length;

  // Agregar headers
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(startRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Agregar datos
  data.forEach((row, rowIndex) => {
    headers.forEach((header, colIndex) => {
      const cell = worksheet.getCell(startRow + rowIndex + 1, colIndex + 1);
      cell.value = row[header as keyof typeof row];
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Color for Prioridad column in activities table
      if (header === "Prioridad" && tableName === "TablaActividades") {
        const value = String(row[header as keyof typeof row]).toLowerCase();
        let color = undefined;
        if (value === "inmediata" || value === "immediate") {
          color = { argb: "FFFF0000" }; // Red
        } else if (value === "alta" || value === "high") {
          color = { argb: "FF977B15" }; // Amber
        } else if (value === "media" || value === "medium") {
          color = { argb: "FF0070C0" }; // Blue
        } else if (value === "baja" || value === "low") {
          color = { argb: "FF458A22" }; // Green
        } else if (value === "no") {
          color = { argb: "FF000000" }; // Black
        }
        if (color) {
          cell.font = { ...cell.font, color };
        }
      }

      if (header === "Estado" && tableName === "TablaActividades") {
        const value = String(row[header as keyof typeof row]).toLowerCase();
        let color = undefined;
        if (value === "pending" || value === "pendiente") {
          color = { argb: "FFFF0000" }; // Red
        } else if (value === "in_progress" || value === "en progreso") {
          color = { argb: "FF977B15" }; // Amber
        } else if (value === "completed" || value === "completado") {
          color = { argb: "FF458A22" }; // Green
        } else {
          console.log("Estado no reconocido:", value);
          color = { argb: "FF000000" }; // Black
        }
        if (color) {
          cell.font = { ...cell.font, color };
        }
      }

      // Color for Prioridad Visual bar
      if (header === "Prioridad Visual" && tableName === "TablaActividades") {
        const prioridad = String(
          row["Prioridad" as keyof typeof row]
        ).toLowerCase();
        let color = undefined;
        if (prioridad === "inmediata" || prioridad === "immediate") {
          color = { argb: "FFFF0000" }; // Red
        } else if (prioridad === "alta" || prioridad === "high") {
          color = { argb: "FFFFBF00" }; // Amber
        } else if (prioridad === "media" || prioridad === "medium") {
          color = { argb: "FF0070C0" }; // Blue
        } else if (prioridad === "baja" || prioridad === "low") {
          color = { argb: "FF00B050" }; // Green
        }
        if (color) {
          cell.font = { ...cell.font, color, bold: true };
        }
      }

      // Alternar colores de filas
      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" },
        };
      }
    });
  });

  // Crear tabla de Excel
  const tableRef = `A${startRow}:${String.fromCharCode(64 + endCol)}${endRow}`;
  worksheet.addTable({
    name: tableName,
    ref: tableRef,
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: headers.map((header) => ({
      name: header,
      filterButton: true,
    })),
    rows: data.map((row) =>
      headers.map((header) => row[header as keyof typeof row])
    ),
  });

  // Ajustar ancho de columnas
  headers.forEach((header, index) => {
    let maxWidth = header.length;
    data.forEach((row) => {
      const cellValue =
        typeof row[header as keyof typeof row] === "string"
          ? row[header as keyof typeof row] || ""
          : String(row[header as keyof typeof row]);
      maxWidth = Math.max(maxWidth, cellValue.length);
    });
    worksheet.getColumn(index + 1).width = Math.min(maxWidth + 2, 50);
  });
};

export const downloadMRExcel = async () => {
  const res = await fetch("/api/maintenance-records?limit=0");
  if (!res.ok) {
    alert("Error al obtener los datos");
    return;
  }

  const data: MaintenanceRecordWithDetails[] = (await res.json()).data.data;

  if (!data || data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  console.log("Datos obtenidos:", data);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Mantenimiento";
  workbook.created = new Date();

  // Hoja 1: Registros de Mantenimiento
  const maintenanceData: MaintenanceExcel[] = data.map((record) => ({
    "Equipo - Placa": record.equipment?.license_plate || "",
    "Equipo - Código": record.equipment?.code || "",
    "Equipo - Tipo": record.equipment?.type || "",
    "Plan de Mantenimiento": record.equipment?.maintenance_plan?.name || "",
    "Tipo de Mantenimiento": record.maintenance_type?.type || "",
    "Fecha Inicio": record.start_datetime
      ? new Date(record.start_datetime).toLocaleString()
      : "",
    "Fecha Fin": record.end_datetime
      ? new Date(record.end_datetime).toLocaleString()
      : "",
    Kilometraje: record.mileage_info?.kilometers || 0,
    "Fecha Registro Kilometraje": record.mileage_info?.record_date
      ? formatDate(new Date(record.mileage_info.record_date))
      : "",
    Observaciones: record.observations || "",
    "Total Actividades": record.activities?.length || 0,
    "Total Repuestos":
      record.spare_parts?.reduce((acc, part) => acc + part.quantity, 0) || 0,
    Creado: new Date(record.created_at).toLocaleString(),
    "ID Mantenimiento": record.id,
  }));

  const maintenanceSheet = workbook.addWorksheet("Mantenimientos");
  await createExcelTable(
    maintenanceSheet,
    maintenanceData,
    "TablaMantenimientos"
  );

  // Hoja 2: Actividades
  const activitiesData: MaintenanceActivityExcel[] = [];
  data.forEach((record) => {
    record.activities?.forEach((activity) => {
      const prioridadLabel = getPriorityLabel(activity.priority);
      let bar = "";
      switch (prioridadLabel.toLowerCase()) {
        case "inmediata":
        case "immediate":
          bar = "███████████";
          break;
        case "alta":
        case "high":
          bar = "█████████";
          break;
        case "media":
        case "medium":
          bar = "██████";
          break;
        case "baja":
        case "low":
          bar = "███";
          break;
        default:
          bar = "";
      }
      activitiesData.push({
        Equipo: record.equipment?.license_plate || "",
        "Tipo Mantenimiento": record.maintenance_type?.type || "",
        "Nombre Actividad": activity.activity?.name || "",
        "Descripción Actividad": activity.activity?.description || "",
        Estado: getStatusLabel(activity.status),
        Prioridad: prioridadLabel,
        "Prioridad Visual": bar,
        Observaciones: activity.observations || "",
        "ID Mantenimiento": record.id,
      });
    });
  });

  if (activitiesData.length > 0) {
    const activitiesSheet = workbook.addWorksheet("Actividades");
    await createExcelTable(activitiesSheet, activitiesData, "TablaActividades");
  }

  // Hoja 3: Repuestos
  const sparePartsData: MaintenanceSparePartExcel[] = [];
  data.forEach((record) => {
    console.log("Registro de mantenimiento:", record.id);
    console.log("Repuestos:", record.spare_parts);
    record.spare_parts?.forEach((sparePart) => {
      sparePartsData.push({
        "ID Mantenimiento": record.id,
        Equipo: record.equipment?.license_plate || "",
        "ID Repuesto": sparePart.spare_part_id,
        "Código Fábrica": sparePart.spare_part?.factory_code || "",
        "Nombre Repuesto": sparePart.spare_part?.name || "",
        Cantidad: sparePart.quantity,
        "Precio Unitario": sparePart.unit_price || 0,
        "Precio Total": sparePart.unit_price
          ? sparePart.unit_price * sparePart.quantity
          : 0,
      });
    });
  });

  if (sparePartsData.length > 0) {
    const sparePartsSheet = workbook.addWorksheet("Repuestos");
    await createExcelTable(sparePartsSheet, sparePartsData, "TablaRepuestos");
  }

  // Hoja 4: Equipos (únicos)
  const uniqueEquipment = data
    .filter((record) => record.equipment)
    .reduce((acc, record) => {
      const equipment = record.equipment!;
      if (!acc.find((eq) => eq && eq.id === equipment.id)) {
        acc.push(equipment);
      }
      return acc;
    }, [] as MaintenanceRecordWithDetails["equipment"][]);

  if (uniqueEquipment.length > 0) {
    const equipmentData: EquipmentExcel[] = uniqueEquipment
      .filter((eq) => eq !== undefined)
      .map((equipment) => ({
        ID: equipment.id,
        Tipo: equipment.type,
        Placa: equipment.license_plate,
        Código: equipment.code,
        "Plan de Mantenimiento": equipment.maintenance_plan?.name || "",
        Creado: new Date(equipment.created_at).toLocaleString(),
      }));

    const equipmentSheet = workbook.addWorksheet("Equipos");
    await createExcelTable(equipmentSheet, equipmentData, "TablaEquipos");
  }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Mantenimientos_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
