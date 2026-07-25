import React, { useState } from 'react';
import { UserProfile } from '../types/poker';
import { User, Award, AlertTriangle, CheckCircle, TrendingUp, Plus, ShieldCheck } from 'lucide-react';

interface UserProfileStatsProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onCreateProfile: (name: string) => void;
}

export const UserProfileStats: React.FC<UserProfileStatsProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onCreateProfile,
}) => {
  const [newUserName, setNewUserName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🎓');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  const avatars = ['🎓', '🎯', '♠️', '🏆', '🚀', '⚡️', '💡', '👑', '🦁', '🔥'];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    onCreateProfile(newUserName.trim());
    setNewUserName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-950">
            {currentUser.avatar}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100">{currentUser.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-800">
                当前活跃学员
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">常用位置: {currentUser.favoritePos} | 累计练习 {currentUser.totalHands} 手牌</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowIosGuide(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs font-bold border border-indigo-700/60 transition-all cursor-pointer"
          >
            📱 <span>iPad/iPhone 安装指南</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>创建新学员档案</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">翻前策略准确率</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">{currentUser.preflopAccuracy}%</div>
          <p className="text-[11px] text-slate-500">RangeConverter 吻合度</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">翻后策略准确率</span>
          <div className="text-2xl font-mono font-bold text-purple-400">{currentUser.postflopAccuracy}%</div>
          <p className="text-[11px] text-slate-500">TexasSolver 解集吻合度</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">累计 EV 损耗</span>
          <div className="text-2xl font-mono font-bold text-amber-400">{currentUser.totalEvLossMBB} mBB</div>
          <p className="text-[11px] text-slate-500">平均每手牌 {(currentUser.totalEvLossMBB / (currentUser.totalHands || 1)).toFixed(1)} mBB</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">完美决策率</span>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {((currentUser.correctHands / (currentUser.totalHands || 1)) * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500">{currentUser.correctHands} / {currentUser.totalHands} 手</p>
        </div>
      </div>

      {/* Leaks & Weaknesses Tag Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>学员策略漏洞诊断 (Identified Leaks - {currentUser.name})</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {currentUser.leakTags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 font-mono text-xs font-medium flex items-center gap-1.5"
            >
              <span>⚠️</span>
              <span>{tag}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Switch Profile Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100">分配/切换学员档案 (Multi-Student Profiles)</h3>
            <p className="text-xs text-slate-400">不同学员独立记录训练手数、决策准确率及漏水诊断，数据实时存储于本地。</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-full">
            共 {allUsers.length} 位学员
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                currentUser.id === user.id
                  ? 'bg-emerald-950/60 border-emerald-600 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{user.avatar}</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">{user.name}</h4>
                  <p className="text-xs text-slate-400">准确率: 翻前 {user.preflopAccuracy}% | 翻后 {user.postflopAccuracy}% | 手数 {user.totalHands}</p>
                </div>
              </div>

              {currentUser.id === user.id && (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating New Profile */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">创建新扑克学员档案</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1.5">选择学员头像:</label>
                <div className="flex flex-wrap gap-2">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-emerald-600 border-emerald-400 ring-2 ring-emerald-400/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1.5">学员姓名 / 昵称:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="例如: 学员A_张三, Coach_Hank..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  立即创建学员
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iPad / iPhone Installation Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📱</span>
                <h3 className="text-base font-black">iPhone / iPad 安装到主屏幕指南</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-start space-x-3">
                <span className="font-mono font-black text-indigo-400 text-sm">1</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">在 Safari 浏览器中打开此网址</strong>
                  <p>在 iPad 或 iPhone 上使用系统自带的 <span className="text-indigo-300 font-bold">Safari 浏览器</span> 访问当前链接。</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-start space-x-3">
                <span className="font-mono font-black text-indigo-400 text-sm">2</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">点击 Safari 底部或顶部的“分享”图标</strong>
                  <p>寻找 Safari 工具栏上的分享按钮 <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">⎋ (一个带向上箭头的方框)</span>。</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-start space-x-3">
                <span className="font-mono font-black text-indigo-400 text-sm">3</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">选择“添加到主屏幕” (Add to Home Screen)</strong>
                  <p>在弹出的菜单列表中向下滚动，点击 <span className="text-emerald-400 font-bold">“添加到主屏幕”</span> 选项，命名为 <span className="text-amber-300 font-mono">GTO训练舱v8</span>。</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-start space-x-3">
                <span className="font-mono font-black text-indigo-400 text-sm">4</span>
                <div>
                  <strong className="text-slate-100 block mb-0.5">随时全屏无缝练习</strong>
                  <p>回到主屏幕直接点击图标即可像 Native App 一样极速无缝全屏体验，学员进度自动在本设备永久保存！</p>
                </div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowIosGuide(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg"
              >
                我明白了
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
