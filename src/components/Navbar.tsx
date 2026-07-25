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
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Version */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50">
              GTO
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400">
                  GTO 训练舱
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-mono font-semibold">
                  v8.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">RangeConverter & TexasSolver 引擎</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('drill')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'drill'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>训练舱</span>
            </button>

            <button
              onClick={() => setActiveTab('preflop')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'preflop'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>线A: 翻前矩阵</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">RangeConverter</span>
            </button>

            <button
              onClick={() => setActiveTab('postflop')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'postflop'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>线B: 翻后策略树</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">TexasSolver</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Gemini 审计教练</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>档案 & 统计</span>
            </button>
          </nav>

          {/* User Profile Selector & Stats Badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-300">EV 损耗:</span>
              <span className={`text-xs font-mono font-bold ${currentUser.totalEvLossMBB <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
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
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.avatar} {user.name} ({user.preflopAccuracy}% 准确率)
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
