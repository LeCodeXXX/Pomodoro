import { useState } from 'react';
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
  const toggleFullscreen = () => setIsFullscreen(f => !f);

  return (
    /*
     * Outer shell — grows to fill the flex parent in StudyMaterialPage.
     * position:relative is required so the absolutely-positioned scroll
     * area can measure itself against this element.
     */
    <div
      style={{ position: isFullscreen ? 'fixed' : 'relative', inset: isFullscreen ? 0 : undefined }}
      className={`bg-[#0a0a0a] ${
        isFullscreen
          ? 'z-9999 rounded-none border-0'
          : 'w-full h-full rounded-none md:rounded-xl border-0 md:border md:border-white/5 shadow-none md:shadow-2xl'
      }`}
    >
      {/*
       * Scroll container — absolutely fills the outer shell so it is
       * completely decoupled from any flex/grid ancestor and always
       * has a real pixel height to scroll against.
       */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          overflowX: 'auto',
          backgroundColor: '#111',
          borderRadius: 'inherit',
        }}
        className="custom-scrollbar"
      >
        {/* Extra bottom padding so the floating toolbar never covers content */}
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.5rem 6rem' }}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">Loading Document...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center py-20">
                <p className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-xs sm:text-sm">Failed to load PDF.</p>
              </div>
            }
          >
            <motion.div
              key={`page_${pageNumber}_${scale}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white max-w-full"
              />
            </motion.div>
          </Document>
        </div>
      </div>

      {/* Floating Control Bar — sits above the scroll area */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2
        bg-[#1a1a1a]/95 backdrop-blur-md px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-[95vw] overflow-x-auto custom-scrollbar"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-white/10 pr-1.5 sm:pr-2">
          <button onClick={zoomOut} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-medium text-gray-300 w-9 sm:w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1 sm:gap-2 border-r border-white/10 px-1 sm:px-2">
          <button
            onClick={prev}
            disabled={pageNumber <= 1}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-medium text-gray-300 w-12 sm:w-16 text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button
            onClick={next}
            disabled={pageNumber >= numPages}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Other Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 pl-1 sm:pl-2">
          <button onClick={toggleFullscreen} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <a href={url} download={title} target="_blank" rel="noreferrer" className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Download">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
