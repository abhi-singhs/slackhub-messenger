import { useKV } from '@github/spark/hooks'
import { UserStatus } from '@/types'

export function useUserStatus() {
  const [status, setStatus] = useKV<UserStatus>('user-status', 'active')
  
  return {
    status,
    setStatus
  }
}