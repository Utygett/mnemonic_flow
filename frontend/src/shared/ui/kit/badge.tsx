import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function badgeVariants(opts?: { variant?: BadgeVariant; extra?: string }) {
  const variant = opts?.variant || "default";
  return cn("badge", `badge--${variant}`, opts?.extra);
}

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant; asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={badgeVariants({ variant, extra: className })}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
