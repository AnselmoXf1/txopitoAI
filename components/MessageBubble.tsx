import React, { useState } from 'react';
import { Message, Role } from '../types';
import Icon from './Icon';
import FallbackIndicator from './FallbackIndicator';

interface MessageBubbleProps {
  message: Message;
  color: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, color }) => {
  const isUser = message.role === Role.USER;
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Detecta se é uma mensagem de fallback
  const isFallbackMessage = !isUser && (
    message.text.includes('temporariamente indisponível') ||
    message.text.includes('Oops! Minha conexão') ||
    message.text.includes('dificuldades técnicas') ||
    message.text.includes('modo offline') ||
    message.text.includes('Login com Google') ||
    message.text.includes('Login com GitHub')
  );
  
  const isImageGenerationError = !isUser && message.text.includes('Geração de imagem temporariamente indisponível');

  const handleSpeak = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'pt-BR';
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  // Enhanced formatter with better code highlighting and rich text formatting
  const formatText = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/```(\w+)?\n?([\s\S]*?)```/);
    
    return parts.map((part, index) => {
      // Every 3rd part starting from index 2 is code content
      if ((index - 2) % 3 === 0) {
        const language = parts[index - 1] || 'text';
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {/* Code header */}
            <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-medium flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {language && (
                  <span className="text-slate-400 bg-slate-700 px-2 py-1 rounded text-xs font-mono">
                    {language.toUpperCase()}
                  </span>
                )}
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(part.trim())}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-700"
                title="Copiar código"
              >
                <Icon name="FileText" size={14} />
              </button>
            </div>
            {/* Code content */}
            <pre className="bg-slate-900 text-slate-50 p-4 text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto leading-relaxed">
              <code 
                dangerouslySetInnerHTML={{ 
                  __html: highlightCode(part.trim(), language) 
                }}
              />
            </pre>
          </div>
        );
      } 
      // Skip language identifiers
      else if ((index - 1) % 3 === 0) {
        return null;
      }
      // Regular text content with rich formatting
      else {
        return (
          <div key={index} className="prose prose-slate max-w-none">
            {formatInlineText(part)}
          </div>
        );
      }
    }).filter(Boolean);
  };

  // Format inline text with advanced markdown-like syntax and visual hierarchy
  const formatInlineText = (text: string) => {
    // Split text into lines for better processing
    const lines = text.split('\n');
    const processedLines: JSX.Element[] = [];
    
    let currentListItems: JSX.Element[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    let listCounter = 1;
    
    const flushList = () => {
      if (currentListItems.length > 0) {
        if (listType === 'ordered') {
          processedLines.push(
            <ol key={`list-${processedLines.length}`} className="list-decimal list-inside space-y-1 my-2 pl-4 border-l-2 border-blue-100">
              {currentListItems}
            </ol>
          );
        } else {
          processedLines.push(
            <ul key={`list-${processedLines.length}`} className="list-disc list-inside space-y-1 my-2 pl-4 border-l-2 border-gray-100">
              {currentListItems}
            </ul>
          );
        }
        currentListItems = [];
        listType = null;
        listCounter = 1;
      }
    };
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines but add minimal spacing
      if (!trimmedLine) {
        flushList();
        processedLines.push(<div key={`space-${lineIndex}`} className="h-1" />);
        return;
      }
      
      // Headers (## ### ####)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        const headerSizes = {
          1: 'text-2xl font-bold text-slate-900 mt-4 mb-2 pb-1 border-b-2 border-blue-200',
          2: 'text-xl font-bold text-slate-800 mt-3 mb-2 pb-1 border-b border-gray-200',
          3: 'text-lg font-semibold text-slate-700 mt-3 mb-1',
          4: 'text-base font-semibold text-slate-600 mt-2 mb-1',
          5: 'text-sm font-semibold text-slate-600 mt-2 mb-1',
          6: 'text-sm font-medium text-slate-500 mt-1 mb-1'
        };
        
        processedLines.push(
          <div key={`header-${lineIndex}`} className={headerSizes[level as keyof typeof headerSizes] || headerSizes[3]}>
            {processInlineFormatting(headerText)}
          </div>
        );
        return;
      }
      
      // Ordered lists (1. 2. 3.)
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        if (listType !== 'ordered') {
          flushList();
          listType = 'ordered';
        }
        const itemText = orderedMatch[2];
        currentListItems.push(
          <li key={`ordered-${lineIndex}`} className="text-slate-700 leading-relaxed hover:bg-blue-50 p-1 rounded transition-colors">
            <span className="font-medium text-blue-600 mr-2">{listCounter}.</span>
            {processInlineFormatting(itemText)}
          </li>
        );
        listCounter++;
        return;
      }
      
      // Unordered lists (- • *)
      const unorderedMatch = trimmedLine.match(/^[-•*]\s+(.+)$/);
      if (unorderedMatch) {
        if (listType !== 'unordered') {
          flushList();
          listType = 'unordered';
        }
        const itemText = unorderedMatch[1];
        currentListItems.push(
          <li key={`unordered-${lineIndex}`} className="text-slate-700 leading-relaxed hover:bg-gray-50 p-1 rounded transition-colors">
            <span className="text-blue-500 mr-2 font-bold">•</span>
            {processInlineFormatting(itemText)}
          </li>
        );
        return;
      }
      
      // Quote blocks (> text)
      const quoteMatch = trimmedLine.match(/^>\s+(.+)$/);
      if (quoteMatch) {
        flushList();
        const quoteText = quoteMatch[1];
        processedLines.push(
          <blockquote key={`quote-${lineIndex}`} className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-2 italic text-slate-600">
            {processInlineFormatting(quoteText)}
          </blockquote>
        );
        return;
      }
      
      // Alert boxes (⚠️ 💡 ✅ ❌)
      const alertMatch = trimmedLine.match(/^(⚠️|💡|✅|❌|🔥|📝|🎯|🚀)\s+(.+)$/);
      if (alertMatch) {
        flushList();
        const emoji = alertMatch[1];
        const alertText = alertMatch[2];
        const alertStyles = {
          '⚠️': 'bg-yellow-50 border-yellow-200 text-yellow-800',
          '💡': 'bg-blue-50 border-blue-200 text-blue-800',
          '✅': 'bg-green-50 border-green-200 text-green-800',
          '❌': 'bg-red-50 border-red-200 text-red-800',
          '🔥': 'bg-orange-50 border-orange-200 text-orange-800',
          '📝': 'bg-purple-50 border-purple-200 text-purple-800',
          '🎯': 'bg-indigo-50 border-indigo-200 text-indigo-800',
          '🚀': 'bg-cyan-50 border-cyan-200 text-cyan-800'
        };
        
        processedLines.push(
          <div key={`alert-${lineIndex}`} className={`border-l-4 p-3 my-2 rounded-r-lg ${alertStyles[emoji as keyof typeof alertStyles] || alertStyles['💡']}`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{emoji}</span>
              <div className="font-medium">
                {processInlineFormatting(alertText)}
              </div>
            </div>
          </div>
        );
        return;
      }
      
      // Regular paragraphs
      flushList();
      if (trimmedLine) {
        processedLines.push(
          <p key={`para-${lineIndex}`} className="text-slate-700 leading-relaxed mb-2 text-justify">
            {processInlineFormatting(trimmedLine)}
          </p>
        );
      }
    });
    
    // Flush any remaining list
    flushList();
    
    return processedLines;
  };
  
  // Process inline formatting (bold, italic, code, links)
  const processInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~|\[.*?\]\(.*?\))/);
    
    return parts.map((part, index) => {
      // Bold text **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Italic text *text* (but not **text**)
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return (
          <em key={index} className="italic text-slate-600 font-medium">
            {part.slice(1, -1)}
          </em>
        );
      }
      
      // Strikethrough ~~text~~
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return (
          <del key={index} className="line-through text-slate-500">
            {part.slice(2, -2)}
          </del>
        );
      }
      
      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-slate-800 text-green-300 px-2 py-1 rounded text-sm font-mono border border-slate-600 shadow-sm">
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Links [text](url)
      const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
      if (linkMatch) {
        return (
          <a 
            key={index} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium hover:bg-blue-50 px-1 rounded transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
      
      return part;
    });
  };

  // Enhanced syntax highlighting for different languages
  const highlightCode = (code: string, language: string) => {
    const lang = language.toLowerCase();
    
    // Define color patterns for different token types
    const patterns = {
      // JavaScript/TypeScript
      javascript: [
        { regex: /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|finally)\b/g, className: 'text-purple-300' },
        { regex: /\b(true|false|null|undefined)\b/g, className: 'text-orange-300' },
        { regex: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/g, className: 'text-green-300' },
        { regex: /\b\d+(\.\d+)?\b/g, className: 'text-blue-300' },
        { regex: /\/\/.*$/gm, className: 'text-gray-400 italic' },
        { regex: /\/\*[\s\S]*?\*\//g, className: 'text-gray-400 italic' },
        { regex: /\b(console|document|window|Array|Object|String|Number|Boolean|Date|Math|JSON)\b/g, className: 'text-cyan-300' },
      ],
      
      // Python
      python: [
        { regex: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield)\b/g, className: 'text-purple-300' },
        { regex: /\b(True|False|None)\b/g, className: 'text-orange-300' },
        { regex: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''/g, className: 'text-green-300' },
        { regex: /\b\d+(\.\d+)?\b/g, className: 'text-blue-300' },
        { regex: /#.*$/gm, className: 'text-gray-400 italic' },
        { regex: /\b(print|len|range|str|int|float|list|dict|tuple|set)\b/g, className: 'text-cyan-300' },
      ],
      
      // Java
      java: [
        { regex: /\b(public|private|protected|static|final|class|interface|extends|implements|if|else|for|while|return|import|package|try|catch|finally|new|this|super)\b/g, className: 'text-purple-300' },
        { regex: /\b(true|false|null)\b/g, className: 'text-orange-300' },
        { regex: /"([^"\\]|\\.)*"/g, className: 'text-green-300' },
        { regex: /\b\d+(\.\d+)?[fFdDlL]?\b/g, className: 'text-blue-300' },
        { regex: /\/\/.*$/gm, className: 'text-gray-400 italic' },
        { regex: /\/\*[\s\S]*?\*\//g, className: 'text-gray-400 italic' },
        { regex: /\b(System|String|Integer|Double|Boolean|ArrayList|HashMap)\b/g, className: 'text-cyan-300' },
      ],
      
      // HTML
      html: [
        { regex: /&lt;\/?\w+[^&gt;]*&gt;/g, className: 'text-red-300' },
        { regex: /\w+(?==)/g, className: 'text-yellow-300' },
        { regex: /"([^"\\]|\\.)*"/g, className: 'text-green-300' },
        { regex: /&lt;!--[\s\S]*?--&gt;/g, className: 'text-gray-400 italic' },
      ],
      
      // CSS
      css: [
        { regex: /[.#]?[\w-]+(?=\s*{)/g, className: 'text-yellow-300' },
        { regex: /[\w-]+(?=\s*:)/g, className: 'text-blue-300' },
        { regex: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, className: 'text-green-300' },
        { regex: /\b\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)?\b/g, className: 'text-orange-300' },
        { regex: /\/\*[\s\S]*?\*\//g, className: 'text-gray-400 italic' },
      ],
      
      // SQL
      sql: [
        { regex: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|DATABASE|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|HAVING|LIMIT|DISTINCT|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL)\b/gi, className: 'text-purple-300' },
        { regex: /'([^'\\]|\\.)*'/g, className: 'text-green-300' },
        { regex: /\b\d+(\.\d+)?\b/g, className: 'text-blue-300' },
        { regex: /--.*$/gm, className: 'text-gray-400 italic' },
      ],
      
      // JSON
      json: [
        { regex: /"([^"\\]|\\.)*"(?=\s*:)/g, className: 'text-blue-300' },
        { regex: /"([^"\\]|\\.)*"(?!\s*:)/g, className: 'text-green-300' },
        { regex: /\b(true|false|null)\b/g, className: 'text-orange-300' },
        { regex: /\b\d+(\.\d+)?\b/g, className: 'text-cyan-300' },
      ],
      
      // Bash/Shell
      bash: [
        { regex: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|export|source|alias|cd|ls|mkdir|rm|cp|mv|grep|sed|awk|cat|echo|printf)\b/g, className: 'text-purple-300' },
        { regex: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, className: 'text-green-300' },
        { regex: /#.*$/gm, className: 'text-gray-400 italic' },
        { regex: /\$\w+|\$\{[^}]+\}/g, className: 'text-yellow-300' },
        { regex: /\b\d+\b/g, className: 'text-blue-300' },
      ],
    };
    
    // Get patterns for the specific language, fallback to javascript
    const langPatterns = patterns[lang as keyof typeof patterns] || patterns.javascript;
    
    // Apply syntax highlighting
    let highlightedCode = code;
    
    // Create a map to store original matches and their replacements
    const replacements: { original: string; replacement: string; }[] = [];
    
    langPatterns.forEach((pattern, index) => {
      const matches = [...highlightedCode.matchAll(pattern.regex)];
      matches.forEach((match) => {
        const original = match[0];
        const replacement = `<span class="${pattern.className}">${original}</span>`;
        replacements.push({ original, replacement });
      });
    });
    
    // Sort replacements by length (longest first) to avoid partial replacements
    replacements.sort((a, b) => b.original.length - a.original.length);
    
    // Apply replacements
    replacements.forEach(({ original, replacement }) => {
      // Only replace if not already wrapped in span
      if (!highlightedCode.includes(`<span class=`) || !highlightedCode.includes(original)) {
        highlightedCode = highlightedCode.replace(new RegExp(escapeRegExp(original), 'g'), replacement);
      }
    });
    
    return highlightedCode;
  };
  
  // Helper function to escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-gray-200' : `bg-white border border-gray-200 text-blue-600`}
        `}>
          <Icon name={isUser ? 'User' : 'Bot'} size={18} className={isUser ? 'text-gray-500' : color} />
        </div>

        {/* Content */}
        <div className={`
          flex flex-col
          ${isUser ? 'items-end' : 'items-start'}
          w-full min-w-0
        `}>
          <div className={`
            py-3 px-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed break-words w-full overflow-hidden
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-none text-left' 
              : 'bg-white border border-gray-100 text-slate-800 rounded-tl-none'}
          `}>
            {/* Attached Image (User) */}
            {message.attachment && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                <img 
                  src={`data:${message.attachment.mimeType};base64,${message.attachment.content}`} 
                  alt="Anexo" 
                  className="max-w-full h-auto max-h-64 object-cover"
                />
              </div>
            )}

            {/* Generated Image (AI) */}
            {message.generatedImage && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 shadow-md">
                <img 
                  src={`data:image/png;base64,${message.generatedImage}`} 
                  alt="Imagem Gerada" 
                  className="w-full h-auto"
                />
                <div className="bg-gray-50 p-2 text-[10px] text-gray-500 text-center uppercase font-bold tracking-wider">
                  Gerado por IA
                </div>
              </div>
            )}

            {formatText(message.text)}
            
            {/* Indicador de fallback */}
            {isFallbackMessage && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <FallbackIndicator 
                  type={isImageGenerationError ? 'image-generation' : 'ai-offline'} 
                  className="text-xs"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-[10px] text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {/* TTS Button for Bot messages */}
            {!isUser && message.text && (
              <button 
                onClick={handleSpeak}
                className={`p-1 rounded-full transition-colors ${isPlaying ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500'}`}
                title="Ler em voz alta"
              >
                <Icon name={isPlaying ? "Square" : "Volume2"} size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;