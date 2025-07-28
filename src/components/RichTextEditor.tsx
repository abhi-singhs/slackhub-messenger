import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TextB, TextItalic, Minus, Quotes, Code, Smiley } from '@phosphor-icons/react'
import { EmojiPicker } from './EmojiPicker'
import { useEffect } from 'react'

// Convert TipTap HTML output to markdown-like syntax for storage
const convertHtmlToMarkdown = (html: string): string => {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Convert HTML tags to markdown syntax
  let markdown = html
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*')
  markdown = markdown.replace(/<s>(.*?)<\/s>/g, '~~$1~~')
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`')
  markdown = markdown.replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/g, '> $1')
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n')
  markdown = markdown.replace(/<br\s*\/?>/g, '\n')
  
  // Clean up any remaining HTML tags and extra newlines
  const cleanDiv = document.createElement('div')
  cleanDiv.innerHTML = markdown
  return (cleanDiv.textContent || cleanDiv.innerText || '').trim()
}

interface RichTextEditorProps {
  content: string
  placeholder: string
  showEmojiPicker: boolean
  onUpdate: (content: string) => void
  onEmojiPickerToggle: (show: boolean) => void
  onSubmit: () => void
}

export const RichTextEditor = ({
  content,
  placeholder,
  showEmojiPicker,
  onUpdate,
  onEmojiPickerToggle,
  onSubmit
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features we don't need
        heading: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
        bulletList: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Convert TipTap content to markdown-like syntax for storage
      const html = editor.getHTML()
      const text = convertHtmlToMarkdown(html)
      onUpdate(text)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[40px] max-h-32 overflow-y-auto p-3 text-sm',
      },
    },
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onSubmit()
        editor.commands.clearContent()
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('keydown', handleKeyDown)

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, onSubmit])

  // Clear content when content prop changes to empty
  useEffect(() => {
    if (editor && content === '') {
      editor.commands.clearContent()
    }
  }, [editor, content])

  if (!editor) {
    return null
  }

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run()
    onEmojiPickerToggle(false)
  }

  return (
    <div className="border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between gap-1 p-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${
              editor.isActive('bold') 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-secondary'
            }`}
            title="Bold"
          >
            <TextB className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${
              editor.isActive('italic') 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-secondary'
            }`}
            title="Italic"
          >
            <TextItalic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 w-8 p-0 ${
              editor.isActive('strike') 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-secondary'
            }`}
            title="Strikethrough"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 p-0 ${
              editor.isActive('blockquote') 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-secondary'
            }`}
            title="Quote"
          >
            <Quotes className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-8 w-8 p-0 ${
              editor.isActive('code') 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-secondary'
            }`}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1"></div>
          <Popover 
            open={showEmojiPicker}
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
              <EmojiPicker onEmojiSelect={insertEmoji} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}