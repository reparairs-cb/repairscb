"use client";
import { useState } from "react";
import { EquipmentMileageRecord } from "@/types/equipment";
import { Calendar } from "./ui/calendar";
import { Modal } from "./Modal";

export const CalendarModal = ({
  isOpen,
  onClose,
  equipment,
  lastMaintenanceDate,
  nextMaintenanceDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentMileageRecord;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  if (!isOpen) return null;

  // Función para personalizar el estilo de las fechas
  const modifiers = {
    lastMaintenance: lastMaintenanceDate ? [lastMaintenanceDate] : [],
    nextMaintenance: nextMaintenanceDate ? [nextMaintenanceDate] : [],
  };

  const modifiersStyles = {
    lastMaintenance: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      fontWeight: "bold",
      borderRadius: "6px",
    },
    nextMaintenance: {
      backgroundColor: "#fed7aa",
      color: "#ea580c",
      fontWeight: "bold",
      borderRadius: "6px",
    },
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-4 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Calendario de Mantenimiento</h3>
        </div>

        <div className="mb-6">
          <p className="font-medium text-lg">
            {equipment.code} - {equipment.license_plate}
          </p>
          <p className="text-sm text-gray-600">{equipment.type}</p>
        </div>

        <div className="mb-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
            showOutsideDays={true}
          />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded border-2 border-blue-300 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <span className="font-medium">Último mantenimiento</span>
              {lastMaintenanceDate && (
                <div className="text-gray-600">
                  {lastMaintenanceDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-orange-100 rounded border-2 border-orange-300 flex items-center justify-center">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <span className="font-medium">Próximo mantenimiento</span>
              {nextMaintenanceDate && (
                <div className="text-gray-600">
                  {nextMaintenanceDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
