import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { debounce } from '@/lib/utils'
import { SEARCH_CONFIG } from '@/constants'

/**
 * Custom hook for debounced search functionality
 * Prevents excessive API calls while typing
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => T[],
  delay: number = SEARCH_CONFIG.searchDelay
) {
  const searchRef = useRef(searchFn)
  searchRef.current = searchFn

  const debouncedSearch = useMemo(
    () => debounce((query: string) => searchRef.current(query), delay),
    [delay]
  )

  return useCallback((query: string) => {
    if (query.length >= SEARCH_CONFIG.minQueryLength) {
      debouncedSearch(query)
    }
  }, [debouncedSearch])
}

/**
 * Hook for handling intersection observer with cleanup
 * Useful for infinite scrolling and lazy loading
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const observe = useCallback((element: Element | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (element) {
      observerRef.current = new IntersectionObserver(callback, options)
      observerRef.current.observe(element)
      targetRef.current = element
    }
  }, [callback, options])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return observe
}

/**
 * Hook for handling local storage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

/**
 * Hook for handling window resize events with debouncing
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const handleResize = useMemo(
    () => debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }, 150),
    []
  )

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  return windowSize
}

/**
 * Hook for handling event listeners with cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: EventTarget = window
) {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K])
    element.addEventListener(eventName, eventListener)
    return () => element.removeEventListener(eventName, eventListener)
  }, [eventName, element])
}

/**
 * Hook for handling previous values
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
