"use client";

interface AnimatedTextProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  gradient?: "default" | "blue" | "purple" | "rainbow";
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  isLoading = false,
  className = "",
  gradient = "default",
}) => {
  const gradientConfig = {
    default: "from-gray-300 via-gray-500 to-gray-300",
    blue: "from-blue-300 via-blue-600 to-blue-300",
    purple: "from-purple-300 via-purple-600 to-purple-300",
    rainbow:
      "from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400",
  };

  return (
    <span
      className={`${className} ${
        isLoading
          ? `animate-shimmer bg-gradient-to-r ${gradientConfig[gradient]} bg-clip-text text-transparent bg-[length:200%_100%]`
          : ""
      }`}
    >
      {children}
    </span>
  );
};