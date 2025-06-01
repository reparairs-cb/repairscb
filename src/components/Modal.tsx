"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useEffect } from "react";

interface ModalProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
  onClose?: () => void;
  customZIndex?: number;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  className,
  onClose,
  children,
  customZIndex,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div
      ref={modalRef}
      className={`m-0  fixed inset-0 flex items-center justify-center bg-black bg-opacity-50`}
      style={{ zIndex: customZIndex || 1000 }}
    >
      <div
        className={cn(
          `relative flex flex-col z-50 justify-center items-center gap-4 bg-white p-5 lg:p-7 rounded-lg`,
          className
        )}
      >
        <div
          className="w-8 h-8 bg-white absolute -top-4 -right-4 text-2xl font-bold text-black text-center rounded-full shadow-lg flex items-center justify-center cursor-pointer"
          onClick={handleClose}
        >
          &times;
        </div>
        {children}
      </div>
    </div>
  );
};