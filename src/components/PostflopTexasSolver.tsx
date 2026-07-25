import React, { useState } from 'react';
import { FlopBoardConfig, FlopTextureId, Card } from '../types/poker';
import { FLOP_BOARDS, TEXAS_SOLVER_A_DRY_BTNVsBB, SUIT_COLORS, SUIT_SYMBOLS, parseHandCategory } from '../data/pokerData';
import { GitFork, Layers, HelpCircle, Flame, PieChart, Sparkles } from 'lucide-react';

export const PostflopTexasSolver: React.FC = () => {
  const [selectedBoardId, setSelectedBoardId] = useState<FlopTextureId>('A_HIGH_DRY');
  const [selectedPosNode, setSelectedPosNode] = useState<'IP' | 'OOP'>('IP');
  const [activeHandDetail, setActiveHandDetail] = useState<string>('A5s');

  const currentBoard = FLOP_BOARDS.find(b => b.id === selectedBoardId) || FLOP_BOARDS[0];
  const solverData = TEXAS_SOLVER_A_DRY_BTNVsBB; // A_HIGH_DRY dataset

  const activeHandStrategy = solverData.handStrategies[activeHandDetail] || {
    cbet33: 0.70,
    cbet75: 0.15,
    check: 0.15,
    ev: 3.20,
    equity: 76.8,
  };

  return (
    <div className="space-y-6">
      
      {/* Line B Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>线 B：TexasSolver 翻后策略树 & 特定牌面解析</span>
              <span className="text-xs font-normal text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-full">
                Postflop Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">重点探讨与集成 A高干燥面 (A♠ 7♦ 2♣) 等 5 大典型 Flop 解集树</p>
          </div>
        </div>
      </div>

      {/* Flop Texture Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {FLOP_BOARDS.map((board) => (
          <button
            key={board.id}
            onClick={() => setSelectedBoardId(board.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedBoardId === board.id
                ? 'bg-purple-950/60 border-purple-600 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-200">{board.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                board.rangeAdvantage === 'IP' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              }`}>
                {board.rangeAdvantage} 优势
              </span>
            </div>

            {/* Board Cards Display */}
            <div className="flex items-center space-x-1.5 mb-2">
              {board.cards.map((c, i) => (
                <div
                  key={i}
                  className={`w-7 h-10 rounded bg-slate-950 border border-slate-700 flex flex-col items-center justify-center text-xs font-mono font-bold ${
                    SUIT_COLORS[c.suit]
                  }`}
                >
                  <span>{c.rank}</span>
                  <span className="text-[10px]">{SUIT_SYMBOLS[c.suit]}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2">{board.description}</p>
          </button>
        ))}
      </div>

      {/* TexasSolver Board Analysis Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Strategy Node Overview */}
        <div className="space-y-4">
          
          {/* Node Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>节点策略分布 (Node Strategy)</span>
              </h3>

              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedPosNode('IP')}
                  className={`px-2 py-0.5 rounded ${selectedPosNode === 'IP' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  IP (BTN)
                </button>
                <button
                  onClick={() => setSelectedPosNode('OOP')}
                  className={`px-2 py-0.5 rounded ${selectedPosNode === 'OOP' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  OOP (BB)
                </button>
              </div>
            </div>

            {/* Strategy Stacked Frequency Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>总体 C-Bet 频率:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(currentBoard.ipCbetFreq * 100).toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                <div style={{ width: `${currentBoard.ipCbetFreq * 75}%` }} className="bg-red-500 h-full" title="33% Pot C-Bet" />
                <div style={{ width: `${currentBoard.ipCbetFreq * 25}%` }} className="bg-amber-500 h-full" title="75% Pot C-Bet" />
                <div style={{ width: `${(1 - currentBoard.ipCbetFreq) * 100}%` }} className="bg-blue-500 h-full" title="Check" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 33% 小注</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 75% 大注</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Check 过牌</span>
              </div>
            </div>

            {/* Deep Insight on Dry A-High Board */}
            {selectedBoardId === 'A_HIGH_DRY' && (
              <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/60 text-xs space-y-2">
                <div className="flex items-center space-x-1 text-purple-300 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>A高干燥面 (A♠ 7♦ 2♣) 理论剖析</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  在该牌面下，BTN拥有极高比例的 Ax 顶对强牌（AK, AQ, AJ, AT, A5s），而 BB 翻前防守范围缺少顶级 Ax。
                  因此，BTN拥有近 <strong className="text-emerald-400">80% 的范围 C-Bet 频率</strong>。
                </p>
              </div>
            )}
          </div>

          {/* Interactive Hand Specific Solver Explorer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">选择具体组合查看解集:</h4>
            
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {Object.keys(solverData.handStrategies).map((hand) => (
                <button
                  key={hand}
                  onClick={() => setActiveHandDetail(hand)}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    activeHandDetail === hand
                      ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-400'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {hand}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right 2 Columns: Detailed Hand Solver EV & Strategy Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>TexasSolver 单手牌策略解集 - </span>
                  <span className="font-mono text-emerald-400 text-base">{activeHandDetail}</span>
                </h3>
                <p className="text-xs text-slate-400">在 A♠ 7♦ 2♣ 牌面下的 EV 与 决策树分布</p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">Equity (胜率): </span>
                  <span className="text-cyan-400 font-bold">{activeHandStrategy.equity}%</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">EV: </span>
                  <span className="text-emerald-400 font-bold">+{activeHandStrategy.ev} BB</span>
                </div>
              </div>
            </div>

            {/* Frequencies Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-red-900/60 text-xs space-y-1">
                <span className="text-red-400 font-bold block">C-Bet 33% Pot</span>
                <span className="font-mono text-xl font-bold text-slate-100">
                  {((activeHandStrategy.cbet33 || 0) * 100).toFixed(0)}%
                </span>
                <p className="text-[11px] text-slate-400">利用范围优势进行小额压迫</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/60 text-xs space-y-1">
                <span className="text-amber-400 font-bold block">C-Bet 75% Pot</span>
                <span className="font-mono text-xl font-bold text-slate-100">
                  {((activeHandStrategy.cbet75 || 0) * 100).toFixed(0)}%
                </span>
                <p className="text-[11px] text-slate-400">坚果极化获取更大价值</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-blue-900/60 text-xs space-y-1">
                <span className="text-blue-400 font-bold block">Check 过牌</span>
                <span className="font-mono text-xl font-bold text-slate-100">
                  {((activeHandStrategy.check || 0) * 100).toFixed(0)}%
                </span>
                <p className="text-[11px] text-slate-400">控制底池与保护过牌范围</p>
              </div>
            </div>

            {/* Special Strategic Focus on A5s/A4s */}
            {(activeHandDetail === 'A5s' || activeHandDetail === 'A4s') && (
              <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-700/80 text-xs space-y-2">
                <h4 className="font-bold text-purple-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-400" />
                  <span>为什么 A5s / A4s 在 A高干燥面 持续下注频率高达 100%？</span>
                </h4>
                <div className="text-slate-300 leading-relaxed space-y-1">
                  <p>1. <strong>强阻挡效应 (Blocker):</strong> 拥有 ♠A 阻挡了对手大量强 Ax，且阻挡对手用 55/44 保护的下限。</p>
                  <p>2. <strong>后门顺子权益 (Backdoor Equity):</strong> 包含 5, 4 后门 Wheel (A-2-3-4-5) 后门顺子听牌，转牌/河牌具备高爆性发牌发展空间。</p>
                  <p>3. <strong>弃牌权益 (Fold Equity):</strong> 能够逼迫对手将 88-JJ 等对子在转牌被迫弃牌。</p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
