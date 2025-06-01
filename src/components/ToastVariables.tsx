"use client";
import { CircleCheck, CircleX } from "lucide-react";
import { toast } from "sonner";

export const toastVariables = {
  success: (msg?: string) => {
    return toast.success(
      <h3 className="mx-2 font-sans text-base font-medium animate-noise-content">
        {msg || "Ha sido exitoso"}
      </h3>,
      {
        style: {
          backgroundColor: "white",
          color: "green",
          borderColor: "green",
        },
        icon: <CircleCheck className="animate-circular-dash" />,
      }
    );
  },
  error: (msg?: string) => {
    return toast.success(
      <h3 className="mx-2 font-sans text-base font-medium animate-noise-content">
        {msg || "Hubo un error inesperado."}
      </h3>,
      {
        style: {
          backgroundColor: "white",
          color: "red",
          borderColor: "red",
        },
        icon: <CircleX className="animate-circular-dash" />,
      }
    );
  },
};
