import React from 'react';
import { Link2 } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#FAF9F6] px-4 py-12 relative overflow-hidden">
      {/* Abstract warm organic shapes in background */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#2E5A44]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C96E50]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="nordic-panel p-8 sm:p-10 border border-[#E6E5DF] bg-white relative">
          <div className="mb-8 text-center">
            <div className="inline-flex bg-[#2E5A44]/10 p-3.5 rounded-2xl text-[#2E5A44] mb-4">
              <Link2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1C1C1C] tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-[#60666D] text-sm font-medium">{subtitle}</p>
          </div>
          
          <div className="relative z-10">
            {children}
          </div>
        </div>
        
        <p className="text-center mt-6 text-xs text-[#60666D] font-medium">
          Secure, direct peer-to-peer file sharing. Powered by WebRTC.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
