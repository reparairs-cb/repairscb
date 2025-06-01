"use client";
import React, { useState, useEffect } from "react";

interface LoadingTypingProps {
  text?: string;
  speed?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  showCursor?: boolean;
  pauseDuration?: number;
}

const sizeClasses = {
  sm: { text: "text-sm", icon: "w-4 h-4" },
  md: { text: "text-base", icon: "w-5 h-5" },
  lg: { text: "text-lg", icon: "w-6 h-6" },
};

export function LoadingTyping({
  text = "Sistema en progreso",
  speed = 50,
  size = "md",
  color = "text-secondary-foreground",
  showCursor = true,
  pauseDuration = 2000,
}: LoadingTypingProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    if (!isErasing && currentIndex < text.length) {
      // Writing phase - speed increases as we write
      const progress = currentIndex / text.length;
      const currentSpeed = speed * (2.5 - 2 * progress);

      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, currentSpeed);

      return () => clearTimeout(timeout);
    } else if (!isErasing && currentIndex >= text.length) {
      // Text is fully written, wait before starting to erase
      setIsComplete(true);
      const pauseTimeout = setTimeout(() => {
        setIsErasing(true);
      }, pauseDuration);

      return () => clearTimeout(pauseTimeout);
    } else if (isErasing && displayText.length > 0) {
      // Erasing phase - constant speed for erasing
      const eraseTimeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, speed / 2.5); // Erase faster than typing

      return () => clearTimeout(eraseTimeout);
    } else if (isErasing && displayText.length === 0) {
      // Reset everything after erasing
      setIsErasing(false);
      setIsComplete(false);
      setCurrentIndex(0);
    }
  }, [
    currentIndex,
    text,
    speed,
    pauseDuration,
    isComplete,
    isErasing,
    displayText.length,
  ]);

  return (
    <div className="relative flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size].text} p-2 flex flex-col items-center justify-center text-center font-medium ${color}`}
      >
        <span className="opacity-0">{text}</span>
        <div className="absolute top-0">
          {displayText}
          {showCursor && (
            <span className="inline-block w-[2px] h-[1.2em] bg-current align-middle animate-pulse">
              |
            </span>
          )}
        </div>
      </div>
    </div>
  );
}