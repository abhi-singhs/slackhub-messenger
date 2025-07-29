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
  status = 'active',
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image> & { 
  showOnlineIndicator?: boolean
  status?: 'active' | 'away' | 'busy'
}) {
  const getStatusColor = (status: 'active' | 'away' | 'busy') => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className="relative">
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        {...props}
      />
      {showOnlineIndicator && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 size-3 border-2 border-background rounded-full",
          getStatusColor(status)
        )} />
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
