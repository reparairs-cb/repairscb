"use client";
import { Button } from "./ui/button";
import { NoiseType } from "@/types/noise";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleX, SquareChartGantt } from "lucide-react";
import { LoadingTyping } from "@/components/LoadingTyping";
import clsx from "clsx";

interface NoiseProps {
  noise: NoiseType;
}

export function Noise({ noise }: NoiseProps) {
  if (noise.type === "loading") {
    return (
      <div
        className={clsx(
          "fixed z-[30000] inset-0 flex items-center justify-center",
          noise.styleType === "page"
            ? "bg-background"
            : "bg-black bg-opacity-50"
        )}
      >
        <div
          role="status"
          className={cn(
            "max-w-sm bg-background rounded-lg shadow-xl p-3",
            noise.styleType === "modal" && "z-[30000]"
          )}
        >
          <div className="flex flex-col justify-center items-center border-2 border-primary-foreground shadow-lg bg-white/35 rounded-lg gap-4 p-5">
            <SquareChartGantt
              width={150}
              height={150}
              strokeWidth={1}
              className="animate-circular-dash"
            />
            <LoadingTyping text={noise.message || "Cargando..."} size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (noise.type === "error") {
    return (
      <div
        className={cn(
          "fixed  z-[30000] right-0 top-0 w-lvw h-lvh flex items-center justify-center bg-background",
          noise.styleType === "modal" && "bg-black bg-opacity-50"
        )}
      >
        <div
          role="status"
          className={cn(
            "max-w-sm bg-background rounded-lg shadow-xl p-3",
            noise.styleType === "modal" && "z-50"
          )}
        >
          <div className="flex flex-col justify-center items-center border-2 border-primary-foreground shadow-lg bg-white/35 rounded-lg gap-4 p-5">
            <div className="relative">
              <SquareChartGantt
                width={150}
                height={150}
                strokeWidth={1}
                className="animate-failed-circular-dash"
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
                <CircleX
                  size={70}
                  className="animate-jump bg-background rounded-full text-red-700"
                />
              </div>
            </div>
            <p className="flex flex-col items-center text-sm font-medium text-primary-foreground gap-y-4 text-red-700 animate-noise-content">
              {noise.message || "Algo salio mal."}
            </p>
            <div className="w-2/3 flex flex-col items-center gap-y-2">
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                variant={"outline"}
                className="text-black animate-noise-content px-4 py-2 rounded-lg w-full min-w-min"
              >
                Volver a intentar
              </Button>
              <a className="w-full" href="/">
                <Button
                  variant={"destructive"}
                  className="animate-noise-content text-white bg-red-700 px-4 py-2 rounded-lg w-full"
                >
                  Ir al inicio
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (noise.type === "success") {
    return (
      <div
        className={cn(
          "fixed  z-[30000] right-0 top-0 w-lvw h-lvh flex items-center justify-center bg-background",
          noise.styleType === "modal" && "bg-black bg-opacity-50"
        )}
      >
        <div
          role="status"
          className={cn(
            "max-w-sm bg-background rounded-lg shadow-xl p-3",
            noise.styleType === "modal" && "z-50"
          )}
        >
          <div className="flex flex-col justify-center items-center border-2 border-primary-foreground shadow-lg bg-white/35 rounded-lg gap-4 p-5">
            <div className="relative">
              <SquareChartGantt
                width={150}
                height={150}
                strokeWidth={1}
                className="animate-circular-dash"
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
                <CircleCheck
                  size={40}
                  className="animate-jump bg-primary-foreground rounded-full text-background"
                />
              </div>
            </div>
            <p className="flex flex-col items-center text-sm font-medium text-primary-foreground gap-y-4 animate-noise-content">
              {noise.message || "Todo salio bien."}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
