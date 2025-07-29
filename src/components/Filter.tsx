import React, { useEffect, useState } from "react";
import { ChevronDown, Loader, Settings2 } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface Option {
  label: string;
  value: string;
}

export interface FilterOption {
  id: string;
  label: string;
  options: Option[];
}

interface FilterProps {
  options: FilterOption[];
  selectedFilters: Record<string, string[]>;
  onFilterSelect: (selectedFilters: Record<string, string[]>) => Promise<void>;
}

export const Filter = ({
  options,
  selectedFilters,
  onFilterSelect,
}: FilterProps) => {
  const dropRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [currentFilters, setCurrentFilters] = useState<
    Record<string, string[]>
  >(selectedFilters || {});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCurrentFilters(selectedFilters);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleFilter = () => {
    setCurrentFilters(selectedFilters);
    setIsOpen(!isOpen);
  };

  const applyFilters = async () => {
    setExecuting(true);
    await onFilterSelect(currentFilters);
    setExecuting(false);
    setIsOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleFilterChange = (categoryId: string, option: string) => {
    setCurrentFilters((prev) => {
      const currentOptions = prev[categoryId] || [];
      const newFilters = currentOptions.includes(option)
        ? currentOptions.filter((item) => item !== option)
        : [...currentOptions, option];

      return {
        ...prev,
        [categoryId]: newFilters,
      };
    });
  };
  /* 
  const handleFilterSelect = (categoryId: string, option: string) => {
    const currentFilters = selectedFilters[categoryId] || [];
    const newFilters = currentFilters.includes(option)
      ? currentFilters.filter((item) => item !== option)
      : [...currentFilters, option];

    onFilterSelect({
      ...selectedFilters,
      [categoryId]: newFilters,
    });
  }; */

  const clearFilters = () => {
    onFilterSelect({});
    setIsOpen(false);
  };

  const getSelectedCount = () => {
    return Object.values(currentFilters).reduce(
      (acc, curr) => acc + curr.length,
      0
    );
  };

  useEffect(() => {
    setCurrentFilters(selectedFilters);
  }, [selectedFilters]);

  return (
    <div className="relative" ref={dropRef}>
      {/* Filter Button */}
      <button
        type="button"
        onClick={toggleFilter}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
      >
        <Settings2 className="w-6 h-6" />
        <span className="font-medium">Filtrar por</span>
        {getSelectedCount() > 0 && (
          <span className="bg-black text-white rounded-full px-2 py-0.5 text-sm">
            {getSelectedCount()}
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
            <h3 className="font-semibold text-lg">Filtros</h3>
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
                    {(currentFilters[category.id]?.length || 0) > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {currentFilters[category.id]?.length}
                      </span>
                    )}
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
                          checked={(currentFilters[category.id] || []).includes(
                            option.value
                          )}
                          onCheckedChange={() =>
                            handleFilterChange(category.id, option.value)
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
              onClick={applyFilters}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {executing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Aplicar Filtros"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
