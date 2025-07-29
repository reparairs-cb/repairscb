import React, { useEffect, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  Loader,
} from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface Option {
  label: string;
  value: string;
}

export interface SorterOption {
  id: string;
  label: string;
  options: Option[];
}

interface SorterProps {
  options: SorterOption[];
  selectedOption: Record<string, string>;
  onSelect: (selectedOption: Record<string, string>) => Promise<void>;
}

export const Sorter = ({ options, selectedOption, onSelect }: SorterProps) => {
  const dropRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [currentSelected, setCurrentSelected] = useState<
    Record<string, string>
  >(
    selectedOption || {
      by: "created_at",
      order: "asc",
    }
  );
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCurrentSelected(selectedOption);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleFilter = () => {
    setCurrentSelected(selectedOption);
    setIsOpen(!isOpen);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const applyOrder = async () => {
    setExecuting(true);
    await onSelect(currentSelected);
    setExecuting(false);
    setIsOpen(false);
  };

  const handleSelect = (categoryId: string, option: string) => {
    setCurrentSelected((prev) => ({
      ...prev,
      [categoryId]: option,
    }));
  };

  const clearFilters = () => {
    onSelect({
      by: "priority",
      order: "desc",
    });
    setIsOpen(false);
  };

  useEffect(() => {
    setCurrentSelected(selectedOption);
  }, [selectedOption]);

  return (
    <div className="relative" ref={dropRef}>
      {/* Sorter Button */}
      <button
        type="button"
        onClick={toggleFilter}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
      >
        {currentSelected.order === "asc" ? (
          <ArrowUpNarrowWide className="w-6 h-6" />
        ) : (
          <ArrowDownWideNarrow className="w-6 h-6" />
        )}

        {currentSelected.by && (
          <span className="text-sm text-gray-600">
            {`Ordenar por: ${
              options[0].options.find((opt) => opt.value === currentSelected.by)
                ?.label || "Fecha"
            }`}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Opciones</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar todos
            </button>
          </div>

          <div className="space-y-2">
            {options.map((category) => (
              <div key={category.id} className="border-b pb-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{category.label}</h4>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedCategories[category.id] ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    expandedCategories[category.id]
                      ? "max-h-48 opacity-100 mt-2"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2 px-1">
                    {category.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={
                            currentSelected[category.id] === option.value
                          }
                          onCheckedChange={() =>
                            handleSelect(category.id, option.value)
                          }
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={applyOrder}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {executing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Aplicar Orden"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
