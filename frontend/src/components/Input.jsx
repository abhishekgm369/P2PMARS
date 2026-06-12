import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col mb-4">
      {label && <label className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#60666D]">{label}</label>}
      <input
        ref={ref}
        className={`px-4 py-2.5 bg-[#FAF9F6] border border-[#E6E5DF] rounded-xl text-[#1C1C1C] placeholder-[#C8C7C0] focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/25 focus:border-[#2E5A44] transition-all duration-200 hover:border-[#C8C7C0] ${
          error ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 text-xs text-rose-600 font-medium">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
