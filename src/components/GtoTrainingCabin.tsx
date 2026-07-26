import React, { useState, useEffect } from 'react';
import { Card, Position, ActionType, UserProfile, GtoAuditResponse, CardRank, CardSuit } from '../types/poker';
import { drawRandomCardCombo, formatCardString, getHandNotationFromCards, get169HandNames, SUIT_COLORS, SUIT_SYMBOLS, FLOP_BOARDS, TEXAS_SOLVER_A_DRY_BTNVsBB, DEFAULT_RANGE_CONVERTER_PROFILE } from '../data/pokerData';
import { Zap, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Tablet, BarChart3, RotateCcw, Target, Brain, RefreshCw, Layers, Sliders, Check, Trophy, Users, ShieldAlert, Award, MessageSquare, Dices, DollarSign, Crown } from 'lucide-react';

interface GtoTrainingCabinProps {
  currentUser: UserProfile;
  onRecordHandResult: (handResult: { isCorrect: boolean; evLossMBB: number; leakTag?: string }) => void;
  onRequestAiAudit: (handData: any) => void;
}

export interface HandMasteryData {
  trials: number;
  correct: number;
  wrong: number;
  evLoss: number;
}

export interface CasinoSeat {
  id: number;
  name: string;
  type: 'HERO' | 'AI_LAG' | 'AI_NIT' | 'AI_FISH' | 'AI_TAG' | 'AI_MANIAC' | 'AI_GTO' | 'AI_WHALE' | 'AI_PRO';
  avatar: string;
  styleLabel: string;
  borderColor: string;
  bgColor: string;
  vpipPfr: string;
  isOccupied?: boolean;
}

export const ALL_CASINO_SEATS: CasinoSeat[] = [
  { id: 0, name: '你 (Hero)', type: 'HERO', avatar: '🧙‍♂️', styleLabel: 'GTO 学习者', borderColor: 'border-amber-400', bgColor: 'bg-amber-50', vpipPfr: 'VPIP 24% / PFR 19%', isOccupied: true },
  { id: 1, name: '毒蛇 Shark', type: 'AI_LAG', avatar: '🐍', styleLabel: '松凶 (LAG) 强攻击', borderColor: 'border-purple-300', bgColor: 'bg-purple-50', vpipPfr: 'VPIP 28% / PFR 23%', isOccupied: true },
  { id: 2, name: '石头 Rock', type: 'AI_NIT', avatar: '🪨', styleLabel: '紧弱 (NIT) 极其收敛', borderColor: 'border-blue-300', bgColor: 'bg-blue-50', vpipPfr: 'VPIP 14% / PFR 11%', isOccupied: true },
  { id: 3, name: '大鱼 Station', type: 'AI_FISH', avatar: '🐟', styleLabel: '松被动 (FISH) 站跟', borderColor: 'border-emerald-300', bgColor: 'bg-emerald-50', vpipPfr: 'VPIP 42% / PFR 8%', isOccupied: true },
  { id: 4, name: '规矩 Reg', type: 'AI_TAG', avatar: '🤖', styleLabel: '紧凶 (TAG) 标准 GTO', borderColor: 'border-cyan-300', bgColor: 'bg-cyan-50', vpipPfr: 'VPIP 22% / PFR 18%', isOccupied: true },
  { id: 5, name: '疯子 Bully', type: 'AI_MANIAC', avatar: '🔥', styleLabel: '狂魔 (MANIAC) 重度诈唬', borderColor: 'border-rose-300', bgColor: 'bg-rose-50', vpipPfr: 'VPIP 55% / PFR 40%', isOccupied: true },
  { id: 6, name: '狐狸 Solver', type: 'AI_GTO', avatar: '🦊', styleLabel: '极化 Solver (GTO大师)', borderColor: 'border-indigo-300', bgColor: 'bg-indigo-50', vpipPfr: 'VPIP 25% / PFR 21%', isOccupied: true },
  { id: 7, name: '刺猬 Whale', type: 'AI_WHALE', avatar: '🦔', styleLabel: '巨鲸 (WHALE) 盲目重注', borderColor: 'border-amber-300', bgColor: 'bg-amber-50', vpipPfr: 'VPIP 65% / PFR 35%', isOccupied: true },
  { id: 8, name: '狮子 Pro', type: 'AI_PRO', avatar: '🦁', styleLabel: '豪客牌手 (PRO) 顶级识破', borderColor: 'border-teal-300', bgColor: 'bg-teal-50', vpipPfr: 'VPIP 26% / PFR 22%', isOccupied: true },
];

