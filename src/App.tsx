import React, { useState, useEffect, Component, ReactNode } from 'react';
import { Navbar } from './components/Navbar';
import { GtoTrainingCabin } from './components/GtoTrainingCabin';
import { PreflopRangeConverter } from './components/PreflopRangeConverter';
import { PostflopTexasSolver } from './components/PostflopTexasSolver';
import { GeminiGtoCoach } from './components/GeminiGtoCoach';
import { UserProfileStats } from './components/UserProfileStats';
import { INITIAL_USER_PROFILES } from './data/pokerData';
import { UserProfile } from './types/poker';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-3xl font-black">
            ⚠️
          </div>
          <h2 className="text-xl font-bold">训练舱界面发生意外错误</h2>
          <p className="text-sm text-slate-300 max-w-md font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto">
            {this.state.error?.toString() || '未知渲染错误'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
          >
            重置并重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'drill' | 'preflop' | 'postflop' | 'ai' | 'stats'>('drill');
  
  // Load initial profiles from localStorage if available
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('gto_poker_profiles_v8');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load profiles from localStorage', e);
    }
    return INITIAL_USER_PROFILES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedId = localStorage.getItem('gto_active_user_id_v8');
      if (savedId) {
        const found = allUsers.find(u => u?.id === savedId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to load active user', e);
    }
    return allUsers[0] || INITIAL_USER_PROFILES[0];
  });

  // Persist allUsers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gto_poker_profiles_v8', JSON.stringify(allUsers));
    } catch (e) {
      console.error('Failed to save profiles', e);
    }
  }, [allUsers]);

  // Persist current active user ID
  useEffect(() => {
    try {
      if (currentUser?.id) {
        localStorage.setItem('gto_active_user_id_v8', currentUser.id);
      }
    } catch (e) {
      console.error('Failed to save active user id', e);
    }
  }, [currentUser]);

  // Update user stats after hand practice
  const handleRecordHandResult = (result: { isCorrect: boolean; evLossMBB: number; leakTag?: string }) => {
    setCurrentUser((prev) => {
      const safePrev = prev || INITIAL_USER_PROFILES[0];
      const newTotal = (safePrev.totalHands || 0) + 1;
      const newCorrect = result.isCorrect ? (safePrev.correctHands || 0) + 1 : (safePrev.correctHands || 0);
      const newEvLoss = (safePrev.totalEvLossMBB || 0) + result.evLossMBB;

      const safeLeakTags = Array.isArray(safePrev.leakTags) ? safePrev.leakTags : [];
      const newLeakTags = [...safeLeakTags];
      if (result.leakTag && !newLeakTags.includes(result.leakTag)) {
        newLeakTags.push(result.leakTag);
      }

      const updated: UserProfile = {
        ...safePrev,
        totalHands: newTotal,
        correctHands: newCorrect,
        totalEvLossMBB: newEvLoss,
        preflopAccuracy: Math.round((newCorrect / newTotal) * 1000) / 10,
        postflopAccuracy: Math.round((newCorrect / newTotal) * 980) / 10,
        leakTags: newLeakTags,
      };

      setAllUsers((users) => (Array.isArray(users) ? users : []).map((u) => (u?.id === safePrev.id ? updated : u)));
      return updated;
    });
  };

  // Create profile
  const handleCreateProfile = (name: string) => {
    const avatars = ['🎓', '🎯', '♠️', '🏆', '🚀', '⚡️', '💡', '👑', '🦁'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      avatar: randomAvatar,
      totalHands: 0,
      correctHands: 0,
      totalEvLossMBB: 0,
      preflopAccuracy: 100,
      postflopAccuracy: 100,
      favoritePos: 'BTN',
      leakTags: ['新创学员档案 - 待注入练习题'],
    };

    setAllUsers((prev) => [...prev, newProfile]);
    setCurrentUser(newProfile);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-200 selection:text-slate-900 flex flex-col justify-between">
        <div>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            allUsers={allUsers}
            onSelectUser={setCurrentUser}
          />

          <main className="w-full max-w-[1700px] mx-auto px-1 sm:px-3 md:px-6 py-2 sm:py-4">
            {activeTab === 'drill' && (
              <GtoTrainingCabin
                currentUser={currentUser}
                onRecordHandResult={handleRecordHandResult}
                onRequestAiAudit={() => setActiveTab('ai')}
              />
            )}

            {activeTab === 'preflop' && <PreflopRangeConverter />}

            {activeTab === 'postflop' && <PostflopTexasSolver />}

            {activeTab === 'ai' && <GeminiGtoCoach currentUser={currentUser} />}

            {activeTab === 'stats' && (
              <UserProfileStats
                currentUser={currentUser}
                allUsers={allUsers}
                onSelectUser={setCurrentUser}
                onCreateProfile={handleCreateProfile}
              />
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500 font-mono shadow-inner">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>GTO 扑克训练舱 v8.0 • 多学员敏捷特训版 (RangeConverter & TexasSolver)</span>
            <div className="flex items-center space-x-3 text-slate-600">
              <span>支持 iPad / iPhone 独立安装运行</span>
              <span>•</span>
              <span>Gemini 3.6 Flash AI 审计</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
