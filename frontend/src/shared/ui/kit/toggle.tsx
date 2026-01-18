"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "./utils";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

function toggleVariants(opts?: {
  variant?: ToggleVariant;
  size?: ToggleSize;
  extra?: string;
}) {
  const variant = opts?.variant || "default";
  const size = opts?.size || "default";
  const sizeMap: Record<ToggleSize, string> = {
    default: "toggle--medium",
    sm: "toggle--small",
    lg: "toggle--large",
  };

  return cn("toggle", `toggle--${variant}`, sizeMap[size], opts?.extra);
}

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & {
  variant?: ToggleVariant;
  size?: ToggleSize;
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={toggleVariants({ variant, size, extra: className })}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
