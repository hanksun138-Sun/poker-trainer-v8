import React from 'react';
import { UserProfile, Position } from '../types/poker';
import { Target, BarChart3, GitFork, Bot, User, Flame, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'drill' | 'preflop' | 'postflop' | 'ai' | 'stats';
  setActiveTab: (tab: 'drill' | 'preflop' | 'postflop' | 'ai' | 'stats') => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSelectUser,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2 sm:gap-4">
          
          {/* Logo & Version */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50 text-sm sm:text-base">
              GTO
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400">
                  GTO 训练舱
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-mono font-bold">
                  v8.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">RangeConverter & TexasSolver 引擎</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab('drill')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'drill'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>训练舱</span>
            </button>

            <button
              onClick={() => setActiveTab('preflop')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'preflop'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>线A: 翻前矩阵</span>
            </button>

            <button
              onClick={() => setActiveTab('postflop')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'postflop'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-4 h-4 text-purple-400" />
              <span>线B: 翻后策略树</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Gemini 审计教练</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>档案 & 统计</span>
            </button>
          </nav>

          {/* User Profile Selector & Stats Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-medium hidden sm:inline">EV 损耗:</span>
              <span className={`font-mono font-bold ${currentUser.totalEvLossMBB <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentUser.totalEvLossMBB} mBB
              </span>
            </div>

            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = allUsers.find(u => u.id === e.target.value);
                  if (target) onSelectUser(target);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.avatar} {user.name} ({user.preflopAccuracy}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-950 px-2 py-1 justify-around text-xs">
        <button
          onClick={() => setActiveTab('drill')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'drill' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <Target className="w-4 h-4" />
          <span>训练舱</span>
        </button>
        <button
          onClick={() => setActiveTab('preflop')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'preflop' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>翻前</span>
        </button>
        <button
          onClick={() => setActiveTab('postflop')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'postflop' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <GitFork className="w-4 h-4" />
          <span>翻后</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'ai' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          <Bot className="w-4 h-4" />
          <span>AI教练</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'stats' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <User className="w-4 h-4" />
          <span>档案</span>
        </button>
      </div>
    </header>
  );
};
