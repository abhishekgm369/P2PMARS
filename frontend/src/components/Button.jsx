import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ children, loading, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "flex items-center justify-center px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-[#2E5A44] hover:bg-[#224433] text-white focus:ring-[#2E5A44] hover:translate-y-[-1px] active:translate-y-[1px] shadow-sm",
    secondary: "bg-[#F4F3EE] hover:bg-[#EAE8E0] text-[#1C1C1C] border border-[#E6E5DF] focus:ring-gray-300",
    terracotta: "bg-[#C96E50] hover:bg-[#B35F43] text-white focus:ring-[#C96E50] hover:translate-y-[-1px] active:translate-y-[1px]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    outline: "border border-[#E6E5DF] hover:border-[#C8C7C0] text-[#1C1C1C] hover:bg-[#F4F3EE] focus:ring-gray-300"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
