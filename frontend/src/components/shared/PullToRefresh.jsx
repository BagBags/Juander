import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Modern Pull-to-Refresh Component
 * Displays a smooth refresh animation when user pulls down
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef(null);
  const threshold = 80; // Distance to trigger refresh

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      // Only trigger if scrolled to top
      if (container.scrollTop === 0) {
        setTouchStart(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (touchStart === 0 || container.scrollTop > 0) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart;

      if (distance > 0) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault();
        // Apply resistance curve for smooth feel
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setTouchStart(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
        setTouchStart(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, pullDistance, isRefreshing, onRefresh, threshold]);

  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-y-auto">
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
          opacity: opacity,
          pointerEvents: 'none',
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <div
            className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            }}
          >
            <RefreshCw className="w-5 h-5 text-[#f04e37]" />
          </div>
          <span className="text-xs font-medium text-white">
            {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content with padding to prevent overlap */}
      <div
        style={{
          paddingTop: `${pullDistance}px`,
          transition: isRefreshing ? 'padding-top 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
