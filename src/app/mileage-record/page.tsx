"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus } from "lucide-react";
import type { MileageFormData } from "@/lib/schemas";
import type {
  EquipmentWithPaginatedRecords,
  MultiEquipmentWithRecords,
} from "@/types/equipment";
import { mileageSchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MileageRecordBase, MultiMileageRecord } from "@/types/mileage-record";
import { dateToLocalISOString, formatDate } from "@/lib/utils";
import MileageRecordsDetailView from "@/components/MileageRecordDetailView";
import { FETCH_SIZE } from "@/lib/const";
import { PaginationComponent } from "@/components/Pagination";

export default function MileageRecordPage() {
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState<MultiEquipmentWithRecords>({
    total: 0,
    limit: 0,
    offset: 0,
    pages: 0,
    data: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MileageRecordBase | null>(
    null
  );
  const [detailsEquipment, setDetailsEquipment] =
    useState<EquipmentWithPaginatedRecords | null>(null);
  const [loadingMileageRecords, setLoadingMileageRecords] = useState(false);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Loading equipment...",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MileageFormData>({
    resolver: zodResolver(mileageSchema),
    defaultValues: {
      equipment_id: "",
      mileage: 0,
      record_date: new Date(),
    },
  });

  useEffect(() => {
    // Fetch equipment from API
    const fetchEquipment = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando equipos...",
      });

      try {
        const res = await fetch(
          `/api/equipments/with-records?limit=${0}&mileageLimit=${FETCH_SIZE}&mileageOffset=0`
        );

        if (!res.ok) {
          const err = await res.json();
          console.error("Error fetching equipment:", err);
          throw new Error("Failed to fetch equipment");
        }

        const data = (await res.json()).data as MultiEquipmentWithRecords;

        console.log("Fetched equipment:", data.data);
        setEquipment({
          ...data,
          data: data.data.map((item) => ({
            ...item,
            created_at: new Date(item.created_at),
            updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
            mileage_records: item.mileage_records
              ? {
                  total: item.mileage_records.total,
                  limit: item.mileage_records.limit,
                  offset: item.mileage_records.offset,
                  pages: item.mileage_records.pages,
                  data: item.mileage_records.data.map((record) => ({
                    ...record,
                    record_date: new Date(record.record_date),
                    created_at: new Date(record.created_at),
                    updated_at: record.updated_at
                      ? new Date(record.updated_at)
                      : undefined,
                  })),
                }
              : undefined,
          })),
        });
        setNoise(null);
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los equipos.",
        });
      }
    };
    fetchEquipment();
  }, []);

  // Función para cargar más datos cuando cambie de página
  const handlePageChange = useCallback(
    async (page: number) => {
      const selectedMileage = equipment.data.find(
        (item) => item.id === detailsEquipment?.id
      )?.mileage_records;

      if (!selectedMileage) return;

      const newOffset = (page - 1) * selectedMileage.limit;

      // Verificar si ya tenemos estos datos
      const totalLoadedRecords = selectedMileage.data.length;
      const recordsNeeded =
        newOffset + selectedMileage.limit > selectedMileage.total
          ? selectedMileage.total
          : newOffset + selectedMileage.limit;

      if (totalLoadedRecords >= recordsNeeded) {
        return;
      }

      setLoadingMileageRecords(true);
      setNoise(null);

      try {
        const res = await fetch(`/api/mileage-record/by-equipment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            equipment_id: detailsEquipment?.id,
            limit: selectedMileage.limit,
            offset: newOffset,
          }),
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const newData: MultiMileageRecord = (await res.json()).data;

        newData.data = newData.data.map((record) => ({
          ...record,
          record_date: new Date(record.record_date),
          created_at: new Date(record.created_at),
          updated_at: record.updated_at
            ? new Date(record.updated_at)
            : undefined,
        }));

        if (newData.data.length > 0) {
          setEquipment((prevEquipment) => ({
            ...prevEquipment,
            data: prevEquipment.data.map((eq) => {
              if (eq.id === detailsEquipment?.id) {
                return {
                  ...eq,
                  mileage_records: {
                    ...eq.mileage_records!,
                    data: [
                      ...eq.mileage_records!.data,
                      ...newData.data.filter(
                        (newRecord) =>
                          !eq.mileage_records!.data.some(
                            (existingRecord) =>
                              existingRecord.id === newRecord.id
                          )
                      ),
                    ],
                    offset: newData.offset || 0,
                  },
                };
              }
              return eq;
            }),
          }));
        }
      } catch (err) {
        setNoise({
          type: "error",
          styleType: "modal",
          message: "Error al cargar los registros de kilometraje.",
        });
        console.error("Error fetching mileage records:", err);
      } finally {
        setLoadingMileageRecords(false);
      }
    },
    [detailsEquipment?.id, detailsEquipment?.mileage_records]
  );

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreate = async (data: MileageFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Registrando el kilometraje...",
    });

    console.log("Creating mileage record with data:", {
      equipment_id: data.equipment_id,
      record_date: dateToLocalISOString(data.record_date),
      kilometers: data.mileage,
    });
    try {
      const res = await fetch("/api/mileage-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipment_id: data.equipment_id,
          record_date: dateToLocalISOString(data.record_date),
          kilometers: data.mileage,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error creating mileage record:", err);
        throw new Error("Failed to create mileage record");
      }

      const newMileageRecordData = (await res.json()).data as {
        id: string;
        created_at: Date;
      };

      const newMileageRecord: MileageRecordBase = {
        ...data,
        record_date: new Date(dateToLocalISOString(data.record_date)),
        id: newMileageRecordData.id,
        created_at: new Date(newMileageRecordData.created_at),
        kilometers: data.mileage,
      };

      setEquipment((prev) => {
        return {
          ...prev,
          data: prev.data.map((item) => {
            if (item.id === data.equipment_id) {
              return {
                ...item,
                mileage_records: item.mileage_records
                  ? {
                      ...item.mileage_records,
                      data: item.mileage_records.data
                        ? [newMileageRecord, ...item.mileage_records.data].sort(
                            (a, b) =>
                              b.record_date.getTime() - a.record_date.getTime()
                          )
                        : [newMileageRecord],
                    }
                  : {
                      total: 1,
                      limit: 10,
                      offset: 0,
                      pages: 1,
                      data: [newMileageRecord],
                    },
              };
            }
            return item;
          }),
        };
      });
      toastVariables.success("Se ha registrado correctamente el kilometraje.");
      reset();
      setIsModalOpen(false);
      setNoise(null);
    } catch (error) {
      console.error("Error creating equipment:", error);
      setNoise(null);
      toastVariables.error("Error al crear el equipo.");
      return;
    }
  };

  const handleUpdate = async (data: MileageFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando el equipo...",
    });

    try {
      const res = await fetch(`/api/mileage-record`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          record_date: data.record_date,
          id: editingItem.id,
          kilometers: data.mileage,
          equipment_id: data.equipment_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error updating record:", err);
        throw new Error("Failed to update record");
      }

      const updatedEquipment = equipment.data.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data, updated_at: new Date() }
          : item
      );
      setEquipment({
        ...equipment,
        data: updatedEquipment,
      });
      setEditingItem(null);
      setNoise(null);
      toastVariables.success("Equipo actualizado exitosamente.");
    } catch (error) {
      console.error("Error updating equipment:", error);
      toastVariables.error("Error al actualizar el equipo.");
      setNoise(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/mileage-record`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete equipment");
      }

      setEquipment({
        ...equipment,
        data: equipment.data.filter((item) => item.id !== id),
      });
      toastVariables.success("Equipo eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toastVariables.error("Error al eliminar el equipo.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      equipment_id: "",
      mileage: 0,
      record_date: new Date(),
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEditModal = (item: MileageRecordBase) => {
    setEditingItem(item);
    setValue("equipment_id", item.equipment_id);
    setValue("mileage", item.kilometers);
    setValue("record_date", item.record_date);
    setIsModalOpen(true);
  };

  const onDetailModal = (item: EquipmentWithPaginatedRecords) => {
    setDetailsEquipment(item);
  };

  const onSubmit = async (data: MileageFormData) => {
    if (editingItem) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
    setIsModalOpen(false);
  };

  if (noise && noise.styleType === "page") {
    return <Noise noise={noise} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex items-center justify-end mb-8">
        {/* <h1 className="text-2xl font-bold">Gestión de Kilometraje</h1> */}
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Kilometraje
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipment.data
          .filter(
            (item) =>
              item.mileage_records && item.mileage_records.data.length > 0
          )
          .map((item) => (
            <DataCard
              key={item.id}
              title={item.license_plate}
              subtitle={item.type}
              badges={[{ label: item.code, variant: "secondary" }]}
              fields={[
                {
                  label: "Último kilometraje",
                  value: `${
                    item.mileage_records?.data[0]?.kilometers === 0
                      ? "0"
                      : item.mileage_records?.data[0]?.kilometers
                  } km`,
                },
                {
                  label: "Fecha",
                  value: item.mileage_records?.data[0]?.record_date
                    ? formatDate(item.mileage_records.data[0].record_date)
                    : "N/A",
                },
              ]}
              onDetails={() => {
                onDetailModal(item);
              }}
            />
          ))}
      </div>

      <PaginationComponent
        paginationData={{
          ...equipment,
          start: 0,
          end: equipment.data.length,
        }}
        onPageChange={handlePageChange}
        loading={true}
      />

      {equipment.data.length === 0 && !noise && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay registros de kilometraje
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Registrar kilometraje&quot; para agregar tu primer
            registro
          </p>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? "Editar Equipo" : "Crear Equipo"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="equipment_id">Equipo *</Label>
                <Controller
                  name="equipment_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar equipo" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
                        {equipment.data.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.type} - {equipment.code} (
                            {equipment.license_plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.equipment_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.equipment_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mileage_record_id">
                  Registro de Kilometraje *
                </Label>
                <Controller
                  name="mileage"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="Ingresa el kilometraje..."
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  )}
                />
                {errors.mileage && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.mileage.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="record_date">Fecha y Hora de Registro *</Label>
                <Controller
                  name="record_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date
                          ? dateToLocalISOString(field.value)
                          : field.value
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.record_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.record_date.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingItem ? "Actualizar Equipo" : "Crear Equipo"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {detailsEquipment && (
        <Modal onClose={() => setDetailsEquipment(null)}>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Detalles del Equipo</h2>
            <div className="space-y-4">
              <p>
                <strong>Tipo:</strong> {detailsEquipment.type}
              </p>
              <p>
                <strong>Código:</strong> {detailsEquipment.code}
              </p>
              <p>
                <strong>Matrícula:</strong> {detailsEquipment.license_plate}
              </p>
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-2">
              Registros de Kilometraje
            </h3>
            <MileageRecordsDetailView
              mileageRecords={
                equipment.data.find((eq) => eq.id === detailsEquipment.id)
                  ?.mileage_records
              }
              loading={loadingMileageRecords}
              handlePageChange={handlePageChange}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
