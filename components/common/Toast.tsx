import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-exclamation-circle';

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg text-white shadow-lg ${bgColor} animate-fade-in-down`}>
      <i className={`${icon} mr-3 text-xl`}></i>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors">
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
