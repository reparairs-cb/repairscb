import { TableOfContents } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  CheckCheck,
  ClipboardList,
  LoaderCircle,
  OctagonAlert,
  ClockAlert,
  AlarmClock,
  AlarmClockCheck,
  AlarmClockOff,
} from "lucide-react";

export const bgByCod: Record<string, string> = {
  total: "bg-gray-500 hover:bg-gray-600",
  completed: "bg-green-500 hover:bg-green-600",
  in_progress: "bg-yellow-500 hover:bg-yellow-600",
  pending: "bg-blue-500 hover:bg-blue-600",
  immediate: "bg-red-500 hover:bg-red-600",
  high: "bg-orange-500 hover:bg-orange-600",
  medium: "bg-teal-500 hover:bg-teal-600",
  low: "bg-purple-500 hover:bg-purple-600",
  no: "bg-gray-300 hover:bg-gray-400",
};

export const StatusPriority = ({
  count,
  cod,
  classNameBadge = "mx-2",
  classNameIcon = "mr-1",
}: {
  count: number;
  cod: string;
  classNameBadge?: string;
  classNameIcon?: string;
}) => {
  const iconCod = (
    <StatusPriorityIcon cod={cod} classNameIcon={classNameIcon} />
  );

  return (
    <Badge className={`${classNameBadge} ${bgByCod[cod] || "bg-gray-500"}`}>
      {iconCod}
      {count > 0 ? count : "0"}
    </Badge>
  );
};

export const StatusPriorityIcon = ({
  cod,
  classNameIcon,
}: {
  cod: string;
  classNameIcon?: string;
}) => {
  let iconCod = <></>;

  switch (cod) {
    case "total":
      iconCod = <TableOfContents className={`${classNameIcon}`} />;
      break;
    case "completed":
      iconCod = <CheckCheck className={`${classNameIcon}`} />;
      break;
    case "in_progress":
      iconCod = <LoaderCircle className={`${classNameIcon}`} />;
      break;
    case "pending":
      iconCod = <ClipboardList className={`${classNameIcon}`} />;
      break;
    case "immediate":
      iconCod = <OctagonAlert className={`${classNameIcon}`} />;
      break;
    case "high":
      iconCod = <ClockAlert className={`${classNameIcon}`} />;
      break;
    case "medium":
      iconCod = <AlarmClock className={`${classNameIcon}`} />;
      break;
    case "low":
      iconCod = <AlarmClockCheck className={`${classNameIcon}`} />;
      break;
    case "no":
      iconCod = <AlarmClockOff className={`${classNameIcon}`} />;
      break;
    default:
      iconCod = <LoaderCircle className={`${classNameIcon}`} />;
      break;
  }

  return iconCod;
};
