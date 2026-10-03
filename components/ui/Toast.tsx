'use client';
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bg = {
    success: 'bg-teal text-white',
    error: 'bg-coral-deep text-white',
    info: 'bg-ink text-white',
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-bounce">
      <div
        className={`px-4 py-3 rounded-xl shadow-lift text-sm font-medium flex items-center gap-2 ${bg[type]}`}
      >
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 font-bold opacity-80 hover:opacity-100">
          &times;
        </button>
      </div>
    </div>
  );
}
