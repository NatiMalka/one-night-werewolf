import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with the CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  if (!isVisible && !isOpen) {
    return null;
  }
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-5xl'
  };
  
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
                 bg-black bg-opacity-50 p-2 transition-opacity duration-300
                 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      <div
        className={`bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden w-full
                   ${sizeClasses[size]} transform transition-transform duration-300
                   ${isOpen ? 'scale-100' : 'scale-95'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
          <h3 id="modal-title" className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
};

export default Modal;