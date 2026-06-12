import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative glass-panel rounded-2xl shadow-2xl w-full max-w-md transform transition-all p-6 animate-in zoom-in-95 duration-200 border border-white/5">
        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
          <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-450 hover:text-white transition p-1 hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
