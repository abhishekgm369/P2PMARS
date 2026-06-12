import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';
import { LogOut, Link2 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#E6E5DF] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
            <div className="bg-[#2E5A44]/10 p-2 rounded-xl text-[#2E5A44] group-hover:bg-[#2E5A44]/15 transition duration-300">
              <Link2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1C1C1C] flex items-center">
              drop<span className="text-[#2E5A44] font-extrabold ml-0.5">space</span>
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/profile" className="text-sm font-semibold text-[#60666D] hover:text-[#1C1C1C] transition hidden sm:block">
                  {user.email}
                </Link>
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="!px-3 !py-2 text-xs hover:!bg-[#F4F3EE] text-[#60666D] font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-[#60666D] hover:text-[#1C1C1C] transition">
                  Login
                </Link>
                <Link to="/register">
                  <Button 
                    variant="primary" 
                    className="!px-4 !py-2 text-xs font-semibold bg-[#2E5A44] hover:bg-[#224433] text-white border-0 shadow-none rounded-xl"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