// Radial coordinates for 9-max full ring seats around oval table
const NINE_MAX_COORDS: { top: string; left: string }[] = [
  { top: '80%', left: '50%' }, // Seat 0 (Hero - Bottom Center)
  { top: '76%', left: '76%' }, // Seat 1 (Bottom Right)
  { top: '50%', left: '88%' }, // Seat 2 (Right Middle)
  { top: '22%', left: '78%' }, // Seat 3 (Top Right)
  { top: '15%', left: '58%' }, // Seat 4 (Top Center-Right)
  { top: '15%', left: '42%' }, // Seat 5 (Top Center-Left)
  { top: '22%', left: '22%' }, // Seat 6 (Top Left)
  { top: '50%', left: '12%' }, // Seat 7 (Left Middle)
  { top: '76%', left: '24%' }, // Seat 8 (Bottom Left)
];

const SIX_MAX_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Radial coordinates for 6-max seats around oval table
const SEAT_POSITIONS_MAP: Record<Position, { top: string; left: string }> = {
  UTG: { top: '16%', left: '30%' },
  HJ: { top: '16%', left: '70%' },
  CO: { top: '50%', left: '88%' },
  BTN: { top: '80%', left: '70%' },
  SB: { top: '80%', left: '30%' },
  BB: { top: '50%', left: '12%' },
};

export function getHandMasteryStatus(record?: HandMasteryData): 'MASTERED' | 'GRAY_ZONE' | 'NEEDS_WORK' | 'UNTESTED' {
  if (!record || record.trials === 0) return 'UNTESTED';
  const accuracy = (record.correct / record.trials) * 100;
  if (record.trials >= 2 && accuracy >= 80) return 'MASTERED';
  if (accuracy >= 40 && accuracy < 80) return 'GRAY_ZONE';
  return 'NEEDS_WORK';
}

export interface HandLogItem {
  id: string;
  timestamp: number;
  stage: string;
  heroPos: Position;
  villainPos: Position;
  heroNotation: string;
  boardCards: string;
  userAction: ActionType;
  chosenLabel: string;
  bestAction: ActionType;
  bestLabel: string;
  isOptimal: boolean;
  evLoss: number;
  scenarioMode: string;
  explanation: { reasoning: string; rangeLogic: string; actionTip: string };
}

export function generateGtoDetailedExplanation(
  stage: string,
  scenario: string,
  heroPos: Position,
  villainPos: Position,
  heroNotation: string,
  userAction: ActionType,
  bestAction: ActionType,
  chosenOption: { label: string; freq: number; ev?: number } | undefined,
  bestOption: { label: string; freq: number; ev?: number },
  isOptimal: boolean,
  boardCards: Card[]
): { reasoning: string; rangeLogic: string; actionTip: string } {
  const boardStr = boardCards.map(formatCardString).join(' ');

  if (isOptimal) {
    let reasoning = `在当前 [${heroPos}] 位置面对 [${villainPos}] 的场景下，手牌 [${heroNotation}] 选择 [${chosenOption?.label || userAction}] 是 GTO Solver 的核心正 EV 决策。`;
    let rangeLogic = `该决策完全契合 [${heroPos}] 位的范围构建原理。在 ${boardStr ? `牌面 [${boardStr}]` : '翻前'} 保持该动作频率可最大化积累底池期望值。`;
    let actionTip = `💡 核心要领：实战中请坚决贯彻该决策尺寸与频率，切勿因恐惧防守或过于急躁而随意偏离。`;

    if (stage === 'STAGE_1_PREFLOP') {
      if (scenario === 'PREFLOP_RFI') {
        reasoning = `手牌 [${heroNotation}] 处于 [${heroPos}] 位的标准 Open Range 前列。选择加注入局能有效榨取后位盲注，建立底池控制权。`;
        rangeLogic = `在 6-Max 中，[${heroPos}] 位的加注范围拥有强劲的胜率 (Equity) 支撑，阻挡了对手的 3-Bet 挤压。`;
        actionTip = `💡 翻前指导：保持标准加注尺寸 (2.5BB)，遇到 3-Bet 时根据其同花/对子潜能决定 Call 或 4-Bet。`;
      } else if (scenario === 'PREFLOP_BB_DEFENSE') {
        reasoning = `BB 位面对 [${villainPos}] 的 Open，手牌 [${heroNotation}] 具备极佳的底池赔率与防守价值。选择 [${chosenOption?.label || userAction}] 完美捍卫了盲注。`;
        rangeLogic = `盲注防守范围需要平衡平跟 (Call) 与 3-Bet 反击。此手牌在当前组合下属于高频正 EV 防守牌。`;
        actionTip = `💡 盲注防守要领：不要盲目 Fold 掉具备同花/顺子潜能的边缘牌，通过合理平跟控池能大幅降低盲注消耗率。`;
      }
    } else if (stage === 'STAGE_2_FLOP') {
      reasoning = `在翻牌面 [${boardStr}] 上，Hero 拥有显著的范围优势 (Range Advantage)。下注 33% Pot 小注能够以低成本对 Villain 的范围施加全盘压力。`;
      rangeLogic = `干燥/高牌面允许全范围小注下注 (High Frequency C-Bet)。Villain 缺乏足够强度的范围抵抗，必须弃掉大量未成牌。`;
      actionTip = `💡 翻牌圈技巧：在干燥面上不要过度使用 75% 重注，33% 小注具有更优的性价比和范围保护能力。`;
    }

    return { reasoning, rangeLogic, actionTip };
  } else {
    // Suboptimal or Wrong Action
    let reasoning = `在当前场景下，你的选择 [${chosenOption?.label || userAction}] 偏离了 Solver 的主导策略。手牌 [${heroNotation}] 在 [${heroPos}] 位属于强力加注范围，建议选用 [${bestOption.label}]。`;
    let rangeLogic = `GTO Solver 推荐主导动作 [${bestOption.label}] (推荐频率 ${(bestOption.freq * 100).toFixed(0)}%)。`;
    let actionTip = `💡 避坑建议：请注意评估手牌的阻挡效应与范围优势，避免做出偏离 GTO 的保守或随意弃牌动作。`;

    if (userAction === 'FOLD') {
      reasoning = `手牌 [${heroNotation}] 处于 [${heroPos}] 位的加注范围，直接弃牌 (Fold) 放弃了正 EV 入局机会，属于过度弃牌 (Over-folding) 漏洞。`;
      rangeLogic = `如果将此类高胜率手牌 Fold 掉，你的整个加注/防守范围将被对手无脑剥削 (Exploit)。`;
      actionTip = `💡 修正方案：请坚决使用 [${bestOption.label}] 加注入局，建立底池主动权。`;
    } else if (userAction === 'CALL' && stage === 'STAGE_1_PREFLOP') {
      reasoning = `在翻前 [${heroPos}] 位置平跟 (Limp/Flat) 容易将底池主动权让给后位玩家，陷入被挤压加注 (Squeeze) 的被动局面。`;
      rangeLogic = `GTO 翻前策略在中前位极少使用平跟，应当使用 Raise 加注主动掌控底池，或直接 Fold 弃牌。`;
      actionTip = `💡 修正方案：翻前遵循 "Raise or Fold" 纪律，避免在非盲注位置平跟。`;
    }

    return { reasoning, rangeLogic, actionTip };
  }
}

