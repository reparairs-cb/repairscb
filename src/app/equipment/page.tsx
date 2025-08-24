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
import {
  MaintenancePlanBase,
  MultiMaintenancePlan,
} from "@/types/maintenance-plan";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EquipmentPage() {
  const { data: session } = useSession();
  const [equipment, setEquipment] = useState<EquipmentBase[]>([]);
  const [plans, setPlans] = useState<MaintenancePlanBase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentBase | null>(null);
  const [restrictions, setRestrictions] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingRestrictions, setLoadingRestrictions] = useState(false);
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
      } catch (error) {
        console.error("Error fetching equipment:", error);
        throw new Error("Error al cargar los equipos.");
      }
    };

    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/maintenance-plan?limit=0");

        if (!res.ok) {
          throw new Error("Failed to fetch maintenance plans");
        }

        const data = (await res.json()).data as MultiMaintenancePlan;
        console.log("Fetched maintenance plans:", data);
        setPlans(data.data);
      } catch (error) {
        console.error("Error fetching maintenance plans:", error);
        throw new Error("Error al cargar los planes de mantenimiento.");
      }
    };

    const fetchData = async () => {
      try {
        setNoise({
          type: "loading",
          styleType: "page",
          message: "Cargando equipos y planes de mantenimiento...",
        });
        await fetchEquipment();
        setNoise({
          type: "loading",
          styleType: "page",
          message: "Cargando planes de mantenimiento...",
        });
        await fetchPlans();
        setNoise(null);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los datos. Por favor, inténtalo de nuevo.",
        });
      }
    };

    fetchData();
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
        maintenance_plan_id: data.maintenance_plan_id,
        maintenance_plan: {
          id: data.maintenance_plan_id,
          name:
            plans.find((plan) => plan.id === data.maintenance_plan_id)?.name ||
            "Plan indefinido",
        },
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
          ? {
              ...item,
              ...data,
              updated_at: new Date(),
              maintenance_plan: {
                id: data.maintenance_plan_id,
                name:
                  plans.find((plan) => plan.id === data.maintenance_plan_id)
                    ?.name || "Plan indefinido",
              },
            }
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/equipments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error deleting equipment:", err);

        throw new Error(
          err.message ===
          "No se puede eliminar el equipo porque tiene registros asociados."
            ? err.message
            : "Failed to delete equipment"
        );
      }

      setEquipment(equipment.filter((item) => item.id !== id));
      toastVariables.success("Equipo eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting equipment:", error);
      if (error instanceof Error) {
        toastVariables.error(
          error.message ===
            "No se puede eliminar el equipo porque tiene registros asociados."
            ? error.message
            : "Error al eliminar el equipo."
        );
      }
      toastVariables.error("Error al eliminar el equipo.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      type: "",
      license_plate: "",
      code: "",
      maintenance_plan_id: "",
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const handleRestrictionCheck = async (equipmentId: string) => {
    setLoadingRestrictions(true);
    try {
      const res = await fetch("/api/equipments/has-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ equipment_id: equipmentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Error fetching restrictions:", err);
        throw new Error("Failed to fetch restrictions");
      }
      const data = (await res.json()).data;
      setRestrictions((prev) => ({
        ...prev,
        [equipmentId]: data,
      }));
    } catch (error) {
      console.error("Error fetching restrictions:", error);
    } finally {
      setLoadingRestrictions(false);
    }
  };

  const openEditModal = (item: EquipmentBase) => {
    handleRestrictionCheck(item.id);
    setEditingItem(item);
    setValue("type", item.type);
    setValue("license_plate", item.license_plate);
    setValue("code", item.code);
    setValue("maintenance_plan_id", item.maintenance_plan_id);
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
      <div className="flex items-center justify-end mb-8">
        {/* <h1 className="text-2xl font-bold">Gestión de Equipos</h1> */}
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
            badges={[{ label: item.code, variant: "secondary" }]}
            fields={[
              { label: "Tipo", value: item.type },
              { label: "Placa", value: item.license_plate },
              { label: "Código", value: item.code },
              {
                label: "Plan de Mantenimiento",
                value: item.maintenance_plan?.name || "Plan indefinido",
              },
            ]}
            onEdit={() => {
              openEditModal(item);
            }}
            onDelete={() => {
              handleDelete(item.id);
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

              <div className="mb-4 flex flex-col gap-1">
                <Label htmlFor="maintenance_plan_id">
                  Plan de Mantenimiento
                </Label>
                <Controller
                  name="maintenance_plan_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      disabled={
                        loadingRestrictions || restrictions["has_records"]
                      }
                      defaultValue={editingItem?.maintenance_plan_id || ""}
                      onValueChange={(value) => {
                        if (!editingItem || !restrictions["has_records"]) {
                          field.onChange(value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent className="z-[1000]">
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.maintenance_plan_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.maintenance_plan_id.message}
                  </p>
                )}

                <div className="mt-2">
                  {editingItem && loadingRestrictions && (
                    <p className="text-yellow-500 text-sm">
                      Verificando restricciones de actualización...
                    </p>
                  )}
                  {editingItem && restrictions["has_records"] && (
                    <p className="text-red-500 text-sm">
                      No puedes modificar el plan de mantenimiento porque ya
                      está asociado a un registro de kilometraje y/o
                      mantenimiento.
                    </p>
                  )}
                </div>
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={(editingItem && loadingRestrictions) || false}
                >
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
