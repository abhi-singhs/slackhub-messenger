"use client"

import { ComponentProps } from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  showOnlineIndicator = false,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root> & { showOnlineIndicator?: boolean }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 rounded-full",
        showOnlineIndicator ? "overflow-visible" : "overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  showOnlineIndicator = false,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image> & { showOnlineIndicator?: boolean }) {
  return (
    <div className="relative">
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        {...props}
      />
      {showOnlineIndicator && (
        <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  )
}

function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
