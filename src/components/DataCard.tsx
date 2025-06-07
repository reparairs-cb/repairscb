"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronRight } from "lucide-react";

interface DataCardProps {
  title: string;
  subtitle?: string;
  badges?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[];
  fields: { label: string; value: string | number | undefined }[];
  onEdit?: () => void;
  onDelete?: () => void;
  onDetails?: () => void;
}

export function DataCard({
  title,
  subtitle,
  badges,
  fields,
  onEdit,
  onDelete,
  onDetails,
}: DataCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              {onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || "default"}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {field.label}:
              </span>
              <span className="text-sm font-medium">
                {field.value || "N/A"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      {onDetails && (
        <CardFooter className="">
          <div className="flex justify-end">
            <Button variant="link" size="sm" onClick={onDetails}>
              Ver Detalles <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
