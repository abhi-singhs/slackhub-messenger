import { Button } from '@/components/ui/button'
import { COMMON_EMOJIS } from '@/utils'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => (
  <div className="grid grid-cols-8 gap-1 p-2 w-64 emoji-picker" data-emoji-picker>
    {COMMON_EMOJIS.map((emoji) => (
      <Button
        key={emoji}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-secondary"
        onClick={() => onEmojiSelect(emoji)}
        data-emoji
      >
        <span className="text-lg">{emoji}</span>
      </Button>
    ))}
  </div>
)