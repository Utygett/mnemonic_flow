import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

function buttonVariants(opts?: { variant?: Variant; size?: Size; extra?: string }) {
  const variant = opts?.variant || "default";
  const size = opts?.size || "default";
  const sizeMap: Record<Size, string> = {
    default: "btn--medium",
    sm: "btn--small",
    lg: "btn--large",
    icon: "btn--icon",
  };

  return cn("btn", `btn--${variant}`, sizeMap[size], opts?.extra);
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={buttonVariants({ variant, size, extra: className })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
