"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";

type SidebarContextProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState<boolean>(false);
  const isMobile = useIsMobile();

  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobile, openMobile, setOpenMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    return {
      open: true,
      setOpen: () => {},
      isMobile: false,
      openMobile: false,
      setOpenMobile: () => {},
    };
  }
  return ctx;
}

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return <aside data-slot="sidebar" className={cn("sidebar", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("sidebar__header", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("sidebar__content", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("sidebar__footer", className)} {...props} />;
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" className={cn("sidebar__group", className)} {...props} />;
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return <Comp data-slot="sidebar-group-label" className={cn("sidebar__group-label", className)} {...props} />;
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="sidebar-group-action" className={cn("sidebar__group-action", className)} {...props} />;
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("sidebar__group-content", className)} {...props} />;
}

function SidebarRail({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-rail" className={cn("sidebar__rail", className)} {...props} />;
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-separator" className={cn("sidebar__separator", className)} {...props} />;
}

function SidebarInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="sidebar-input" className={cn("sidebar__input", className)} {...props} />;
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("sidebar__inset", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("sidebar__menu", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("sidebar__menu-item", className)} {...props} />;
}

function SidebarMenuButton({ className, ...props }: React.ComponentProps<"button">) {
  return <button data-slot="sidebar-menu-button" className={cn("sidebar__menu-button", className)} {...props} />;
}

function SidebarMenuAction({ className, ...props }: React.ComponentProps<"button">) {
  return <button data-slot="sidebar-menu-action" className={cn("sidebar__menu-action", className)} {...props} />;
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-menu-badge" className={cn("sidebar__menu-badge", className)} {...props} />;
}

function SidebarMenuSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-menu-skeleton" className={cn("sidebar__menu-skeleton", className)} {...props} />;
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu-sub" className={cn("sidebar__menu-sub", className)} {...props} />;
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("sidebar__menu-sub-item", className)} {...props} />;
}

function SidebarMenuSubButton({ className, ...props }: React.ComponentProps<"a">) {
  return <a data-slot="sidebar-menu-sub-button" className={cn("sidebar__menu-sub-button", className)} {...props} />;
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return <button data-slot="sidebar-trigger" className={cn("sidebar__trigger", className)} {...props} />;
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
