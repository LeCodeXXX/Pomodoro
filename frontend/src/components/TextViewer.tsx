import React, { useState, useEffect } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface TextViewerProps {
  url: string;
  title: string;
}

export function TextViewer({ url, title }: TextViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchText = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch text file');
        const text = await response.text();
        if (isMounted) {
          setContent(text);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Could not load the text document.');
          setIsLoading(false);
        }
      }
    };

    fetchText();

    return () => {
      isMounted = false;
    };
  }, [url]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] rounded-xl border border-white/5">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm font-medium">Loading Text...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] rounded-xl border border-white/5">
        <p className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
      
      {/* Text Viewer Toolbar */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-2 bg-[#1a1a1a]/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-lg">
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy All'}
        </button>
        <div className="w-px h-4 bg-white/10"></div>
        <a 
          href={url} 
          download={title}
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-8 md:p-12 relative">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-3xl mx-auto"
        >
          <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm md:text-base selection:bg-indigo-500/30 selection:text-white">
            {content}
          </pre>
        </motion.div>
      </div>
    </div>
  );
}
