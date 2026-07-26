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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2 sm:gap-4">
          
          {/* Logo & Version */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 text-sm sm:text-base flex items-center justify-center">
              GTO
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  GTO 训练舱
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-bold">
                  v8.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">RangeConverter & TexasSolver 引擎</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab('drill')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'drill'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Target className={`w-4 h-4 ${activeTab === 'drill' ? 'text-white' : 'text-emerald-600'}`} />
              <span>训练舱</span>
            </button>

            <button
              onClick={() => setActiveTab('preflop')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'preflop'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'preflop' ? 'text-white' : 'text-teal-600'}`} />
              <span>线A: 翻前矩阵</span>
            </button>

            <button
              onClick={() => setActiveTab('postflop')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'postflop'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitFork className={`w-4 h-4 ${activeTab === 'postflop' ? 'text-white' : 'text-indigo-600'}`} />
              <span>线B: 翻后策略树</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className={`w-4 h-4 ${activeTab === 'ai' ? 'text-white' : 'text-purple-600'}`} />
              <span>Gemini 审计教练</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'stats' ? 'text-white' : 'text-cyan-600'}`} />
              <span>档案 & 统计</span>
            </button>
          </nav>

          {/* User Profile Selector & Stats Badge */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/90 text-xs shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-slate-600 font-semibold hidden sm:inline">EV 损耗:</span>
              <span className={`font-mono font-bold ${currentUser.totalEvLossMBB <= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
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
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-bold cursor-pointer shadow-sm hover:border-slate-400"
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
      <div className="md:hidden flex border-t border-slate-200 bg-white px-2 py-1 justify-around text-xs">
        <button
          onClick={() => setActiveTab('drill')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'drill' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
        >
          <Target className="w-4 h-4" />
          <span>训练舱</span>
        </button>
        <button
          onClick={() => setActiveTab('preflop')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'preflop' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>翻前</span>
        </button>
        <button
          onClick={() => setActiveTab('postflop')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'postflop' ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}
        >
          <GitFork className="w-4 h-4" />
          <span>翻后</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'ai' ? 'text-purple-700 font-bold' : 'text-slate-500'}`}
        >
          <Bot className="w-4 h-4" />
          <span>AI教练</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center py-1 px-2 ${activeTab === 'stats' ? 'text-cyan-700 font-bold' : 'text-slate-500'}`}
        >
          <User className="w-4 h-4" />
          <span>档案</span>
        </button>
      </div>
    </header>
  );
};
