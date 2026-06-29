import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Move } from 'lucide-react';

const ThreeSixtyTour = ({ isOpen, onClose, imageUrl }) => {
  const [bgPositionX, setBgPositionX] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Slowly rotate panorama when user is not dragging
    const interval = setInterval(() => {
      if (!isDragging.current) {
        setBgPositionX((prev) => (prev - 0.05) % 100);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    startX.current = e.clientX;
    setBgPositionX((prev) => (prev - deltaX * 0.1) % 100);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    startX.current = e.touches[0].clientX;
    setBgPositionX((prev) => (prev - deltaX * 0.1) % 100);
  };

  if (!isOpen) return null;

  const defaultPanorama = imageUrl || 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=2400&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-5xl rounded-[2.5rem] overflow-hidden bg-neutral-950 border border-neutral-850 shadow-2xl flex flex-col h-[520px] animate-scale-in">
        
        {/* Title Tag */}
        <div className="absolute top-5 left-5 z-10 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2.5 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
          <RotateCw className="h-3.5 w-3.5 animate-spin-slow text-brand" />
          <span>Interactive 360° Virtual Room Tour</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 rounded-full bg-black/60 p-3 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition backdrop-blur-md"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Action Hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-md pointer-events-none">
          <Move className="h-3.5 w-3.5 animate-pulse text-brand" />
          <span>Click & Swipe to Look Around</span>
        </div>

        {/* Cylindrical Panorama Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{
            backgroundImage: `url(${defaultPanorama})`,
            backgroundPositionX: `${bgPositionX}%`,
            backgroundPositionY: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'repeat-x',
            cursor: isDragging.current ? 'grabbing' : 'grab',
          }}
          className="flex-grow w-full h-full select-none transition-all duration-75"
        />
      </div>
    </div>
  );
};

export default ThreeSixtyTour;
