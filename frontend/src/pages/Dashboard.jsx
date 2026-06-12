import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Activity, Users, FileStack, Plus, ChevronLeft, ChevronRight, Compass, ArrowRight, Clock } from 'lucide-react';
import Button from '../components/Button.jsx';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [joinRoomId, setJoinRoomId] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/metrics?page=${page}&limit=5`);
        setMetrics(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [page]);

  const createRoom = async () => {
    try {
      const res = await api.post('/rooms/create');
      navigate(`/room/${res.data.room.roomId}`);
    } catch (err) {
      console.error("Failed to create room", err);
    }
  };

  const username = user?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Structural layout: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Action Center (1/3 width) */}
        <div className="space-y-6">
          <div className="nordic-panel p-8 border border-[#E6E5DF] bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#60666D]">Welcome back</span>
            <h1 className="text-2xl font-extrabold text-[#1C1C1C] tracking-tight mt-1 mb-4 capitalize">
              {username}
            </h1>
            <div className="h-px bg-[#E6E5DF] w-full my-4" />
            <p className="text-xs text-[#60666D] leading-relaxed mb-6">
              Create a secure peer-to-peer room to drop files directly, or join an active session using a Room ID.
            </p>

            <div className="space-y-4">
              {/* Join Room Widget */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#60666D] mb-1.5">Join Existing Room</label>
                <div className="flex border border-[#E6E5DF] rounded-xl overflow-hidden focus-within:border-[#2E5A44] focus-within:ring-2 focus-within:ring-[#2E5A44]/15 transition-all duration-200">
                  <input 
                    type="text" 
                    placeholder="Enter Room ID" 
                    className="px-4 py-2.5 bg-transparent border-0 outline-none text-xs w-full text-[#1C1C1C] placeholder-[#C8C7C0]"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && joinRoomId.trim()) {
                        navigate(`/room/${joinRoomId.trim()}`);
                      }
                    }}
                  />
                  <button 
                    onClick={() => joinRoomId.trim() && navigate(`/room/${joinRoomId.trim()}`)}
                    className="bg-[#F4F3EE] hover:bg-[#EAE8E0] px-4 text-xs font-bold text-[#1C1C1C] border-l border-[#E6E5DF] transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Initialize Room Widget */}
              <div className="pt-2">
                <Button 
                  onClick={createRoom} 
                  variant="primary"
                  className="w-full !py-3 flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  INITIALIZE NEW ROOM
                </Button>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Panel */}
          <div className="nordic-panel p-6 border border-[#E6E5DF] bg-[#F4F3EE]/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#60666D] flex items-center">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-[#2E5A44]" /> Connection status
            </span>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1C1C1C]">Signal Server</span>
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2E5A44]/10 text-[#2E5A44] border border-[#2E5A44]/25">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Activities (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Performance metrics grid */}
          {user?.role === 'admin' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                title="Global Users" 
                value={loading ? '...' : metrics?.totalUsers} 
                icon={<Users className="w-4 h-4 text-[#2E5A44]" />} 
              />
              <MetricCard 
                title="Rooms Created" 
                value={loading ? '...' : metrics?.totalRooms} 
                icon={<FileStack className="w-4 h-4 text-[#C96E50]" />} 
              />
              <MetricCard 
                title="Active Sessions" 
                value={loading ? '...' : metrics?.activeRooms} 
                icon={<Activity className="w-4 h-4 text-emerald-600" />} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                title="My Rooms" 
                value={loading ? '...' : metrics?.myTotalRooms} 
                icon={<FileStack className="w-4 h-4 text-[#2E5A44]" />} 
              />
              <MetricCard 
                title="Transfers Count" 
                value={loading ? '...' : metrics?.myTotalFiles} 
                icon={<Activity className="w-4 h-4 text-[#C96E50]" />} 
              />
              <MetricCard 
                title="Active Rooms" 
                value={loading ? '...' : metrics?.myActiveRooms} 
                icon={<Users className="w-4 h-4 text-emerald-600" />} 
              />
            </div>
          )}

          {/* Activity Feed / List */}
          <div className="nordic-panel border border-[#E6E5DF] bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E6E5DF] flex justify-between items-center bg-[#F4F3EE]/20">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#60666D]" />
                <h2 className="text-sm font-bold text-[#1C1C1C]">Activity Log</h2>
              </div>
              
              <div className="flex items-center space-x-1.5 bg-[#FAF9F6] border border-[#E6E5DF] rounded-lg p-1">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)} 
                  className="p-1 rounded text-[#60666D] hover:text-[#1C1C1C] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-[#60666D] px-1.5 select-none">PAGE {page}</span>
                <button 
                  onClick={() => setPage(p => p + 1)} 
                  className="p-1 rounded text-[#60666D] hover:text-[#1C1C1C] hover:bg-[#F4F3EE] transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#E6E5DF] bg-[#FAF9F6]/50 text-[10px] uppercase font-bold text-[#60666D] tracking-wider">
                    <th className="px-6 py-4">File Item</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Completed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E5DF] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[#60666D] font-medium">Loading history logs...</td>
                    </tr>
                  ) : metrics?.recentHistory?.length > 0 ? (
                    metrics.recentHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF9F6]/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-bold text-[#1C1C1C]">{item.filename}</td>
                        <td className="px-6 py-4 text-[#60666D]">{(item.size / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                            item.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#60666D]">{new Date(item.date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[#60666D] font-medium">No files transferred in this account yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }) => (
  <div className="nordic-panel p-5 border border-[#E6E5DF] bg-white flex items-center space-x-4">
    <div className="p-2.5 bg-[#F4F3EE] rounded-xl text-[#1C1C1C] border border-[#E6E5DF]">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-[#60666D] uppercase tracking-wider">{title}</p>
      <h3 className="text-xl font-extrabold text-[#1C1C1C] mt-0.5">{value}</h3>
    </div>
  </div>
);

export default Dashboard;
