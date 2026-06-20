import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react';


// Configure the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
  title: string;
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const next = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const prev = () => setPageNumber(prev => Math.max(prev - 1, 1));

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={`flex flex-col bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl border border-white/5 relative ${isFullscreen ? 'fixed inset-4 z-50' : 'w-full flex-1 min-h-0'}`}>

      {/* Custom Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#1a1a1a]/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          <button onClick={zoomOut} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-300 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-2 pl-2">
          <button
            onClick={prev}
            disabled={pageNumber <= 1}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-300 w-16 text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button
            onClick={next}
            disabled={pageNumber >= numPages}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Other Controls */}
        <div className="flex items-center gap-1 pl-2">
          <button onClick={toggleFullscreen} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a href={url} download={title} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto custom-scrollbar relative flex justify-center bg-[#111] min-h-0">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center py-8"
          loading={
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-sm font-medium">Loading Document...</p>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm">Failed to load PDF.</p>
            </div>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={`page_${pageNumber}_${scale}`}
            className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="bg-white"
            />
          </motion.div>
        </Document>
      </div>
    </div>
  );
}