function generateCardComboForNotation(handNotation: string, excludeCards: Card[] = []): [Card, Card] {
  const suits: CardSuit[] = ['s', 'h', 'd', 'c'];
  const r1 = handNotation[0] as CardRank;
  const r2 = handNotation[1] as CardRank;
  const isSuited = handNotation.endsWith('s');
  const isPair = handNotation.length === 2;

  const isExcluded = (c: Card) => excludeCards.some(e => e.rank === c.rank && e.suit === c.suit);

  if (isPair) {
    const availableSuits = suits.filter(s => !isExcluded({ rank: r1, suit: s }));
    if (availableSuits.length >= 2) {
      return [
        { rank: r1, suit: availableSuits[0] },
        { rank: r1, suit: availableSuits[1] },
      ];
    }
  } else if (isSuited) {
    for (const s of suits) {
      const c1: Card = { rank: r1, suit: s };
      const c2: Card = { rank: r2, suit: s };
      if (!isExcluded(c1) && !isExcluded(c2)) {
        return [c1, c2];
      }
    }
  } else {
    for (const s1 of suits) {
      for (const s2 of suits) {
        if (s1 !== s2) {
          const c1: Card = { rank: r1, suit: s1 };
          const c2: Card = { rank: r2, suit: s2 };
          if (!isExcluded(c1) && !isExcluded(c2)) {
            return [c1, c2];
          }
        }
      }
    }
  }

  return drawRandomCardCombo(excludeCards);
}

