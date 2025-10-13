import React from "react";
import SideButtons from "./sideButtons";

/**
 * MainLayout - A wrapper component that automatically handles spacing for side buttons
 * 
 * Usage:
 * <MainLayout>
 *   <YourPageContent />
 * </MainLayout>
 * 
 * Props:
 * - children: The main content of your page
 * - includeSideButtons: Whether to render side buttons (default: true)
 * - className: Additional classes for the main container
 */
export default function MainLayout({ 
  children, 
  includeSideButtons = true,
  className = "" 
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Side buttons - fixed position, automatically handled */}
      {includeSideButtons && <SideButtons />}
      
      {/* Main content with automatic right padding to avoid side buttons 
          Only apply padding when side buttons are present
          Responsive padding based on button sizes:
          - Mobile: pr-20 (80px) for buttons + labels
          - SM: pr-24 (96px) for larger buttons
          - MD+: pr-20 (80px) fewer buttons shown on desktop
      */}
      <div className={includeSideButtons ? "pr-20 sm:pr-24 md:pr-20" : ""}>
        {children}
      </div>
    </div>
  );
}
