import React from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export interface Badge {
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

export interface ObjectElement {
  id: string;
  title: string;
  description?: string;
  badges?: Badge[];
}

export interface SelectedElement {
  id: string;
  original_index: number;
}

interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ObjectElement[];
  selected: SelectedElement[];
  onSelect: (id: string) => void;
  onUnselect: (id: string, index: number) => void;
  title?: string;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  onClose,
  data,
  selected,
  onSelect,
  onUnselect,
  title = "Seleccionar objetos",
}) => {
  const [search, setSearch] = React.useState("");
  if (!isOpen) return null;
  return (
    <Modal customZIndex={3000} onClose={onClose}>
      <div className="p-6 max-h-[80vh] lg:w-[60vw] w-[80vw] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <Input
          type="text"
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full"
        />
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="selected">Seleccionados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
          <TabsContent value="selected">
            <div className="md:grid md:grid-cols-2 md:gap-4">
              {data.filter(
                (item) =>
                  selected.some((s) => s.id === item.id) &&
                  item.title.toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay elementos seleccionados.
                </div>
              ) : (
                data
                  .filter(
                    (item) =>
                      selected.some((s) => s.id === item.id) &&
                      item.title.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((item) => {
                    const isSelected = true;
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 flex flex-col md:flex-row items-start justify-between gap-4 bg-blue-50 border-blue-400"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.badges && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.badges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    badge.color || "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {badge.icon && (
                                    <span className="mr-1">{badge.icon}</span>
                                  )}
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center h-full">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                const selectedElement = selected.find(
                                  (s) => s.id === item.id
                                );
                                if (selectedElement) {
                                  onUnselect?.(
                                    item.id,
                                    selectedElement.original_index
                                  );
                                }
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">Seleccionado</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </TabsContent>
          <TabsContent value="all">
            <div className="md:grid md:grid-cols-2 md:gap-4">
              {data.filter((item) =>
                item.title.toLowerCase().includes(search.toLowerCase())
              ).length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay elementos.
                </div>
              ) : (
                [...data]
                  .filter((item) =>
                    item.title.toLowerCase().includes(search.toLowerCase())
                  )
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((item) => {
                    const isSelected = selected.some((s) => s.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 flex flex-col md:flex-row items-start justify-between gap-4 ${
                          isSelected ? "bg-blue-50 border-blue-400" : "bg-white"
                        }`}
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.badges && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.badges.map((badge, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    badge.color || "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {badge.icon && (
                                    <span className="mr-1">{badge.icon}</span>
                                  )}
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center h-full">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onSelect(item.id);
                              } else {
                                const selectedElement = selected.find(
                                  (s) => s.id === item.id
                                );
                                if (selectedElement) {
                                  onUnselect?.(
                                    item.id,
                                    selectedElement.original_index
                                  );
                                }
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {isSelected ? "Seleccionado" : "Seleccionar"}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
