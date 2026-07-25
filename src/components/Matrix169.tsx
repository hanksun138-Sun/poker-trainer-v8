import React, { useState } from 'react';
import { get169HandNames, getComboCount, parseHandCategory } from '../data/pokerData';
import { StrategyFrequencies } from '../types/poker';

interface Matrix169Props {
  frequenciesMap: Record<string, StrategyFrequencies>;
  selectedHand?: string;
  onSelectHand?: (hand: string) => void;
  isEditable?: boolean;
  onUpdateHandFreq?: (hand: string, newFreqs: StrategyFrequencies) => void;
  title?: string;
  subtitle?: string;
}

export const Matrix169: React.FC<Matrix169Props> = ({
  frequenciesMap,
  selectedHand,
  onSelectHand,
  isEditable = false,
  onUpdateHandFreq,
  title = "169 手牌 GTO 矩阵",
  subtitle = "1326 组合加权渲染"
}) => {
  const matrix = get169HandNames();
  const [hoveredHand, setHoveredHand] = useState<string | null>(null);

  const activeHand = hoveredHand || selectedHand || 'AKs';
  const activeFreqs = frequenciesMap[activeHand] || { fold: 1.0 };
  const comboCount = getComboCount(activeHand);
  const category = parseHandCategory(activeHand);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
              13 × 13
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500"></span>
            <span className="text-slate-300">Raise / 3Bet / Bet</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
            <span className="text-slate-300">Call</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span>
            <span className="text-slate-300">Check</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-600"></span>
            <span className="text-slate-400">Fold</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-13 gap-1 aspect-square max-w-[620px] mx-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
        {matrix.map((row, rIdx) =>
          row.map((handName, cIdx) => {
            const freqs = frequenciesMap[handName] || { fold: 1.0 };
            
            // Calculate action percentages
            const raisePct = ((freqs.raise2_5 || 0) + (freqs.raise3 || 0) + (freqs.threeBet || 0) + (freqs.fourBet || 0) + (freqs.cbet25 || 0) + (freqs.cbet33 || 0) + (freqs.cbet75 || 0) + (freqs.overbet || 0)) * 100;
            const callPct = (freqs.call || 0) * 100;
            const checkPct = (freqs.check || 0) * 100;
            const foldPct = (freqs.fold || (1 - (raisePct + callPct + checkPct) / 100)) * 100;

            const isSelected = selectedHand === handName;
            const isHovered = hoveredHand === handName;

            return (
              <button
                key={handName}
                onClick={() => onSelectHand && onSelectHand(handName)}
                onMouseEnter={() => setHoveredHand(handName)}
                onMouseLeave={() => setHoveredHand(null)}
                className={`relative overflow-hidden rounded transition-all duration-150 flex flex-col items-center justify-center font-mono font-bold text-[10px] sm:text-xs select-none h-full w-full ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 z-10 scale-105 shadow-md shadow-emerald-950'
                    : isHovered
                    ? 'ring-1 ring-slate-400 z-10 scale-102'
                    : 'border border-slate-800/80 hover:border-slate-700'
                }`}
                style={{
                  background: `linear-gradient(to right, 
                    #ef4444 0%, #ef4444 ${raisePct}%, 
                    #10b981 ${raisePct}%, #10b981 ${raisePct + callPct}%, 
                    #3b82f6 ${raisePct + callPct}%, #3b82f6 ${raisePct + callPct + checkPct}%, 
                    #334155 ${raisePct + callPct + checkPct}%, #334155 100%)`
                }}
              >
                {/* Hand Text overlay */}
                <span className="relative z-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] tracking-tighter">
                  {handName}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Active Hand Inspector / Details Bar */}
      <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700/60 font-mono font-bold text-base text-emerald-400">
            {activeHand}
          </div>
          <div>
            <div className="flex items-center space-x-2 font-medium text-slate-200">
              <span>类型: {category === 'pair' ? '口袋对子 (Pair)' : category === 'suited' ? '同花 (Suited)' : '杂色 (Offsuit)'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 font-mono font-semibold">{comboCount} 个组合 (Combos)</span>
            </div>
            <p className="text-[11px] text-slate-400">占总体手牌频次权重的 {(comboCount / 13.26).toFixed(2)}%</p>
          </div>
        </div>

        {/* Frequencies breakdown */}
        <div className="flex items-center space-x-2 font-mono">
          {activeFreqs.raise2_5 !== undefined && (
            <span className="px-2 py-1 rounded bg-red-950/80 border border-red-800/60 text-red-300">
              Raise 2.5x: {(activeFreqs.raise2_5 * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.threeBet !== undefined && (
            <span className="px-2 py-1 rounded bg-red-950/80 border border-red-800/60 text-red-300">
              3Bet: {(activeFreqs.threeBet * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.cbet33 !== undefined && (
            <span className="px-2 py-1 rounded bg-red-950/80 border border-red-800/60 text-red-300">
              C-Bet 33%: {(activeFreqs.cbet33 * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.cbet75 !== undefined && (
            <span className="px-2 py-1 rounded bg-red-950/80 border border-red-800/60 text-red-300">
              C-Bet 75%: {(activeFreqs.cbet75 * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.call !== undefined && (
            <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
              Call: {(activeFreqs.call * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.check !== undefined && (
            <span className="px-2 py-1 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300">
              Check: {(activeFreqs.check * 100).toFixed(0)}%
            </span>
          )}
          {activeFreqs.fold !== undefined && (
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Fold: {(activeFreqs.fold * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
