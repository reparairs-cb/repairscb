"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/DataCard";
import { Plus } from "lucide-react";
import type { SparePartFormData } from "@/lib/schemas";
import type { MultiSparePart, SparePartBase } from "@/types/spare-part";
import { sparePartSchema } from "@/lib/schemas";
import { Modal } from "@/components/Modal";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoiseType } from "@/types/noise";
import { Noise } from "@/components/Noise";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toastVariables } from "@/components/ToastVariables";
import { Textarea } from "@/components/ui/textarea";

export default function SparePartsPage() {
  const { data: session } = useSession();
  const [spareParts, setSpareParts] = useState<SparePartBase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SparePartBase | null>(null);
  const [noise, setNoise] = useState<NoiseType | null>({
    type: "loading",
    styleType: "page",
    message: "Loading spare parts...",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SparePartFormData>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: editingItem || {
      factory_code: "",
      name: "",
      description: "",
      price: 0,
      image_url: "",
    },
  });

  useEffect(() => {
    // Simulate fetching spare parts from an API
    const fetchSpareParts = async () => {
      setNoise({
        type: "loading",
        styleType: "page",
        message: "Cargando repuestos...",
      });

      try {
        const res = await fetch("/api/spare-parts?limit=0");

        if (!res.ok) {
          throw new Error("Failed to fetch spare parts");
        }

        const data = (await res.json()).data as MultiSparePart;
        console.log("Fetched spare parts:", data.data);
        setSpareParts(
          data.data.map((item) => ({
            ...item,
            created_at: new Date(item.created_at),
            updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
          }))
        );
        setNoise(null);
      } catch (error) {
        console.error("Error fetching spare parts:", error);
        setNoise({
          type: "error",
          styleType: "page",
          message: "Error al cargar los repuestos.",
        });
      }
    };

    fetchSpareParts();
  }, []);

  if (!session || !session.user?.id) {
    return null;
  }

  const handleCreate = async (data: SparePartFormData) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Creando el repuesto...",
    });

    try {
      const res = await fetch("/api/spare-parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to create spare part");
      }

      // Assuming the API returns the created spare part
      const new_spare_part_data = (await res.json()) as {
        id: string;
        created_at: Date;
      };

      // Update the state with the new spare part
      const newSparePart: SparePartBase = {
        ...data,
        id: new_spare_part_data.id,
        created_at: new Date(new_spare_part_data.created_at),
        user_id: session.user.id,
      };

      setNoise(null);
      toastVariables.success("Repuesto creado exitosamente.");
      setSpareParts((prev) => [...prev, newSparePart]);
    } catch (error) {
      setNoise(null);
      console.error("Error creating spare part:", error);
      toastVariables.error("Error al crear el repuesto.");
      return;
    }
  };

  const handleUpdate = async (data: SparePartFormData) => {
    if (!editingItem) return;

    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Actualizando el repuesto...",
    });

    try {
      const res = await fetch(`/api/spare-parts`, {
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
        throw new Error("Failed to update spare part");
      }

      setSpareParts((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...data,
                id: editingItem.id,
                created_at: editingItem.created_at,
                updated_at: new Date(),
                user_id: editingItem.user_id,
              }
            : item
        )
      );
      setNoise(null);
      toastVariables.success("Repuesto actualizado exitosamente.");
    } catch (error) {
      setNoise(null);
      console.error("Error updating spare part:", error);
      toastVariables.error("Error al actualizar el repuesto.");
    }
  };

  const handleDelete = async (id: string) => {
    setNoise({
      type: "loading",
      styleType: "modal",
      message: "Eliminando el repuesto...",
    });

    try {
      const res = await fetch(`/api/spare-parts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete spare part");
      }

      setSpareParts(spareParts.filter((item) => item.id !== id));
      setNoise(null);
      toastVariables.success("Repuesto eliminado exitosamente.");
    } catch (error) {
      console.error("Error deleting spare part:", error);
      setNoise(null);
      toastVariables.error("Error al eliminar el repuesto.");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const openEditModal = (item: SparePartBase) => {
    setEditingItem(item);
    setValue("factory_code", item.factory_code);
    setValue("name", item.name);
    setValue("price", item.price);
    if (item.description) {
      setValue("description", item.description);
    }
    if (item.image_url) {
      setValue("image_url", item.image_url);
    }

    setIsModalOpen(true);
  };

  const onSubmit = async (data: SparePartFormData) => {
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
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mb-6 sm:mb-8 gap-4 sm:gap-0">
        {/* <h1 className="text-2xl font-bold">Gestión de Repuestos</h1> */}
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Crear Repuesto</span>
          <span className="inline xs:hidden">Crear</span>
        </Button>
      </div>

      {spareParts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay repuestos disponibles.</p>
          <p className="text-gray-400 text-sm mt-2">
            Haz clic en &quot;Crear repuestos&quot; para agregar tu primer
            repuestos
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {spareParts.map((item) => (
          <DataCard
            key={item.id}
            title={item.name}
            subtitle={item.factory_code}
            badges={[
              { label: `S/.${item.price.toFixed(2)}`, variant: "secondary" },
              /* ...(item.image_url
                ? [{ label: "Has Image", variant: "outline" as const }]
                : []), */
            ]}
            fields={[
              { label: "Código de Fab.", value: item.factory_code },
              { label: "Precio", value: `S/.${item.price.toFixed(2)}` },
              { label: "Descripción", value: item.description },
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

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-4 sm:p-6 max-h-[90vh] w-full sm:max-w-[75vw] max-w-[95vw] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              {editingItem ? "Editar Repuesto" : "Crear Repuesto"}
            </h2>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-3 sm:space-y-4"
            >
              <div className="mb-3 sm:mb-4 w-full">
                <Label htmlFor="factory_code" className="block mb-1">
                  Código de Fabrica
                </Label>
                <Controller
                  name="factory_code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="factory_code"
                      placeholder="Ingresa el código"
                      className="w-full"
                      {...field}
                    />
                  )}
                />
                {errors.factory_code && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.factory_code.message}
                  </p>
                )}
              </div>

              <div className="mb-3 sm:mb-4 w-full">
                <Label htmlFor="name" className="block mb-1">
                  Nombre
                </Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ingresa el nombre"
                      className="w-full"
                      {...field}
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="mb-3 sm:mb-4 w-full">
                <Label htmlFor="description" className="block mb-1">
                  Descripción
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="description"
                      placeholder="Ingresa la descripción"
                      className="w-full"
                      {...field}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="mb-3 sm:mb-4 w-full">
                <Label htmlFor="price" className="block mb-1">
                  Precio
                </Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="price"
                      type="text"
                      placeholder="Ingresa el precio"
                      className="w-full"
                      value={field.value || ""}
                      onChange={(e) => {
                        try {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? "" : value);
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (error) {}
                      }}
                    />
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              {/* <div className="mb-3 sm:mb-4 w-full">
                <Label htmlFor="image_url" className="block mb-1">
                  URL de Imagen
                </Label>
                <Controller
                  name="image_url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="image_url"
                      placeholder="Ingresa la URL de la imagen"
                      className="w-full"
                      disabled
                      {...field}
                    />
                  )}
                />
                {errors.image_url && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.image_url.message}
                  </p>
                )}
              </div> */}
              <Button
                type="submit"
                className="w-full mt-4 text-base sm:text-lg py-2 sm:py-3"
              >
                {editingItem ? "Actualizar Repuesto" : "Crear Repuesto"}
              </Button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
