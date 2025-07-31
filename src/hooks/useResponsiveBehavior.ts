import { useEffect } from 'react'

interface ResponsiveHandlersProps {
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
}

/**
 * Custom hook for handling responsive behavior
 * Manages sidebar state based on screen size changes
 */
export function useResponsiveBehavior({ setSidebarOpen }: ResponsiveHandlersProps) {
  
  // Close sidebar when resizing to desktop on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])
}
