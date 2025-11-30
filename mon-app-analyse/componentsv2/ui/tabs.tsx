"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Tabs
 * 
 * Navigation tabs with underline style.
 * Used to switch between different content sections.
 * 
 * @example
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
 *     <TabsTrigger value="structure">Structure de coût</TabsTrigger>
 *     <TabsTrigger value="recipe">Recette</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">...</TabsContent>
 *   <TabsContent value="structure">...</TabsContent>
 *   <TabsContent value="recipe">...</TabsContent>
 * </Tabs>
 */

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-0 border-b border-neutral",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex items-center justify-center px-4 py-2",
        "body-s whitespace-nowrap",
        "transition-colors duration-150",
        // Border setup (positioned to cover parent border)
        "border-b-2 -mb-px",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled styles
        "disabled:pointer-events-none disabled:opacity-50",
        // Unselected state
        "text-accent border-neutral",
        "hover:text-accent-hover hover:border-neutral-hover",
        "active:text-accent-pressed active:border-neutral-pressed",
        // Selected state
        "data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:border-primary",
        // Selected hover
        "data-[state=active]:hover:text-primary-hover data-[state=active]:hover:border-primary-hover",
        // Selected pressed
        "data-[state=active]:active:text-primary-pressed data-[state=active]:active:border-primary-pressed",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
