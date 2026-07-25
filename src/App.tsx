import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GtoTrainingCabin } from './components/GtoTrainingCabin';
import { PreflopRangeConverter } from './components/PreflopRangeConverter';
import { PostflopTexasSolver } from './components/PostflopTexasSolver';
import { GeminiGtoCoach } from './components/GeminiGtoCoach';
import { UserProfileStats } from './components/UserProfileStats';
import { INITIAL_USER_PROFILES } from './data/pokerData';
import { UserProfile } from './types/poker';

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
        const found = allUsers.find(u => u.id === savedId);
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
      localStorage.setItem('gto_active_user_id_v8', currentUser.id);
    } catch (e) {
      console.error('Failed to save active user id', e);
    }
  }, [currentUser]);

  // Update user stats after hand practice
  const handleRecordHandResult = (result: { isCorrect: boolean; evLossMBB: number; leakTag?: string }) => {
    setCurrentUser((prev) => {
      const newTotal = prev.totalHands + 1;
      const newCorrect = result.isCorrect ? prev.correctHands + 1 : prev.correctHands;
      const newEvLoss = prev.totalEvLossMBB + result.evLossMBB;

      const newLeakTags = [...prev.leakTags];
      if (result.leakTag && !newLeakTags.includes(result.leakTag)) {
        newLeakTags.push(result.leakTag);
      }

      const updated: UserProfile = {
        ...prev,
        totalHands: newTotal,
        correctHands: newCorrect,
        totalEvLossMBB: newEvLoss,
        preflopAccuracy: Math.round((newCorrect / newTotal) * 1000) / 10,
        postflopAccuracy: Math.round((newCorrect / newTotal) * 980) / 10,
        leakTags: newLeakTags,
      };

      setAllUsers((users) => users.map((u) => (u.id === prev.id ? updated : u)));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          allUsers={allUsers}
          onSelectUser={setCurrentUser}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GTO 扑克训练舱 v8.0 • 多学员敏捷特训版 (RangeConverter & TexasSolver)</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>支持 iPad / iPhone 独立安装运行</span>
            <span>•</span>
            <span>Gemini 3.6 Flash AI 审计</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
