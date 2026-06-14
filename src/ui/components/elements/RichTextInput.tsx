import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../../logic/utils/cn';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, 
  List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify 
} from 'lucide-react';

export interface RichTextInputProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export const RichTextInput = React.forwardRef<HTMLDivElement, RichTextInputProps>(({
  value,
  onChange,
  placeholder,
  className,
  error,
  id = "rich-text-input",
  ...props
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Set merged refs
  const handleRef = (el: HTMLDivElement) => {
    (editorRef as React.MutableRefObject<HTMLDivElement>).current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement>).current = el;
  };

  useEffect(() => {
    if (editorRef.current && value !== undefined && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const updateActiveStates = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      h1: document.queryCommandValue('formatBlock') === 'h1',
      h2: document.queryCommandValue('formatBlock') === 'h2',
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
    });
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    updateActiveStates();
    editorRef.current?.focus();
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const toggleBlock = (block: string) => {
    const currentBlock = document.queryCommandValue('formatBlock');
    if (currentBlock === block) {
      execCommand('formatBlock', 'div');
    } else {
      execCommand('formatBlock', block);
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    isActive, 
    onClick, 
    title,
    btnId
  }: { 
    icon: any, 
    isActive?: boolean, 
    onClick: () => void, 
    title?: string,
    btnId?: string
  }) => (
    <button
      id={btnId}
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "p-SpacingTiny rounded-RadiusSmall transition-all text-TextColorMuted hover:bg-ColorSidebarAccent hover:text-TextColorBase",
        isActive && "bg-ColorPrimary text-White shadow-ElevationLow"
      )}
    >
      <Icon size="1rem" />
    </button>
  );

  return (
    <div id={id} className={cn(
      "w-full flex flex-col rounded-RadiusSmall border border-ColorSidebarBorder/opacity-OpacitySubtle bg-ColorBg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-ColorPrimary/opacity-OpacitySubtle focus-within:border-ColorPrimary shadow-ElevationLow",
      error && "border-FeedbackColorError focus-within:ring-FeedbackColorError/opacity-OpacitySubtle focus-within:border-FeedbackColorError",
      className
    )} {...props}>
      {/* Toolbar */}
      <div id={`${id}-toolbar`} className="flex flex-wrap items-center gap-SpacingNano p-SpacingNano border-b border-ColorSidebarBorder/opacity-OpacitySubtle bg-ColorBgSecondary/opacity-OpacityMuted">
        <ToolbarButton btnId={`${id}-bold`} icon={Bold} isActive={activeFormats.bold} onClick={() => execCommand('bold')} title="Tebal" />
        <ToolbarButton btnId={`${id}-italic`} icon={Italic} isActive={activeFormats.italic} onClick={() => execCommand('italic')} title="Miring" />
        <ToolbarButton btnId={`${id}-underline`} icon={Underline} isActive={activeFormats.underline} onClick={() => execCommand('underline')} title="Garis Bawah" />
        <ToolbarButton btnId={`${id}-strikethrough`} icon={Strikethrough} isActive={activeFormats.strikethrough} onClick={() => execCommand('strikethrough')} title="Coret" />
        
        <div className="w-px h-4 bg-ColorSidebarBorder/opacity-OpacitySubtle mx-1"></div>
        
        <ToolbarButton btnId={`${id}-h1`} icon={Heading1} isActive={activeFormats.h1} onClick={() => toggleBlock('h1')} title="Heading 1" />
        <ToolbarButton btnId={`${id}-h2`} icon={Heading2} isActive={activeFormats.h2} onClick={() => toggleBlock('h2')} title="Heading 2" />
        
        <div className="w-px h-4 bg-ColorSidebarBorder/opacity-OpacitySubtle mx-1"></div>
        
        <ToolbarButton btnId={`${id}-list-unordered`} icon={List} isActive={activeFormats.insertUnorderedList} onClick={() => execCommand('insertUnorderedList')} title="Daftar Simbol" />
        <ToolbarButton btnId={`${id}-list-ordered`} icon={ListOrdered} isActive={activeFormats.insertOrderedList} onClick={() => execCommand('insertOrderedList')} title="Daftar Angka" />
        
        <div className="w-px h-4 bg-ColorSidebarBorder/opacity-OpacitySubtle mx-1"></div>
        
        <ToolbarButton btnId={`${id}-align-left`} icon={AlignLeft} isActive={activeFormats.justifyLeft} onClick={() => execCommand('justifyLeft')} title="Rata Kiri" />
        <ToolbarButton btnId={`${id}-align-center`} icon={AlignCenter} isActive={activeFormats.justifyCenter} onClick={() => execCommand('justifyCenter')} title="Rata Tengah" />
        <ToolbarButton btnId={`${id}-align-right`} icon={AlignRight} isActive={activeFormats.justifyRight} onClick={() => execCommand('justifyRight')} title="Rata Kanan" />
        <ToolbarButton btnId={`${id}-align-justify`} icon={AlignJustify} isActive={activeFormats.justifyFull} onClick={() => execCommand('justifyFull')} title="Rata Kiri Kanan" />
      </div>

      {/* Editor Area */}
      <div 
        id={`${id}-editor`}
        ref={handleRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        onFocus={updateActiveStates}
        className={cn(
          "min-h-32 max-h-96 overflow-y-auto p-SpacingSmall text-FontSizeSm text-TextColorBase outline-none custom-scrollbar",
          "[&_h1]:text-FontSizeH2 [&_h1]:font-black [&_h1]:mb-2",
          "[&_h2]:text-FontSizeH3 [&_h2]:font-black [&_h2]:mb-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:font-medium",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:font-medium",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-TextColorMuted empty:before:font-medium cursor-text"
        )}
        data-placeholder={placeholder || "Tulis sesuatu di sini..."}
      />
    </div>
  );
});
RichTextInput.displayName = "RichTextInput";
