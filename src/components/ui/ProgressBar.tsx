"use client";

import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "gradient";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  primary: "bg-primary-500",
  success: "bg-success",
  warning: "bg-warning",
  gradient: "bg-gradient-to-r from-primary-500 to-primary-300",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel,
  className,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 rounded-full bg-surface-tertiary overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            variantClasses[variant],
            animated && "animate-pulse-glow"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
