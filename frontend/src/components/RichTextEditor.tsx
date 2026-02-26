import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  Minus,
  ImageIcon
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  isDark?: boolean;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title,
  isDark = false
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  isDark?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-2 rounded-lg transition-all duration-200 
      ${isActive 
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' 
        : isDark 
          ? 'text-gray-300 hover:bg-white/10 hover:text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
  </button>
);

const Divider = ({ isDark = false }: { isDark?: boolean }) => (
  <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/20' : 'bg-slate-200'}`} />
);

export default function RichTextEditor({ content, onChange, placeholder = 'Escreva o conteúdo da aula...', isDark = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 underline hover:text-amber-700',
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: isDark 
          ? 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-white' 
          : 'prose prose-slate max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border rounded-xl animate-pulse ${isDark ? 'border-white/20 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className={`h-12 rounded-t-xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
        <div className="h-[300px] p-4">
          <div className={`h-4 rounded w-3/4 mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
          <div className={`h-4 rounded w-1/2 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl shadow-sm overflow-hidden ${isDark ? 'border-white/20 bg-[#1a1a1a]' : 'border-slate-200 bg-white'}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-1 p-2 border-b ${isDark ? 'bg-white/5 border-white/10' : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'}`}>
        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer"
          isDark={isDark}
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer"
          isDark={isDark}
        >
          <Redo className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Text Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito"
          isDark={isDark}
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico"
          isDark={isDark}
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado"
          isDark={isDark}
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Rasurado"
          isDark={isDark}
        >
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Destacar"
          isDark={isDark}
        >
          <Highlighter className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título 1"
          isDark={isDark}
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título 2"
          isDark={isDark}
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Título 3"
          isDark={isDark}
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista com marcadores"
          isDark={isDark}
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
          isDark={isDark}
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Block Elements */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Citação"
          isDark={isDark}
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Bloco de código"
          isDark={isDark}
        >
          <Code className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
          isDark={isDark}
        >
          <Minus className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
          isDark={isDark}
        >
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
          isDark={isDark}
        >
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
          isDark={isDark}
        >
          <AlignRight className="w-4 h-4" />
        </MenuButton>

        <Divider isDark={isDark} />

        {/* Link */}
        <MenuButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Inserir link"
          isDark={isDark}
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>

        {/* Image */}
        <MenuButton
          onClick={() => {
            const url = window.prompt('URL da imagem:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Inserir imagem por URL"
          isDark={isDark}
        >
          <ImageIcon className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className={`px-4 py-2 border-t text-xs flex justify-end ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        {editor.storage.characterCount?.characters?.() || editor.getText().length} caracteres
      </div>
    </div>
  );
}
