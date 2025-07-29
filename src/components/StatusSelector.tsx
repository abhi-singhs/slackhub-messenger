import { UserStatus } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusIndicator } from '@/components/StatusIndicator'
import { Button } from '@/components/ui/button'
import { Check } from '@phosphor-icons/react'

interface StatusSelectorProps {
  currentStatus: UserStatus
  onStatusChange: (status: UserStatus) => void
}

const statusOptions: { value: UserStatus; label: string; description: string }[] = [
  { value: 'active', label: 'Active', description: 'Available and ready to chat' },
  { value: 'away', label: 'Away', description: 'Temporarily away from the computer' },
  { value: 'busy', label: 'Busy', description: 'Focused and may not respond immediately' }
]

export function StatusSelector({ currentStatus, onStatusChange }: StatusSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-1 rounded-full">
          <StatusIndicator status={currentStatus} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <StatusIndicator status={option.value} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                {currentStatus === option.value && (
                  <Check className="h-4 w-4 text-accent" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}