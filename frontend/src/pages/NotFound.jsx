import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="nordic-panel p-8 sm:p-10 border border-[#E6E5DF] flex flex-col items-center max-w-md w-full bg-white">
        <div className="w-16 h-16 bg-[#F4F3EE] text-[#C96E50] border border-[#E6E5DF] rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-[#1C1C1C] mb-2 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Page Not Found</h2>
        <p className="text-[#60666D] mb-8 leading-relaxed text-xs">
          The page you are looking for doesn't exist, has been moved, or is currently unavailable.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="w-full bg-[#2E5A44] hover:bg-[#224433] text-white border-0 rounded-xl">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
