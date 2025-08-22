// Recursive component for maintenance type selection dropdown
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { MaintenanceTypeWithChildren } from "@/types/maintenance-type";

interface MaintenanceTypeOptionProps {
  node: MaintenanceTypeWithChildren;
  level: number;
  selectedValue?: string;
}

export const MaintenanceTypeOption: React.FC<MaintenanceTypeOptionProps> = ({
  node,
  level,
  selectedValue,
}) => {
  const indent = "—".repeat(level);

  return (
    <>
      <SelectItem
        value={node.id}
        className={selectedValue === node.id ? "bg-blue-50" : ""}
      >
        {indent} {node.type} (Nivel {node.level})
      </SelectItem>
      {node.children?.map((child) => (
        <MaintenanceTypeOption
          key={child.id}
          node={child}
          level={level + 1}
          selectedValue={selectedValue}
        />
      ))}
    </>
  );
};

export const MaintenanceTypeSelect: React.FC<{
  maintenanceTypes: MaintenanceTypeWithChildren[];
  selectedValue?: string;
  onChange: (value: string) => void;
  emptyMessage?: string;
}> = ({ maintenanceTypes, selectedValue, onChange, emptyMessage }) => {
  return (
    <>
      <Select value={selectedValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tipo de mantenimiento..." />
        </SelectTrigger>
        <SelectContent className="z-[10000] lg:max-h-[30vh] md:max-h-[40vh] max-h-[60vh]">
          {maintenanceTypes.length > 0 ? (
            maintenanceTypes.map((node) => (
              <MaintenanceTypeOption
                key={node.id}
                node={node}
                level={0}
                selectedValue={selectedValue}
              />
            ))
          ) : (
            <SelectItem disabled value="none">
              {emptyMessage || "No hay tipos de mantenimiento disponibles"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </>
  );
};
