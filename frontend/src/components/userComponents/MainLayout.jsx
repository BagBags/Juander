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
    <div className={`relative flex-1 flex flex-col min-h-0 ${className}`}>
      {includeSideButtons && <SideButtons />}
      <div className={`${includeSideButtons ? "pr-20 sm:pr-24 xl:pr-20" : ""} flex-1 min-h-0 w-full flex flex-col`}>
        {children}
      </div>
    </div>
  );
}
