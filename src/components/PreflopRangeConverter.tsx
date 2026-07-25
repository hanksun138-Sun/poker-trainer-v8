import React, { useState } from 'react';
import { Position, StrategyFrequencies, RangeConverterProfile } from '../types/poker';
import { DEFAULT_RANGE_CONVERTER_PROFILE, RANGE_CONVERTER_PDF_CHARTS, PdfChartConfig } from '../data/pokerData';
import { Matrix169 } from './Matrix169';
import { FileCode, Download, Upload, Shield, Sliders, CheckCircle, Info, BookOpen } from 'lucide-react';

export const PreflopRangeConverter: React.FC = () => {
  const [profile, setProfile] = useState<RangeConverterProfile>(DEFAULT_RANGE_CONVERTER_PROFILE);
  const [selectedPos, setSelectedPos] = useState<Position>('BTN');
  const [selectedHand, setSelectedHand] = useState<string>('AKs');
  const [activeViewMode, setActiveViewMode] = useState<'MATRIX' | 'DIGITIZER' | 'GRADIENT_DEFENSE'>('MATRIX');
  const [selectedPdfChartId, setSelectedPdfChartId] = useState<string>('RFI_BTN');

  const activeChartConfig = RANGE_CONVERTER_PDF_CHARTS.find(c => c.id === selectedPdfChartId) || RANGE_CONVERTER_PDF_CHARTS[0];

  // Raw Digitizer text input
  const [digitizerInput, setDigitizerInput] = useState<string>(
    `# RangeConverter 100bb 500z 数字化解集示例\nAA:100\nKK:100\nQQ:100\nJJ:100\nAKs:100\nAQs:100\nA5s:75/25\nAKo:100\n76s:80/20`
  );
  const [digitizerStatus, setDigitizerStatus] = useState<string>('');

  const activePosMatrix = profile.matrixData[selectedPos] || {};

  // Handle parsing digitized RangeConverter string
  const handleParseDigitizer = () => {
    try {
      const lines = digitizerInput.split('\n');
      const updatedPosMatrix: Record<string, StrategyFrequencies> = { ...activePosMatrix };
      let parsedCount = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const [hand, freqStr] = trimmed.split(':');
        if (hand && freqStr) {
          const cleanHand = hand.trim();
          if (freqStr.includes('/')) {
            const parts = freqStr.split('/').map(p => parseFloat(p));
            if (parts.length >= 2) {
              updatedPosMatrix[cleanHand] = {
                raise2_5: parts[0] / 100,
                fold: parts[1] / 100,
              };
              parsedCount++;
            }
          } else {
            const val = parseFloat(freqStr) / 100;
            updatedPosMatrix[cleanHand] = {
              raise2_5: val,
              fold: 1 - val,
            };
            parsedCount++;
          }
        }
      }

      setProfile(prev => ({
        ...prev,
        matrixData: {
          ...prev.matrixData,
          [selectedPos]: updatedPosMatrix,
        },
      }));

      setDigitizerStatus(`成功解析并覆盖位置 ${selectedPos} 的 ${parsedCount} 个手牌解集频率！`);
    } catch (err: any) {
      setDigitizerStatus(`解析失败: ${err.message}`);
    }
  };

  // Export profile JSON
  const handleExportProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `RangeConverter_${selectedPos}_v8.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Line A Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>线 A：RangeConverter 翻前解集数字化</span>
              <span className="text-xs font-normal text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded-full">
                Solver Baseline
              </span>
            </h2>
            <p className="text-xs text-slate-400">数字化真实的 RangeConverter PDF/Chart 数据，替换传统静态 Baseline</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveViewMode('MATRIX')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewMode === 'MATRIX'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            169 解集矩阵
          </button>
          <button
            onClick={() => setActiveViewMode('DIGITIZER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewMode === 'DIGITIZER'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            PDF数据数字化 (Digitizer)
          </button>
          <button
            onClick={() => setActiveViewMode('GRADIENT_DEFENSE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewMode === 'GRADIENT_DEFENSE'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            BB 三级梯度防守
          </button>
        </div>
      </div>

      {/* PDF Scenarios Selector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200">
              RangeConverter 官方 PDF 图表选单 (6-max 100bb 500z)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
            PDF 参考页码: Page {activeChartConfig.pdfPage} / 13
          </span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {RANGE_CONVERTER_PDF_CHARTS.map((chart) => (
            <button
              key={chart.id}
              onClick={() => {
                setSelectedPdfChartId(chart.id);
                // Map chart position to selectedPos if applicable
                if (chart.id.includes('UTG')) setSelectedPos('UTG');
                else if (chart.id.includes('MP')) setSelectedPos('HJ');
                else if (chart.id.includes('CO')) setSelectedPos('CO');
                else if (chart.id.includes('BTN')) setSelectedPos('BTN');
                else if (chart.id.includes('SB')) setSelectedPos('SB');
                else if (chart.id.includes('BB')) setSelectedPos('BB');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedPdfChartId === chart.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {chart.name}
            </button>
          ))}
        </div>

        {/* Stats summary banner */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="text-slate-300">
            <span className="text-amber-400 font-bold">{activeChartConfig.name}: </span>
            <span className="text-slate-400">{activeChartConfig.description}</span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-400">Fold:</span>
              <span className="text-slate-200 font-bold">{activeChartConfig.stats.foldFreq}%</span>
            </div>

            {activeChartConfig.stats.callFreq !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Call:</span>
                <span className="text-emerald-400 font-bold">{activeChartConfig.stats.callFreq}%</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">{activeChartConfig.stats.raiseLabel}:</span>
              <span className="text-amber-400 font-bold">{activeChartConfig.stats.raiseFreq}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Selector Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-400 font-medium mr-2">微调查看矩阵位置:</span>
        {(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as Position[]).map((pos) => (
          <button
            key={pos}
            onClick={() => setSelectedPos(pos)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              selectedPos === pos
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Main View Modes */}
      {activeViewMode === 'MATRIX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Matrix169
              frequenciesMap={activePosMatrix}
              selectedHand={selectedHand}
              onSelectHand={setSelectedHand}
              title={`RangeConverter 翻前矩阵 - ${selectedPos}`}
              subtitle={`显式白名单与三级梯度混合频率渲染`}
            />
          </div>

          {/* Side Details Panel */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                <span>位置信息 & 范围特征</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">{selectedPos}</span>
              </h3>

              <div className="text-xs text-slate-400 space-y-2">
                <p>
                  <strong className="text-slate-200">显式白名单机制：</strong>
                  未在白名单列出的极其边缘组合将自动判定为纯 100% Fold，极大提升渲染速度与精度。
                </p>
                <p>
                  <strong className="text-slate-200">开启加注尺寸：</strong> 2.5x BB (RFI) / 3-Bet 10BB / 4-Bet 22BB
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">导出当前数字化解集:</span>
                <button
                  onClick={handleExportProfile}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 JSON</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Info className="w-4 h-4" />
                <span>RangeConverter 实战应用要点</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                在 100BB 6-Max 中，{selectedPos} 位置具有明确的 GTO 开放开局频率。切勿过度开发不具备阻挡效应的无花色组合。
              </p>
            </div>
          </div>
        </div>
      )}

      {activeViewMode === 'DIGITIZER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>RangeConverter PDF / File 数字化转化器</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                可以直接上传或拖拽你的 RangeConverter PDF / TXT / JSON 文件，或粘贴文本数据（例：A5s:75/25），即刻完成 169 矩阵解析。
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700 transition-all">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>选择/拖拽 PDF 文件</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          setDigitizerInput(content);
                          setDigitizerStatus(`已成功读取文件: ${file.name}，请点击右侧"转换并应用"进行数字化矩阵解析。`);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              <button
                onClick={handleParseDigitizer}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>转换并应用至 {selectedPos}</span>
              </button>
            </div>
          </div>

          <textarea
            value={digitizerInput}
            onChange={(e) => setDigitizerInput(e.target.value)}
            rows={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            placeholder="也可在此直接粘贴 RangeConverter 的解集数据..."
          />

          {digitizerStatus && (
            <div className="p-3 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-200 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{digitizerStatus}</span>
            </div>
          )}
        </div>
      )}

      {activeViewMode === 'GRADIENT_DEFENSE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">BB 防守三级梯度模型 (BB Gradient Defense Model)</h3>
              <p className="text-xs text-slate-400">大盲位面对按钮位(BTN) 2.5x 开放加注时的精确响应分级</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-red-900/60 space-y-2">
              <span className="font-bold text-red-400 block text-sm">Tier 1: 纯加注 (Pure 3-Bet)</span>
              <p className="text-slate-400">100% 频率 3-Bet value 取胜组合</p>
              <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded">AA, KK, AKs, AKo</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/60 space-y-2">
              <span className="font-bold text-amber-400 block text-sm">Tier 2: 混合响应 (Mixed)</span>
              <p className="text-slate-400">依赖阻挡效应与备用权益的混合策略</p>
              <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded">QQ, AQs, A5s (80% 3Bet / 20% Call)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">Tier 3: 纯跟注 (Pure Call)</span>
              <p className="text-slate-400">防守范围的核心中坚跟注组合</p>
              <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded">TT-66, JTs, T9s, KQs</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-400 block text-sm">Tier 4: 弃牌阈值 (Fold)</span>
              <p className="text-slate-400">负 EV 或受制于压制的无权益牌</p>
              <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded">72o, 83o, 94o</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
