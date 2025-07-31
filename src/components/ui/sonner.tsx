import { CSSProperties, useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    updateTheme()
    
    // Create observer to watch for dark mode changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const theme = isDark ? 'dark' : 'light'

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
