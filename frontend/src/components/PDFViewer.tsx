import { useState, useRef, useEffect } from 'react';
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

  // Container width state for responsive page sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Touch gesture states for pinch-to-zoom & dragging/panning on mobile
  const [touchScale, setTouchScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{
    dist: number;
    scale: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const isMobile = window.innerWidth < 768;
        const pad = isMobile ? 12 : 32;
        setContainerWidth(Math.max(280, containerRef.current.clientWidth - pad));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    resetZoom();
  }

  const resetZoom = () => {
    setTouchScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const next = () => {
    resetZoom();
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };
  const prev = () => {
    resetZoom();
    setPageNumber(prev => Math.max(prev - 1, 1));
  };
  const toggleFullscreen = () => setIsFullscreen(f => !f);

  // Touch handlers for pinch zoom and drag panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        scale: touchScale,
        startX: 0,
        startY: 0,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    } else if (e.touches.length === 1 && touchScale > 1.05) {
      touchStartRef.current = {
        dist: 0,
        scale: touchScale,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartRef.current.dist;
      const newScale = Math.max(1, Math.min(touchStartRef.current.scale * factor, 3.5));
      setTouchScale(newScale);
    } else if (e.touches.length === 1 && touchScale > 1.05 && touchStartRef.current.startX !== 0) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.startX;
      const deltaY = e.touches[0].clientY - touchStartRef.current.startY;
      setPanOffset({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchStartRef.current = null;
      if (touchScale <= 1.05) {
        resetZoom();
      }
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (touchScale > 1.1) {
        resetZoom();
      } else {
        setTouchScale(2.0);
      }
    }
    lastTapRef.current = now;
  };

  // Determine target page width
  // Mobile (<768px): fit container width
  // Desktop (>=768px): fit container width or 800px scaled by desktop zoom setting
  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const targetWidth = containerWidth > 0
    ? (isMobileScreen ? containerWidth : Math.min(containerWidth, 800) * scale)
    : undefined;

  return (
    <div
      style={{ position: isFullscreen ? 'fixed' : 'relative', inset: isFullscreen ? 0 : undefined }}
      className={`bg-[#0a0a0a] ${
        isFullscreen
          ? 'z-9999 rounded-none border-0'
          : 'w-full h-full rounded-none md:rounded-xl border-0 md:border md:border-white/5 shadow-none md:shadow-2xl'
      }`}
    >
      {/* Scroll Container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          overflowX: touchScale > 1 ? 'hidden' : 'auto',
          backgroundColor: '#111',
          borderRadius: 'inherit',
          touchAction: touchScale > 1 ? 'none' : 'pan-y',
        }}
        className="custom-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0.25rem 6rem' }}>
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
              key={`page_${pageNumber}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{
                transform: `scale(${touchScale}) translate(${panOffset.x / touchScale}px, ${panOffset.y / touchScale}px)`,
                transformOrigin: 'center top',
                transition: touchStartRef.current ? 'none' : 'transform 0.15s ease-out',
              }}
              className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                width={targetWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white max-w-full"
              />
            </motion.div>
          </Document>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2
        bg-[#1a1a1a]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-[95vw]"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Desktop Zoom Controls - Hidden on mobile screens */}
        <div className="hidden sm:flex items-center gap-0.5 sm:gap-1 border-r border-white/10 pr-1.5 sm:pr-2">
          <button onClick={zoomOut} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-medium text-gray-300 w-9 sm:w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1 sm:gap-2 sm:border-r border-white/10 px-1 sm:px-2">
          <button
            onClick={prev}
            disabled={pageNumber <= 1}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-300 w-14 sm:w-16 text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button
            onClick={next}
            disabled={pageNumber >= numPages}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Other Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 pl-1 sm:pl-2">
          <button onClick={toggleFullscreen} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a href={url} download={title} target="_blank" rel="noreferrer" className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
