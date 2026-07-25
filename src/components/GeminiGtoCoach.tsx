import React, { useState } from 'react';
import { UserProfile, GtoAuditResponse } from '../types/poker';
import { Bot, Send, Sparkles, HelpCircle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

interface GeminiGtoCoachProps {
  currentUser: UserProfile;
}

export const GeminiGtoCoach: React.FC<GeminiGtoCoachProps> = ({ currentUser }) => {
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditResponse, setAuditResponse] = useState<GtoAuditResponse | null>(null);

  const prefilledQueries = [
    "解析为什么 A5s 在 A高干燥面 (A♠ 7♦ 2♣) 需要 100% 频率 C-Bet？",
    "BB 位面对 BTN 2.5x 开放加注时，如何划分 3-Tier 梯度防守 (3Bet / Call / Fold)？",
    "探讨 TexasSolver 在成对面 (A♠ A♦ 8♣) 的 25% 超小额 C-Bet 策略原理",
    "分析我的个人训练统计：翻后准确率较低，如何针对性提高？",
  ];

  const handleAskGemini = async (queryToUse?: string) => {
    const promptText = queryToUse || customQuestion;
    if (!promptText.trim()) return;

    setIsLoading(true);
    try {
      const payload = {
        handDetails: {
          heroPosition: 'BTN',
          villainPosition: 'BB',
          heroHand: 'A5s',
          board: 'A♠ 7♦ 2♣',
          street: 'FLOP',
          potSize: 5.5,
          userAction: 'CBET_33',
          gtoOptimalActions: [
            { action: 'C-Bet 33%', frequency: 0.85, ev: 3.20 },
            { action: 'Check', frequency: 0.15, ev: 3.00 },
          ],
        },
        customQuestion: promptText,
        userStatsSummary: {
          preflopAccuracy: currentUser.preflopAccuracy,
          leakTags: currentUser.leakTags,
        },
      };

      const res = await fetch('/api/gto-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResponse(data.audit);
      } else {
        throw new Error(data.error || 'Gemini API Error');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gemini AI 咨询失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* AI Hub Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Gemini 3.6 Flash GTO 策略审计教练</span>
              <span className="text-xs font-normal text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-full">
                AI Audit Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">解答 RangeConverter 翻前解集与 TexasSolver 翻后博弈树背后的数学逻辑</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Server Proxy: @google/genai</span>
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400">推荐 GTO 理论探讨问题:</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {prefilledQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomQuestion(query);
                handleAskGemini(query);
              }}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-600/60 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>{query}</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex items-center gap-3">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="向 Gemini AI 提问 GTO 理论问题 (例如: 翻牌圈成对面为什么小额下注胜率极高？)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAskGemini()}
        />
        <button
          onClick={() => handleAskGemini()}
          disabled={isLoading || !customQuestion.trim()}
          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isLoading ? '思考中...' : '发送'}</span>
        </button>
      </div>

      {/* Gemini Response Display */}
      {auditResponse && (
        <div className="bg-slate-900 border border-purple-800/80 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 border-b border-purple-900/50 pb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Gemini GTO 深度审计报告</h3>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-3">
            <p className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-line">
              {auditResponse.analysis}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-amber-400 block mb-1">范围优势:</strong>
                <span>{auditResponse.keyConcepts.rangeAdvantage}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-cyan-400 block mb-1">阻挡牌效应:</strong>
                <span>{auditResponse.keyConcepts.blockerEffect}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400 block mb-1">EV 对比:</strong>
                <span>{auditResponse.keyConcepts.evComparison}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/80 text-purple-200 font-medium">
              推荐专项强化训练: {auditResponse.recommendedDrill}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
