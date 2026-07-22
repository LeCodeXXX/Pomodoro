import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Refs for tracking mutable gesture state without stale closures in native listeners
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const gestureRef = useRef<{
    isTouching: boolean;
    initialDist: number;
    initialScale: number;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    isPanning: boolean;
    isPinching: boolean;
  }>({
    isTouching: false,
    initialDist: 0,
    initialScale: 1,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    isPanning: false,
    isPinching: false,
  });

  const lastTapRef = useRef<number>(0);

  const resetZoom = useCallback(() => {
    setScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 4.0));
  const zoomOut = () => setScale(prev => {
    const next = Math.max(prev - 0.25, 0.75);
    if (next <= 1.01) setPanOffset({ x: 0, y: 0 });
    return next;
  });

  const next = () => {
    resetZoom();
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };
  const prev = () => {
    resetZoom();
    setPageNumber(prev => Math.max(prev - 1, 1));
  };
  const toggleFullscreen = () => setIsFullscreen(f => !f);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const isMobile = window.innerWidth < 768;
        const pad = isMobile ? 16 : 48;
        setContainerWidth(Math.max(260, containerRef.current.clientWidth - pad));
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

  // Native non-passive touch & wheel gesture listeners for smooth pinch zoom & pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStartNative = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsInteracting(true);
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        gestureRef.current = {
          isTouching: true,
          initialDist: dist,
          initialScale: scaleRef.current,
          startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          initialPanX: panOffsetRef.current.x,
          initialPanY: panOffsetRef.current.y,
          isPanning: false,
          isPinching: true,
        };
      } else if (e.touches.length === 1 && scaleRef.current > 1.01) {
        e.preventDefault();
        setIsInteracting(true);
        gestureRef.current = {
          isTouching: true,
          initialDist: 0,
          initialScale: scaleRef.current,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          initialPanX: panOffsetRef.current.x,
          initialPanY: panOffsetRef.current.y,
          isPanning: true,
          isPinching: false,
        };
      }
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (!g.isTouching) return;

      if (e.touches.length === 2 && g.isPinching && g.initialDist > 0) {
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / g.initialDist;
        const newScale = Math.max(0.75, Math.min(g.initialScale * factor, 4.0));
        setScale(newScale);
      } else if (e.touches.length === 1 && g.isPanning) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - g.startX;
        const deltaY = e.touches[0].clientY - g.startY;
        setPanOffset({
          x: g.initialPanX + deltaX,
          y: g.initialPanY + deltaY,
        });
      }
    };

    const handleTouchEndNative = (e: TouchEvent) => {
      if (e.touches.length < 2 && gestureRef.current.isPinching) {
        gestureRef.current.isPinching = false;
      }
      if (e.touches.length === 0) {
        gestureRef.current.isTouching = false;
        gestureRef.current.isPanning = false;
        setIsInteracting(false);

        if (scaleRef.current <= 1.01) {
          setPanOffset({ x: 0, y: 0 });
          setScale(1.0);
        }
      }
    };

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        setScale(prev => {
          const nextScale = Math.max(0.75, Math.min(prev * zoomFactor, 4.0));
          if (nextScale <= 1.01) {
            setPanOffset({ x: 0, y: 0 });
          }
          return nextScale;
        });
      }
    };

    container.addEventListener('touchstart', handleTouchStartNative, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });
    container.addEventListener('touchend', handleTouchEndNative, { passive: false });
    container.addEventListener('touchcancel', handleTouchEndNative, { passive: false });
    container.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStartNative);
      container.removeEventListener('touchmove', handleTouchMoveNative);
      container.removeEventListener('touchend', handleTouchEndNative);
      container.removeEventListener('touchcancel', handleTouchEndNative);
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // Desktop Mouse Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.01) return;
    setIsDragging(true);
    setIsInteracting(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: dragStartRef.current.initialPanX + deltaX,
      y: dragStartRef.current.initialPanY + deltaY,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setIsInteracting(false);
      dragStartRef.current = null;
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (scale > 1.05) {
        resetZoom();
      } else {
        setScale(2.0);
      }
    }
    lastTapRef.current = now;
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    resetZoom();
  }

  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const baseWidth = containerWidth > 0
    ? (isMobileScreen ? containerWidth : Math.min(containerWidth, 800))
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
      {/* Scroll / Viewport Container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: scale > 1.01 ? 'hidden' : 'auto',
          overflowX: scale > 1.01 ? 'hidden' : 'auto',
          backgroundColor: '#111',
          borderRadius: 'inherit',
          touchAction: scale > 1.01 ? 'none' : 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className="custom-scrollbar"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleDoubleTap}
      >
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1rem 0.5rem 6rem' }}>
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
            <div
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
                transformOrigin: 'center top',
                transition: isInteracting ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                cursor: scale > 1.01 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                willChange: 'transform',
              }}
              className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
            >
              <Page
                pageNumber={pageNumber}
                width={baseWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white max-w-full pointer-events-none"
              />
            </div>
          </Document>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2
        bg-[#1a1a1a]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-[95vw]"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Zoom Controls - Visible on both mobile & desktop */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-white/10 pr-1.5 sm:pr-2">
          <button onClick={zoomOut} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-medium text-gray-300 w-10 sm:w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {Math.abs(scale - 1.0) > 0.01 && (
            <button onClick={resetZoom} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-0.5" title="Reset Zoom">
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1 sm:gap-2 border-r border-white/10 px-1 sm:px-2">
          <button
            onClick={prev}
            disabled={pageNumber <= 1}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-300 w-12 sm:w-16 text-center">
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
