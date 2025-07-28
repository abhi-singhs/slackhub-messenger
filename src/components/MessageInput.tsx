import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PaperPlaneRight, TextB, TextItalic, Minus, Quotes, Code, Smiley } from '@phosphor-icons/react'
import { Channel } from '@/types'
import { getPlainTextFromHTML } from '@/utils'
import { EmojiPicker } from './EmojiPicker'

interface MessageInputProps {
  channels: Channel[]
  currentChannel: string
  messageInput: string
  activeFormats: Set<string>
  showInputEmojiPicker: boolean
  onMessageInput: (content: string) => void
  onActiveFormatsChange: (formats: Set<string>) => void
  onEmojiPickerToggle: (show: boolean) => void
  onSendMessage: () => void
}

export const MessageInput = ({
  channels,
  currentChannel,
  messageInput,
  activeFormats,
  showInputEmojiPicker,
  onMessageInput,
  onActiveFormatsChange,
  onEmojiPickerToggle,
  onSendMessage
}: MessageInputProps) => {
  const messageInputRef = useRef<HTMLDivElement>(null)

  // Check active formats based on cursor position
  const checkActiveFormats = () => {
    try {
      const input = messageInputRef.current
      if (!input) return

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      let node = range.commonAncestorContainer

      // If text node, get parent element
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode
      }

      const activeSet = new Set<string>()
      
      // Walk up the DOM tree to check for formatting elements
      let current = node as HTMLElement
      while (current && current !== input) {
        const tagName = current.tagName?.toLowerCase()
        
        switch (tagName) {
          case 'strong':
          case 'b':
            activeSet.add('bold')
            break
          case 'em':
          case 'i':
            activeSet.add('italic')
            break
          case 'del':
            activeSet.add('strikethrough')
            break
          case 'blockquote':
            activeSet.add('quote')
            break
          case 'code':
          case 'pre':
            activeSet.add('code')
            break
        }
        
        current = current.parentElement as HTMLElement
      }

      onActiveFormatsChange(activeSet)
    } catch (error) {
      console.error('Error checking active formats:', error)
    }
  }

  // Format selected text
  const formatText = (format: 'bold' | 'italic' | 'strikethrough' | 'quote' | 'code') => {
    try {
      const input = messageInputRef.current
      if (!input) return

      const selection = window.getSelection()
      if (!selection) return

      // If no selection, ensure we have a collapsed selection at cursor
      if (selection.rangeCount === 0) {
        const range = document.createRange()
        range.selectNodeContents(input)
        range.collapse(false)
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      // If no text is selected, only apply formatting for future typing
      if (!selectedText) {
        // Just maintain cursor position without adding empty tags
        input.focus()
        return
      }

      // Check if the selected text is already formatted with this type
      const container = range.commonAncestorContainer
      let parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement
      let isAlreadyFormatted = false
      let formattedElement: HTMLElement | null = null

      // Walk up the DOM tree to find existing formatting
      while (parentElement && parentElement !== input) {
        const tagName = parentElement.tagName?.toLowerCase()
        
        let matchesFormat = false
        switch (format) {
          case 'bold':
            matchesFormat = tagName === 'strong' || tagName === 'b'
            break
          case 'italic':
            matchesFormat = tagName === 'em' || tagName === 'i'
            break
          case 'strikethrough':
            matchesFormat = tagName === 'del'
            break
          case 'quote':
            matchesFormat = tagName === 'blockquote'
            break
          case 'code':
            matchesFormat = tagName === 'code' || tagName === 'pre'
            break
        }
        
        if (matchesFormat) {
          isAlreadyFormatted = true
          formattedElement = parentElement
          break
        }
        
        parentElement = parentElement.parentElement
      }

      if (isAlreadyFormatted && formattedElement) {
        // Remove formatting by replacing the formatted element with its text content
        const textContent = formattedElement.textContent || ''
        const textNode = document.createTextNode(textContent)
        
        formattedElement.parentNode?.replaceChild(textNode, formattedElement)
        
        // Select the unformatted text
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // Apply formatting
        let formattedHTML = ''

        switch (format) {
          case 'bold':
            formattedHTML = `<strong>${selectedText}</strong>`
            break
          case 'italic':
            formattedHTML = `<em>${selectedText}</em>`
            break
          case 'strikethrough':
            formattedHTML = `<del>${selectedText}</del>`
            break
          case 'quote':
            formattedHTML = `<blockquote class="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic">${selectedText}</blockquote>`
            break
          case 'code':
            if (selectedText.includes('\n')) {
              formattedHTML = `<pre class="bg-muted p-2 rounded font-mono text-xs block">${selectedText}</pre>`
            } else {
              formattedHTML = `<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">${selectedText}</code>`
            }
            break
        }

        // Replace the selected content with formatted HTML
        range.deleteContents()
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = formattedHTML
        const fragment = document.createDocumentFragment()
        
        let lastNode: Node | null = null
        while (tempDiv.firstChild) {
          const node = tempDiv.firstChild
          fragment.appendChild(node)
          lastNode = node
        }
        
        range.insertNode(fragment)

        // Position cursor after the inserted content
        if (lastNode) {
          const newRange = document.createRange()
          newRange.setStartAfter(lastNode)
          newRange.collapse(true)
          
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }

      // Update the message input state
      onMessageInput(input.innerText || '')
      
      input.focus()
      
      // Update active formats after the change
      setTimeout(() => checkActiveFormats(), 10)
    } catch (error) {
      console.error('Error formatting text:', error)
    }
  }

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    try {
      const input = messageInputRef.current
      if (!input) return

      const selection = window.getSelection()
      if (!selection) return

      // If there's no selection, place at the end
      if (selection.rangeCount === 0) {
        input.focus()
        const range = document.createRange()
        range.selectNodeContents(input)
        range.collapse(false)
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      const textNode = document.createTextNode(emoji)
      range.insertNode(textNode)
      
      // Move cursor after the emoji
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)

      // Update the message input state
      onMessageInput(input.innerText || '')
      input.focus()
    } catch (error) {
      console.error('Error inserting emoji:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    try {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSendMessage()
        // Clear the contentEditable div
        if (messageInputRef.current) {
          messageInputRef.current.innerHTML = ''
          messageInputRef.current.focus()
        }
      }
    } catch (error) {
      console.error('Error handling key press:', error)
    }
  }

  return (
    <div className="p-2 sm:p-4 border-t border-border bg-card">
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant={activeFormats.has('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatText('bold')}
            className={`h-8 w-8 p-0 ${activeFormats.has('bold') ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}
            title="Bold"
          >
            <TextB className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.has('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatText('italic')}
            className={`h-8 w-8 p-0 ${activeFormats.has('italic') ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}
            title="Italic"
          >
            <TextItalic className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.has('strikethrough') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatText('strikethrough')}
            className={`h-8 w-8 p-0 ${activeFormats.has('strikethrough') ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}
            title="Strikethrough"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.has('quote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatText('quote')}
            className={`h-8 w-8 p-0 ${activeFormats.has('quote') ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}
            title="Quote"
          >
            <Quotes className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.has('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => formatText('code')}
            className={`h-8 w-8 p-0 ${activeFormats.has('code') ? 'bg-accent text-accent-foreground' : 'hover:bg-secondary'}`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1"></div>
          <Popover 
            open={showInputEmojiPicker}
            onOpenChange={onEmojiPickerToggle}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Add Emoji"
              >
                <Smiley className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="top" align="start">
              <EmojiPicker onEmojiSelect={(emoji) => {
                insertEmoji(emoji)
                onEmojiPickerToggle(false)
              }} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex gap-2">
        <div 
          ref={messageInputRef}
          contentEditable
          className="flex-1 min-h-[40px] max-h-32 overflow-y-auto p-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_strong]:font-bold [&_em]:italic [&_del]:line-through [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:block"
          onInput={(e) => {
            try {
              const target = e.target as HTMLDivElement
              const plainText = getPlainTextFromHTML(target.innerHTML)
              onMessageInput(plainText)
              checkActiveFormats()
            } catch (error) {
              console.error('Error handling input:', error)
            }
          }}
          onSelectionChange={checkActiveFormats}
          onKeyDown={handleKeyPress}
          onMouseUp={checkActiveFormats}
          onKeyUp={checkActiveFormats}
          data-placeholder={`Message #${channels.find(c => c.id === currentChannel)?.name || currentChannel}`}
          suppressContentEditableWarning={true}
        />
        <Button 
          onClick={onSendMessage} 
          disabled={!messageInput.trim()}
          size="sm"
          className="flex-shrink-0"
        >
          <PaperPlaneRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}