// Compute Seat Action Badge according to chronological poker order of action
function getSeatActionBadge(
  pos: Position,
  heroPos: Position,
  villainPos: Position,
  scenarioMode: string,
  isEvaluated: boolean,
  evalResult: any
): { label: string; bg: string } {
  const heroIdx = SIX_MAX_POSITIONS.indexOf(heroPos);
  const posIdx = SIX_MAX_POSITIONS.indexOf(pos);

  if (pos === heroPos) {
    if (isEvaluated) {
      return evalResult?.isOptimal
        ? { label: `✅ ${evalResult.chosenOption?.label || '已决策'}`, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' }
        : { label: `❌ ${evalResult.chosenOption?.label || '已决策'}`, bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
    }
    return { label: '🎯 Hero 决策中', bg: 'bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse' };
  }

  if (scenarioMode === 'PREFLOP_RFI') {
    // In Preflop RFI, Hero is opening. Players before Hero folded. Players after Hero haven't acted yet!
    if (posIdx < heroIdx) {
      return { label: '❌ 弃牌 Fold', bg: 'bg-slate-100 text-slate-400 border-slate-200' };
    } else {
      return { label: '⏳ 盲注待定', bg: 'bg-slate-100 text-slate-600 border-slate-300 font-medium' };
    }
  }

  if (scenarioMode === 'PREFLOP_BB_DEFENSE') {
    const villainIdx = SIX_MAX_POSITIONS.indexOf(villainPos);
    if (pos === villainPos) {
      return { label: '💥 翻前加注 2.5x', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
    }
    if (posIdx < villainIdx || (posIdx > villainIdx && posIdx < heroIdx)) {
      return { label: '❌ 弃牌 Fold', bg: 'bg-slate-100 text-slate-400 border-slate-200' };
    }
    return { label: '⏳ 盲注待定', bg: 'bg-slate-100 text-slate-600 border-slate-300 font-medium' };
  }

  if (scenarioMode === 'PREFLOP_3BET') {
    if (pos === villainPos) {
      return { label: '💥 3-Bet 加注 7.5x', bg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' };
    }
    if (posIdx < heroIdx) {
      return { label: '❌ 弃牌 Fold', bg: 'bg-slate-100 text-slate-400 border-slate-200' };
    }
    return { label: '⏳ 盲注待定', bg: 'bg-slate-100 text-slate-600 border-slate-300 font-medium' };
  }

  if (pos === villainPos) {
    return { label: '💥 入局对战 (Villain)', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold' };
  }
  return { label: '❌ 弃牌 Fold', bg: 'bg-slate-100 text-slate-400 border-slate-200' };
}

const INITIAL_HAND_MASTERY_MAP: Record<string, HandMasteryData> = {
  'BTN_AA': { trials: 5, correct: 5, wrong: 0, evLoss: 0 },
  'BTN_KK': { trials: 4, correct: 4, wrong: 0, evLoss: 0 },
  'BTN_AKs': { trials: 3, correct: 3, wrong: 0, evLoss: 0 },
  'BTN_Q9s': { trials: 3, correct: 3, wrong: 0, evLoss: 0 },
  'BTN_K9s': { trials: 2, correct: 2, wrong: 0, evLoss: 0 },
};

export const GtoTrainingCabin: React.FC<GtoTrainingCabinProps> = ({
  currentUser,
  onRecordHandResult,
  onRequestAiAudit,
}) => {
  const [trainingStage, setTrainingStage] = useState<
    'STAGE_1_PREFLOP' | 'STAGE_2_FLOP' | 'STAGE_3_TURN' | 'STAGE_4_RIVER' | 'STAGE_5_CASINO_RING'
  >('STAGE_1_PREFLOP');

  const [preflopTargetPos, setPreflopTargetPos] = useState<Position | 'RANDOM_MIXED'>('BTN');
  const [heroPos, setHeroPos] = useState<Position>('BTN');
  const [villainPos, setVillainPos] = useState<Position>('BB');
  const [scenarioMode, setScenarioMode] = useState<
    'PREFLOP_RFI' | 'PREFLOP_BB_DEFENSE' | 'PREFLOP_VS_3BET' | 'POSTFLOP_MULTI_STREET'
  >('PREFLOP_RFI');

  const [casinoTableFormat, setCasinoTableFormat] = useState<'6_MAX' | '9_MAX' | 'DYNAMIC_RANDOM'>('DYNAMIC_RANDOM');
  const [activeCasinoSeats, setActiveCasinoSeats] = useState<boolean[]>([
    true, true, true, true, true, true, true, true, true
  ]);
  const [btnSeatIndex, setBtnSeatIndex] = useState<number>(0);
  const [casinoBankrollBB, setCasinoBankrollBB] = useState<number>(100.0);
  const [casinoHandsPlayed, setCasinoHandsPlayed] = useState<number>(0);
  const [casinoProfitBB, setCasinoProfitBB] = useState<number>(0);
  const [casinoRecentDialogue, setCasinoRecentDialogue] = useState<string>(
    '🎰 赌场发牌员: "欢迎来到 Las Vegas 真实 9-Max / 6-Max 动态现金桌！Button 顺时针每手旋转！"'
  );

  const [drillMode, setDrillMode] = useState<'ADAPTIVE' | 'RANDOM'>('ADAPTIVE');
  const [showMasteryMatrix, setShowMasteryMatrix] = useState<boolean>(true);

  const [postflopTargetFlop, setPostflopTargetFlop] = useState<'ALL_MIXED' | 'A_HIGH_DRY' | 'K_HIGH_DRY' | 'PAIRED_DRY' | 'WET_CONNECTOR' | 'MONOTONE'>('ALL_MIXED');
  const [postflopTargetTurn, setPostflopTargetTurn] = useState<'ALL_MIXED' | 'TURN_OVERCARD' | 'TURN_BRICK' | 'TURN_FLUSH_COMPLETE' | 'TURN_PAIRED'>('ALL_MIXED');
  const [postflopTargetRiver, setPostflopTargetRiver] = useState<'ALL_MIXED' | 'RIVER_VALUE_NUT' | 'RIVER_BLUFF_JAM' | 'RIVER_HERO_CALL' | 'RIVER_BLOCKBET'>('ALL_MIXED');

  const [handMasteryMap, setHandMasteryMap] = useState<Record<string, HandMasteryData>>(INITIAL_HAND_MASTERY_MAP);

  const [sessionStats, setSessionStats] = useState({
    totalHands: 0,
    correctHands: 0,
    evLossMBB: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  const [heroCards, setHeroCards] = useState<[Card, Card]>([
    { rank: 'Q', suit: 's' },
    { rank: '9', suit: 's' },
  ]);
  const [boardCards, setBoardCards] = useState<Card[]>([]);
  const [potSize, setPotSize] = useState<number>(1.5);
  const [street, setStreet] = useState<'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER'>('PREFLOP');

  const [userAction, setUserAction] = useState<ActionType | null>(null);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    isOptimal: boolean;
    evLossMBB: number;
    message: string;
    chosenOption?: { label: string; freq: number };
    bestOption?: { label: string; freq: number };
    explanation?: { reasoning: string; rangeLogic: string; actionTip: string };
  } | null>(null);

  const [aiAuditLoading, setAiAuditLoading] = useState<boolean>(false);
  const [aiAuditResult, setAiAuditResult] = useState<GtoAuditResponse | null>(null);

  const dealNewHand = () => {
    let activePos: Position = 'BTN';
    if (preflopTargetPos === 'RANDOM_MIXED') {
      activePos = SIX_MAX_POSITIONS[Math.floor(Math.random() * SIX_MAX_POSITIONS.length)];
    } else {
      activePos = preflopTargetPos;
    }

    let newHero = drawRandomCardCombo();
    setHeroCards(newHero);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);

    setBoardCards([]);
    setPotSize(1.5);
    setStreet('PREFLOP');
    setHeroPos(activePos);
    setVillainPos(activePos === 'BB' ? 'BTN' : 'BB');
    if (activePos === 'BB') {
      setScenarioMode('PREFLOP_BB_DEFENSE');
    } else {
      setScenarioMode('PREFLOP_RFI');
    }
  };

  useEffect(() => {
    dealNewHand();
  }, [trainingStage, scenarioMode]);

  const heroNotation = getHandNotationFromCards(heroCards[0], heroCards[1]);

  // Generate normalized, noise-free GTO action options summing to EXACTLY 1.0 (100%)
  const getGtoActionOptions = () => {
    if (scenarioMode === 'PREFLOP_RFI') {
      const positionMap = DEFAULT_RANGE_CONVERTER_PROFILE.matrixData[heroPos] || {};
      const freqs = positionMap[heroNotation] || { raise2_5: 0.85, fold: 0.15 };

      if (heroPos === 'SB') {
        const raiseFreq = freqs.raise3 || 0.35;
        const callFreq = freqs.call || 0.25;
        const foldFreq = Math.max(0, 1.0 - (raiseFreq + callFreq));
        return [
          { action: 'RAISE_3' as ActionType, label: '加注 3.0x BB (SB Open)', freq: raiseFreq },
          { action: 'CALL' as ActionType, label: '平跟 Call (SB Limp 1.0BB)', freq: callFreq },
          { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: foldFreq },
        ];
      }

      // Pure 100BB Unopened Pot RFI options (No 3% Limp / 2% All-In noise)
      const raiseFreq = freqs.raise2_5 !== undefined ? freqs.raise2_5 : 0.85;
      const foldFreq = Math.max(0, 1.0 - raiseFreq);

      return [
        { action: 'RAISE_2_5' as ActionType, label: '标准加注 2.5x BB (Standard Open)', freq: raiseFreq },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: foldFreq },
      ];
    }

    if (scenarioMode === 'PREFLOP_BB_DEFENSE') {
      const bbMap = DEFAULT_RANGE_CONVERTER_PROFILE.matrixData['BB'] || {};
      const freqs = bbMap[heroNotation] || { call: 0.50, fold: 0.35, threeBet: 0.15 };

      const threeBetFreq = freqs.threeBet || 0.15;
      const callFreq = freqs.call || 0.50;
      const foldFreq = Math.max(0, 1.0 - (threeBetFreq + callFreq));

      return [
        { action: 'THREE_BET' as ActionType, label: '3-Bet 反击加注 (10BB)', freq: threeBetFreq },
        { action: 'CALL' as ActionType, label: '平跟跟注 Call (2.5BB 捍卫盲注)', freq: callFreq },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: foldFreq },
      ];
    }

    if (scenarioMode === 'PREFLOP_VS_3BET') {
      return [
        { action: 'FOUR_BET' as ActionType, label: '4-Bet 强力加注 (25BB)', freq: 0.20 },
        { action: 'CALL' as ActionType, label: '跟注 Call 3-Bet', freq: 0.45 },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: 0.35 },
      ];
    }

    // Postflop options
    return [
      { action: 'CBET_33' as ActionType, label: '下注 33% Pot (小注打频)', freq: 0.60 },
      { action: 'CBET_75' as ActionType, label: '下注 75% Pot (重注极化)', freq: 0.25 },
      { action: 'CHECK' as ActionType, label: '过牌 Check', freq: 0.15 },
    ];
  };

  const options = getGtoActionOptions();

  const handleSelectAction = (action: ActionType) => {
    if (isEvaluated) return;
    setUserAction(action);
    setIsEvaluated(true);

    const chosenOption = options.find(o => o.action === action);
    const bestOption = [...options].sort((a, b) => b.freq - a.freq)[0];

    // Evaluate accuracy strictly:
    // Optimal IF chosen action IS the highest frequency option, OR if it has a high mixing frequency (>= 0.35)
    const isOptimal = chosenOption
      ? chosenOption.action === bestOption.action || (chosenOption.freq >= 0.35 && (bestOption.freq - chosenOption.freq) <= 0.20)
      : false;

    const evLoss = isOptimal ? 0 : Math.max(10, Math.round((bestOption.freq - (chosenOption?.freq || 0)) * 100));

    const explanation = generateGtoDetailedExplanation(
      trainingStage,
      scenarioMode,
      heroPos,
      villainPos,
      heroNotation,
      action,
      bestOption.action,
      chosenOption,
      bestOption,
      isOptimal,
      boardCards
    );

    setEvalResult({
      isOptimal,
      evLossMBB: evLoss,
      message: isOptimal ? '决策正确！符合 GTO 推荐策略' : `决策偏离 (建议动作: ${bestOption.label})`,
      chosenOption,
      bestOption,
      explanation,
    });

    // Update session stats
    setSessionStats((prev) => {
      const nextTotal = prev.totalHands + 1;
      const nextCorrect = prev.correctHands + (isOptimal ? 1 : 0);
      const nextStreak = isOptimal ? prev.currentStreak + 1 : 0;
      return {
        totalHands: nextTotal,
        correctHands: nextCorrect,
        evLossMBB: prev.evLossMBB + evLoss,
        currentStreak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
    });

    onRecordHandResult({
      isCorrect: isOptimal,
      evLossMBB: evLoss,
      leakTag: !isOptimal ? `${heroPos} ${scenarioMode} 偏离 GTO` : undefined,
    });
  };

  const handleRequestAudit = async () => {
    setAiAuditLoading(true);
    try {
      const payload = {
        handDetails: {
          heroPosition: heroPos,
          villainPosition: villainPos,
          heroHand: heroNotation,
          board: boardCards.map(formatCardString).join(' '),
          street: street,
          potSize: potSize,
          userAction: userAction || 'NONE',
          gtoOptimalActions: options.map(o => `${o.label} (${(o.freq * 100).toFixed(0)}%)`).join(', '),
        },
      };
      localStorage.setItem('gto_pending_ai_hand', JSON.stringify(payload));
      onRequestAiAudit(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setAiAuditLoading(false);
    }
  };

  const accuracyPercent = sessionStats.totalHands > 0 ? Math.round((sessionStats.correctHands / sessionStats.totalHands) * 100) : 100;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Header Control Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <select
              value={trainingStage}
              onChange={(e) => setTrainingStage(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="STAGE_1_PREFLOP">阶段1: 翻前 RFI & 3-Bet 特训</option>
              <option value="STAGE_2_FLOP">阶段2: 翻牌圈 Flop 结构精通</option>
              <option value="STAGE_3_TURN">阶段3: 转牌圈 Turn 转折牌演练</option>
              <option value="STAGE_4_RIVER">阶段4: 河牌圈 River 终局阻挡</option>
              <option value="STAGE_5_CASINO_RING">阶段5: 9-Max 德州竞技场</option>
            </select>
          </div>

          {trainingStage === 'STAGE_1_PREFLOP' && (
            <select
              value={scenarioMode}
              onChange={(e) => setScenarioMode(e.target.value as any)}
              className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 shadow-sm cursor-pointer"
            >
              <option value="PREFLOP_RFI">RFI 首加注决策</option>
              <option value="PREFLOP_BB_DEFENSE">大盲注 BB 盲注捍卫</option>
              <option value="PREFLOP_VS_3BET">面对 3-Bet 挤压/反击</option>
            </select>
          )}

          <button
            onClick={dealNewHand}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>发下一把牌</span>
          </button>
        </div>

        {/* Live Session Statistics Pills */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center min-w-[85px] shadow-sm">
            <span className="text-[10px] text-slate-500 font-medium block">当场准确率</span>
            <span className={`font-black text-sm ${accuracyPercent >= 80 ? 'text-emerald-600' : accuracyPercent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
              {accuracyPercent}%
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center min-w-[90px] shadow-sm">
            <span className="text-[10px] text-slate-500 font-medium block">累积 EV 损耗</span>
            <span className="text-rose-600 font-black text-sm">-{sessionStats.evLossMBB} mBB</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center min-w-[80px] shadow-sm">
            <span className="text-[10px] text-slate-500 font-medium block">连胜/最高</span>
            <span className="text-amber-600 font-black text-sm">
              🔥 {sessionStats.currentStreak} / {sessionStats.bestStreak}
            </span>
          </div>

          <button
            onClick={() => setSessionStats({ totalHands: 0, correctHands: 0, evLossMBB: 0, currentStreak: 0, bestStreak: 0 })}
            title="重置当场统计"
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Oval Poker Table Canvas */}
      <div className="relative bg-slate-100 border border-slate-200 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-sm flex flex-col justify-between my-1 w-full">
        
        {/* Table Felt Green Oval Container */}
        <div className="relative w-full max-w-5xl mx-auto aspect-[1.8/1] sm:aspect-[2.2/1] min-h-[260px] sm:min-h-[320px] md:min-h-[370px] lg:min-h-[410px] max-h-[52vh] bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-800 rounded-[50px] sm:rounded-[120px] md:rounded-[180px] border-[6px] sm:border-[12px] md:border-[16px] border-amber-950 shadow-[inset_0_0_50px_rgba(0,0,0,0.65)] flex flex-col items-center justify-center p-1.5 sm:p-3 my-1">
          
          <div className="absolute inset-2 sm:inset-3 rounded-[40px] sm:rounded-[110px] border border-emerald-300/30 pointer-events-none" />

          {/* Center Board & Pot Display */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            
            <div className="px-3.5 sm:px-4 py-1 rounded-full bg-slate-900/95 border border-amber-400 text-amber-300 font-mono text-xs sm:text-sm md:text-base font-black shadow-xl flex items-center gap-1.5">
              <span>🪙 底池 (POT):</span>
              <span className="text-emerald-300 font-black text-xs sm:text-lg md:text-xl">{potSize} BB</span>
            </div>

            {/* Community Board Cards */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 my-1">
              {boardCards.length > 0 ? (
                boardCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`w-11 h-16 sm:w-14 sm:h-20 md:w-17 md:h-24 rounded-lg sm:rounded-xl border-2 border-slate-300 bg-white shadow-xl flex flex-col items-center justify-between p-1 font-mono font-black select-none transition-all hover:scale-105 ${
                      SUIT_COLORS[card.suit]
                    }`}
                  >
                    <span className="text-sm sm:text-xl md:text-2xl leading-none">{card.rank}</span>
                    <span className="text-lg sm:text-2xl md:text-3xl leading-none">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                ))
              ) : (
                <div className="text-emerald-100 italic text-xs sm:text-sm py-1 font-mono font-bold drop-shadow">Preflop 翻前开局阶段...</div>
              )}
            </div>
          </div>

          {/* Render Seats around the Poker Table */}
          {SIX_MAX_POSITIONS.map((pos) => {
            const isHero = pos === heroPos;
            const isVillain = pos === villainPos;
            const coords = SEAT_POSITIONS_MAP[pos];

            const actionBadge = getSeatActionBadge(pos, heroPos, villainPos, scenarioMode, isEvaluated, evalResult);

            return (
              <div
                key={pos}
                style={{ top: coords.top, left: coords.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
              >
                {/* Player Seat Chip Badge */}
                <div
                  className={`px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl border flex flex-col items-center shadow-xl transition-all ${
                    isHero
                      ? 'bg-white border-amber-500 ring-2 ring-amber-400/80 scale-105 z-30'
                      : isVillain
                      ? 'bg-white border-rose-500 ring-2 ring-rose-400/60 z-20'
                      : 'bg-slate-50 border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900">{pos}</span>
                    {isHero && <span className="text-[9px] sm:text-[10px] bg-amber-500 text-slate-950 font-black px-1 rounded">Hero</span>}
                    {isVillain && <span className="text-[9px] sm:text-[10px] bg-rose-600 text-white font-black px-1 rounded">Villain</span>}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 font-semibold">100 BB</span>
                </div>

                {/* Action Badge */}
                <div className={`mt-0.5 px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold shadow-xs whitespace-nowrap ${actionBadge.bg}`}>
                  {actionBadge.label}
                </div>

                {/* Dealt Hole Cards for Hero */}
                {isHero && (
                  <div className="flex items-center space-x-1 mt-0.5 animate-in fade-in zoom-in-95 duration-200">
                    {heroCards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-13 sm:w-12 sm:h-17 md:w-14 md:h-20 rounded-md sm:rounded-lg border-2 border-slate-200 bg-white shadow-xl flex flex-col items-center justify-between p-0.5 font-mono font-black select-none ${
                          SUIT_COLORS[card.suit]
                        }`}
                      >
                        <span className="text-xs sm:text-sm md:text-base leading-none">{card.rank}</span>
                        <span className="text-sm sm:text-lg md:text-xl leading-none">{SUIT_SYMBOLS[card.suit]}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isVillain && (
                  <div className="flex items-center space-x-0.5 mt-0.5 opacity-80">
                    <div className="w-5 h-7 sm:w-6 sm:h-9 rounded bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 shadow">🎴</div>
                    <div className="w-5 h-7 sm:w-6 sm:h-9 rounded bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 shadow">🎴</div>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Action Control Deck */}
        <div className="relative z-20 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 max-w-4xl mx-auto w-full">
          {!isEvaluated ? (
            <div className="space-y-2.5 sm:space-y-3 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 bg-white border border-slate-200 px-3 py-2 rounded-xl sm:rounded-2xl shadow-xs">
                <span className="text-xs sm:text-sm md:text-base text-slate-900 font-extrabold">
                  轮到 Hero ({heroPos}) 决策 | 手牌 [{heroNotation}]:
                </span>
                <div className="flex items-center space-x-1.5">
                  {heroCards.map((c, i) => (
                    <div
                      key={i}
                      className={`w-9 h-13 sm:w-11 sm:h-16 md:w-13 md:h-18 rounded-lg border-2 border-slate-300 bg-white shadow-md flex flex-col items-center justify-between p-0.5 font-mono font-black text-xs sm:text-sm select-none ${
                        SUIT_COLORS[c.suit]
                      }`}
                    >
                      <span className="leading-none">{c.rank}</span>
                      <span className="text-sm sm:text-base leading-none">{SUIT_SYMBOLS[c.suit]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto">
                {options.map((opt) => (
                  <button
                    key={opt.action}
                    onClick={() => handleSelectAction(opt.action)}
                    className={`py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl border font-extrabold text-xs sm:text-sm md:text-base transition-all shadow-sm active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      opt.action === 'FOLD'
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-slate-950 font-black shadow-amber-500/20'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Detailed Instant Judgment Card */}
              <div
                className={`p-4 rounded-2xl border flex flex-col space-y-3 shadow-sm ${
                  evalResult?.isOptimal
                    ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950'
                    : 'bg-rose-50 border-2 border-rose-400 text-rose-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {evalResult?.isOptimal ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-black text-sm sm:text-base flex items-center gap-2 text-slate-900">
                        <span>{evalResult?.isOptimal ? '当场判定：✅ 决策正确' : '当场判定：❌ 决策偏离 (漏水)'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border shadow-xs ${
                          evalResult?.isOptimal ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                        }`}>
                          {evalResult?.isOptimal ? 'EV 0 mBB' : `EV 损耗 -${evalResult?.evLossMBB} mBB`}
                        </span>
                      </h4>
                      <p className="text-xs opacity-90 font-mono mt-0.5 text-slate-700">{evalResult?.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center space-x-2 shrink-0">
                    <button
                      onClick={handleRequestAudit}
                      disabled={aiAuditLoading}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 border border-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>{aiAuditLoading ? 'Gemini 审计中...' : 'Gemini AI 深入诊所'}</span>
                    </button>

                    <button
                      onClick={dealNewHand}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <span>下一发手牌</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Solver Action Frequency Distribution Bars */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options.map((opt) => {
                    const isChosen = userAction === opt.action;
                    const pct = Math.round(opt.freq * 100);
                    return (
                      <div
                        key={opt.action}
                        className={`p-2 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                          isChosen
                            ? 'bg-white border-2 border-amber-500 shadow-xs text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {opt.label} {isChosen && <span className="text-amber-600 font-black">(你的选择)</span>}
                          </span>
                          <span className="font-bold text-emerald-700">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${opt.action === 'FOLD' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Immediate Strategic Explanation Box */}
                {evalResult?.explanation && (
                  <div className="pt-3 border-t border-slate-200 space-y-2.5 text-xs text-slate-800">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold">
                      <Brain className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>GTO 决策建议与原理详细说明:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-sans">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                        <span className="text-amber-700 font-bold block">【决策诊断与战术原理】:</span>
                        <p className="leading-relaxed text-slate-700">{evalResult.explanation.reasoning}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                        <span className="text-indigo-700 font-bold block">【范围与阻挡效应分析】:</span>
                        <p className="leading-relaxed text-slate-700">{evalResult.explanation.rangeLogic}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium leading-relaxed">
                      {evalResult.explanation.actionTip}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Gemini AI Inline Audit Output */}
      {aiAuditResult && (
        <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 border-b border-purple-100 pb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gemini 3.6 Flash GTO 实战牌桌剖析</h3>
              <p className="text-xs text-slate-500">基于 Range Advantage & Blockers 的深度求解分析</p>
            </div>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <p className="bg-slate-50 p-4 rounded-xl border border-slate-200">{aiAuditResult.analysis}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-amber-700 block mb-1">范围优势:</strong>
                <span>{aiAuditResult.keyConcepts.rangeAdvantage}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-indigo-700 block mb-1">阻挡牌效应:</strong>
                <span>{aiAuditResult.keyConcepts.blockerEffect}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-emerald-700 block mb-1">EV 与决策理由:</strong>
                <span>{aiAuditResult.keyConcepts.evComparison}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
