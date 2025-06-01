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
        const res = await fetch("/api/spare-parts");

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

  const handleUpdate = (data: SparePartFormData) => {
    if (!editingItem) return;

    const updatedSpareParts = spareParts.map((item) =>
      item.id === editingItem.id
        ? { ...item, ...data, updated_at: new Date() }
        : item
    );
    setSpareParts(updatedSpareParts);
    setEditingItem(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (id: string) => {
    setSpareParts(spareParts.filter((item) => item.id !== id));
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <div className="container mx-auto px-4 py-8">
      {noise && <Noise noise={noise} />}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestión de Repuestos</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Equipo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {spareParts.map((item) => (
          <DataCard
            key={item.id}
            title={item.name}
            subtitle={item.factory_code}
            badges={[
              { label: `$${item.price.toFixed(2)}`, variant: "secondary" },
              ...(item.image_url
                ? [{ label: "Has Image", variant: "outline" as const }]
                : []),
            ]}
            fields={[
              { label: "Factory Code", value: item.factory_code },
              { label: "Price", value: `S/.${item.price.toFixed(2)}` },
              { label: "Description", value: item.description },
              { label: "Created", value: item.created_at.toLocaleDateString() },
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

      {isModalOpen && (
        <Modal onClose={handleCancel}>
          <div className="p-6 max-h-[90vh] max-w-[75vw] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? "Edit Spare Part" : "Create Spare Part"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="factory_code">Código de Fabrica</Label>
                <Controller
                  name="factory_code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="factory_code"
                      placeholder="Enter factory code"
                      {...field}
                    />
                  )}
                />
                {errors.factory_code && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.factory_code.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="name">Nombre</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input id="name" placeholder="Enter name" {...field} />
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="description">Descripción</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="description"
                      placeholder="Enter description"
                      {...field}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <Label htmlFor="price">Precio</Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? "" : value);
                      }}
                    />
                  )}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Controller
                  name="image_url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="image_url"
                      placeholder="Enter image URL"
                      disabled
                      {...field}
                    />
                  )}
                />
                {errors.image_url && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.image_url.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Update Spare Part" : "Create Spare Part"}
              </Button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
