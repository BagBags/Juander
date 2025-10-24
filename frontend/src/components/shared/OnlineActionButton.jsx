import React, { useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import OnlineRequiredModal from './OnlineRequiredModal';

/**
 * Wrapper component for buttons that require internet connection
 * Automatically shows modal if offline when clicked
 */
const OnlineActionButton = ({ 
  children, 
  onClick, 
  offlineMessage = 'This action requires an internet connection',
  showLoginOption = true,
  className = '',
  disabled = false,
  ...props 
}) => {
  const { isOnline } = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async (e) => {
    if (!isOnline) {
      e.preventDefault();
      setShowModal(true);
      return;
    }

    // Execute the original onClick if online
    if (onClick) {
      try {
        await onClick(e);
      } catch (error) {
        console.error('Action failed:', error);
        // Could show error toast here
      }
    }
  };

  return (
    <>
      <button
        {...props}
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </button>

      <OnlineRequiredModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={offlineMessage}
        showLoginOption={showLoginOption}
      />
    </>
  );
};

export default OnlineActionButton;
