"use client"

import { Toaster as Sonner } from "sonner"
import { buttonVariants } from "@/componentsv2/ui/button"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: cn(buttonVariants({ size: "sm" })),
          cancelButton: cn(buttonVariants({ variant: "outline", size: "sm" })),
          success: "group-[.toaster]:[&>svg]:text-green-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
