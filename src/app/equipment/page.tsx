"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus } from "lucide-react";
import type { EquipmentFormData } from "@/lib/schemas";
import type { MultiEquipment, EquipmentBase } from "@/types/equipment";
import { equipmentSchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";

export default function EquipmentPage() {
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState<EquipmentBase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentBase | null>(null);
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
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: editingItem || {
      type: "",
      license_plate: "",
      code: "",
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
        const res = await fetch("/api/equipments");

        if (!res.ok) {
          throw new Error("Failed to fetch equipment");
        }

        const data = (await res.json()).data as MultiEquipment;
        console.log("Fetched equipment:", data.data);
        setEquipment(
          data.data.map((item) => ({
            ...item,
            created_at: new Date(item.created_at),
            updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
          }))
        );
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

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreate = async (data: EquipmentFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando el equipo...",
    });

    try {
      const res = await fetch("/api/equipments?limit=0", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to create equipment");
      }

      // Assuming the API returns the created equipment
      const newEquipmentData = (await res.json()).data as {
        id: string;
        created_at: Date;
      };

      console.log("New equipment created:", newEquipmentData);

      // Update the state with the new equipment
      const newEquipment: EquipmentBase = {
        ...data,
        id: newEquipmentData.id,
        created_at: new Date(newEquipmentData.created_at),
        user_id: session.user.id,
      };

      setNoise(null);
      toastVariables.success("Equipo creado exitosamente.");
      setEquipment((prev) => [...prev, newEquipment]);
    } catch (error) {
      console.error("Error creating equipment:", error);
      setNoise(null);
      toastVariables.error("Error al crear el equipo.");
      return;
    }
  };

  const handleUpdate = async (data: EquipmentFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando el equipo...",
    });

    try {
      const res = await fetch(`/api/equipments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          id: editingItem.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update equipment");
      }

      const updatedEquipment = equipment.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...data, updated_at: new Date() }
          : item
      );
      setEquipment(updatedEquipment);
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
      const res = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete equipment");
      }

      setEquipment(equipment.filter((item) => item.id !== id));
      toastVariables.success("Equipo eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toastVariables.error("Error al eliminar el equipo.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      type: "",
      license_plate: "",
      code: "",
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEditModal = (item: EquipmentBase) => {
    setEditingItem(item);
    setValue("type", item.type);
    setValue("license_plate", item.license_plate);
    setValue("code", item.code);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EquipmentFormData) => {
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Equipo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipment.map((item) => (
          <DataCard
            key={item.id}
            title={item.type}
            subtitle={item.license_plate}
            badges={[
              { label: item.code, variant: "secondary" },
              { label: "Activo", variant: "outline" },
            ]}
            fields={[
              { label: "Tipo", value: item.type },
              { label: "Placa", value: item.license_plate },
              { label: "Código", value: item.code },
              { label: "Creado", value: item.created_at.toLocaleDateString() },
              ...(item.updated_at
                ? [
                    {
                      label: "Actualizado",
                      value: item.updated_at.toLocaleDateString(),
                    },
                  ]
                : []),
            ]}
            onEdit={() => {
              /* openEditModal(item); */
            }}
            onDelete={() => {
              /* handleDelete(item.id); */
            }}
          />
        ))}
      </div>

      {equipment.length === 0 && !noise && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay equipos registrados</p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Crear Equipo&quot; para agregar tu primer equipo
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
              <div className="mb-4">
                <Label htmlFor="type">Tipo de Equipo</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="type"
                      placeholder="Ej: Excavadora, Grúa, Camión"
                      {...field}
                    />
                  )}
                />
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="license_plate">Placa</Label>
                <Controller
                  name="license_plate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="license_plate"
                      placeholder="Ej: ABC-123"
                      {...field}
                    />
                  )}
                />
                {errors.license_plate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.license_plate.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="code">Código de Equipo</Label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="code"
                      placeholder="Código único del equipo"
                      {...field}
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.code.message}
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
    </div>
  );
}
