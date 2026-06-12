import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Shield, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/dashboard" className="text-[#60666D] hover:text-[#2E5A44] flex items-center transition text-sm font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="nordic-panel rounded-3xl overflow-hidden bg-white border border-[#E6E5DF]">
        {/* Banner with Nordic Forest Green Accent */}
        <div className="bg-[#2E5A44] h-32 relative">
          <div className="absolute -bottom-12 left-8 border-4 border-white bg-white p-1 rounded-full shadow-md">
            <div className="bg-[#F4F3EE] text-[#2E5A44] p-5 rounded-full border border-[#E6E5DF]">
              <User className="w-10 h-10" />
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-8">
          <h1 className="text-2xl font-extrabold text-[#1C1C1C] tracking-tight mb-1">
            User Profile
          </h1>
          <p className="text-[#60666D] text-sm mb-8">Manage your account details and security settings.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex items-start space-x-4 p-4.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E5DF] hover:border-[#C8C7C0] transition duration-200">
              <div className="p-2.5 bg-[#2E5A44]/10 text-[#2E5A44] border border-[#2E5A44]/25 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#60666D] uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-bold text-[#1C1C1C] mt-1">{user?.email || 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E5DF] hover:border-[#C8C7C0] transition duration-200">
              <div className="p-2.5 bg-[#C96E50]/10 text-[#C96E50] border border-[#C96E50]/25 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#60666D] uppercase tracking-wider">Account Role</p>
                <p className="text-sm font-bold text-[#1C1C1C] mt-1 capitalize">{user?.role || 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4.5 rounded-2xl bg-[#FAF9F6] border border-[#E6E5DF] hover:border-[#C8C7C0] transition duration-200 md:col-span-2">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#60666D] uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-bold text-[#1C1C1C] mt-1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
