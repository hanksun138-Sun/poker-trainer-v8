import React, { useState, useEffect } from 'react';
import { Card, Position, ActionType, UserProfile, GtoAuditResponse, CardRank, CardSuit } from '../types/poker';
import { drawRandomCardCombo, formatCardString, getHandNotationFromCards, get169HandNames, SUIT_COLORS, SUIT_SYMBOLS, FLOP_BOARDS, TEXAS_SOLVER_A_DRY_BTNVsBB, DEFAULT_RANGE_CONVERTER_PROFILE } from '../data/pokerData';
import { Zap, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Tablet, BarChart3, RotateCcw, Target, Brain, RefreshCw, Layers, Sliders, Check, Trophy, Users, ShieldAlert, Award, MessageSquare, Dices, DollarSign, Crown, History, Eye, Flame, Filter, HelpCircle } from 'lucide-react';

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

const CASINO_DIALOGUES: Record<string, string[]> = {
  AI_FISH: ['这牌我一定要看看翻牌！', '顶对不弃牌，跟注到底！', '别吓唬我，我买到同花啦！'],
  AI_MANIAC: ['全进！谁退缩谁是懦夫！', '重注 150% Pot 给你施压！', '你敢跟注我就秀给你看！'],
  AI_LAG: ['在这个牌面上你的范围极其虚弱！', '阻挡牌在我手，轻松挤压！', '加注！这里没有任何人能防守。'],
  AI_GTO: ['该点位处于 GTO 极化边缘，精确下注 33%。', '平衡频率控制，防守胜率 62%。', '无暇可击的 Solver 计算逻辑。'],
  AI_NIT: ['太危险了，我只玩 AA/KK。', '遇到加注直接 Fold，安全第一。', '没有绝对强牌绝不下注。'],
};

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
        : { label: `❌ ${evalResult.chosenOption?.label || '已决策'}`, bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
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
      return { label: '💥 3-Bet 加注 7.5x', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
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
  'BTN_J10s': { trials: 3, correct: 2, wrong: 1, evLoss: 15 },
  'BTN_76s': { trials: 2, correct: 1, wrong: 1, evLoss: 25 },
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

  const [drillPushMode, setDrillPushMode] = useState<'SMART_EBBINGHAUS' | 'WEAK_LEAK_DRILL' | 'RANDOM_ROTATION'>('SMART_EBBINGHAUS');
  const [pushReasonBanner, setPushReasonBanner] = useState<string>(
    '🧠 艾宾浩斯智推: 基于遗忘曲线与盲点漏洞动态算法出题'
  );

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

  const [showMasteryMatrix, setShowMasteryMatrix] = useState<boolean>(false);
  const [masteryFilter, setMasteryFilter] = useState<'ALL' | 'MASTERED' | 'GRAY_ZONE' | 'NEEDS_WORK' | 'UNTESTED'>('ALL');
  const [showHandLogs, setShowHandLogs] = useState<boolean>(false);

  const [postflopTargetFlop, setPostflopTargetFlop] = useState<'ALL_MIXED' | 'A_HIGH_DRY' | 'K_HIGH_DRY' | 'PAIRED_DRY' | 'WET_CONNECTOR' | 'MONOTONE'>('ALL_MIXED');

  const [handMasteryMap, setHandMasteryMap] = useState<Record<string, HandMasteryData>>(INITIAL_HAND_MASTERY_MAP);
  const [handLogs, setHandLogs] = useState<HandLogItem[]>([]);

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

  // Smart Adaptive Hand Selector using Ebbinghaus & Leak Weights
  const selectSmartAdaptiveHand = (mode: 'SMART_EBBINGHAUS' | 'WEAK_LEAK_DRILL' | 'RANDOM_ROTATION'): { notation: string; reason: string } => {
    const all169 = get169HandNames().flat();

    if (mode === 'RANDOM_ROTATION') {
      const chosen = all169[Math.floor(Math.random() * all169.length)];
      return { notation: chosen, reason: '🎲 169 随机轮盘: 均匀平铺练习' };
    }

    const weightedPool: { notation: string; weight: number; reason: string }[] = [];

    all169.forEach((hand) => {
      const key = `${heroPos}_${hand}`;
      const mastery = handMasteryMap[key];

      let baseWeight = 1.0;
      let reason = '定期记忆复习';

      if (mastery) {
        if (mastery.wrong > 0) {
          const wrongMult = mode === 'WEAK_LEAK_DRILL' ? 8 : 5;
          baseWeight += mastery.wrong * wrongMult;
          reason = `历史出错 ${mastery.wrong} 次 (${Math.round((mastery.correct / mastery.trials) * 100)}% 胜率)`;
        }
        if (mastery.evLoss > 0) {
          baseWeight += Math.floor(mastery.evLoss / 5);
          reason += ` | 累积 EV 损耗 ${mastery.evLoss} mBB`;
        }
      } else {
        baseWeight = 2.0;
        reason = '未测试全新手牌 (优先探索)';
      }

      weightedPool.push({ notation: hand, weight: baseWeight, reason });
    });

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const item of weightedPool) {
      if (randomNum < item.weight) {
        const prefix = mode === 'SMART_EBBINGHAUS' ? '🧠 艾宾浩斯智推' : '🎯 漏洞弱项攻坚';
        return {
          notation: item.notation,
          reason: `${prefix}: 手牌 [${item.notation}] ${item.reason}`,
        };
      }
      randomNum -= item.weight;
    }

    const fallback = all169[Math.floor(Math.random() * all169.length)];
    return { notation: fallback, reason: '🧠 艾宾浩斯智推: 定期随机复习' };
  };

  const dealNewHand = (selectedHandNotation?: string) => {
    let activePos: Position = 'BTN';
    if (preflopTargetPos === 'RANDOM_MIXED') {
      activePos = SIX_MAX_POSITIONS[Math.floor(Math.random() * SIX_MAX_POSITIONS.length)];
    } else {
      activePos = preflopTargetPos;
    }

    let chosenNotation = selectedHandNotation;
    if (!chosenNotation) {
      const adaptiveResult = selectSmartAdaptiveHand(drillPushMode);
      chosenNotation = adaptiveResult.notation;
      setPushReasonBanner(adaptiveResult.reason);
    } else {
      setPushReasonBanner(`🎯 169 矩阵手动选牌对决: 手牌 [${chosenNotation}]`);
    }

    const newHero = generateCardComboForNotation(chosenNotation);

    setHeroCards(newHero);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);

    // Setup board based on stage
    if (trainingStage === 'STAGE_1_PREFLOP') {
      setBoardCards([]);
      setPotSize(1.5);
      setStreet('PREFLOP');
      setHeroPos(activePos);
      setVillainPos(activePos === 'BB' ? 'BTN' : 'BB');
      setScenarioMode(activePos === 'BB' ? 'PREFLOP_BB_DEFENSE' : 'PREFLOP_RFI');
    } else if (trainingStage === 'STAGE_2_FLOP') {
      const flopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)];
      setBoardCards([...flopBoard.cards]);
      setPotSize(6.5);
      setStreet('FLOP');
      setHeroPos('BTN');
      setVillainPos('BB');
      setScenarioMode('POSTFLOP_MULTI_STREET');
    } else if (trainingStage === 'STAGE_3_TURN') {
      const flopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)];
      const turnCard: Card = { rank: 'J', suit: 'd' };
      setBoardCards([...flopBoard.cards, turnCard]);
      setPotSize(18.5);
      setStreet('TURN');
      setHeroPos('BTN');
      setVillainPos('BB');
      setScenarioMode('POSTFLOP_MULTI_STREET');
    } else if (trainingStage === 'STAGE_4_RIVER') {
      const flopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)];
      const turnCard: Card = { rank: 'J', suit: 'd' };
      const riverCard: Card = { rank: '2', suit: 'c' };
      setBoardCards([...flopBoard.cards, turnCard, riverCard]);
      setPotSize(45.0);
      setStreet('RIVER');
      setHeroPos('BTN');
      setVillainPos('BB');
      setScenarioMode('POSTFLOP_MULTI_STREET');
    } else if (trainingStage === 'STAGE_5_CASINO_RING') {
      setBtnSeatIndex((prev) => (prev + 1) % 9);
      setCasinoHandsPlayed((prev) => prev + 1);
      setBoardCards([]);
      setPotSize(1.5);
      setStreet('PREFLOP');
      setHeroPos('BTN');
      setVillainPos('SB');
      setScenarioMode('PREFLOP_RFI');

      const randomOpponent = ALL_CASINO_SEATS[1 + Math.floor(Math.random() * 8)];
      const quotes = CASINO_DIALOGUES[randomOpponent.type] || ['看看你的 GTO 水平怎么样！'];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setCasinoRecentDialogue(`${randomOpponent.avatar} ${randomOpponent.name}: "${randomQuote}"`);
    }
  };

  useEffect(() => {
    dealNewHand();
  }, [trainingStage, scenarioMode]);

  const heroNotation = getHandNotationFromCards(heroCards[0], heroCards[1]);

  // Deal Turn / River cards in multi-street postflop
  const handleAdvanceNextStreet = () => {
    if (street === 'FLOP') {
      const turnCard: Card = { rank: 'K', suit: 'd' };
      setBoardCards((prev) => [...prev, turnCard]);
      setStreet('TURN');
      setPotSize((prev) => Math.round((prev + 12.0) * 10) / 10);
      setUserAction(null);
      setIsEvaluated(false);
      setEvalResult(null);
    } else if (street === 'TURN') {
      const riverCard: Card = { rank: '3', suit: 'h' };
      setBoardCards((prev) => [...prev, riverCard]);
      setStreet('RIVER');
      setPotSize((prev) => Math.round((prev + 25.0) * 10) / 10);
      setUserAction(null);
      setIsEvaluated(false);
      setEvalResult(null);
    }
  };

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

    // Postflop options for Flop / Turn / River
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

    // Update Casino Bankroll in Stage 5
    if (trainingStage === 'STAGE_5_CASINO_RING') {
      const delta = isOptimal ? 3.5 : -5.0;
      setCasinoProfitBB((p) => Math.round((p + delta) * 10) / 10);
      setCasinoBankrollBB((b) => Math.round((b + delta) * 10) / 10);
    }

    // Update 169 Hand Mastery Record
    const key = `${heroPos}_${heroNotation}`;
    setHandMasteryMap((prev) => {
      const existing = prev[key] || { trials: 0, correct: 0, wrong: 0, evLoss: 0 };
      return {
        ...prev,
        [key]: {
          trials: existing.trials + 1,
          correct: existing.correct + (isOptimal ? 1 : 0),
          wrong: existing.wrong + (isOptimal ? 0 : 1),
          evLoss: existing.evLoss + evLoss,
        },
      };
    });

    // Append to Hand Logs History
    const logItem: HandLogItem = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      stage: trainingStage,
      heroPos,
      villainPos,
      heroNotation,
      boardCards: boardCards.map(formatCardString).join(' '),
      userAction: action,
      chosenLabel: chosenOption?.label || action,
      bestAction: bestOption.action,
      bestLabel: bestOption.label,
      isOptimal,
      evLoss,
      scenarioMode,
      explanation,
    };
    setHandLogs((prev) => [logItem, ...prev]);

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

  // 169 Hand Names for Matrix
  const matrix169Names = get169HandNames();

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

          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 shadow-xs">
            <Brain className="w-4 h-4 text-emerald-700 shrink-0" />
            <select
              value={drillPushMode}
              onChange={(e) => setDrillPushMode(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm font-extrabold text-emerald-900 focus:outline-none cursor-pointer"
            >
              <option value="SMART_EBBINGHAUS">🧠 艾宾浩斯记忆强化 (遗忘曲线加权)</option>
              <option value="WEAK_LEAK_DRILL">🎯 漏洞弱项攻坚 (错题与EV 5倍权重)</option>
              <option value="RANDOM_ROTATION">🎲 169 随机轮盘</option>
            </select>
          </div>

          {trainingStage === 'STAGE_1_PREFLOP' && (
            <>
              <select
                value={preflopTargetPos}
                onChange={(e) => setPreflopTargetPos(e.target.value as any)}
                className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 shadow-sm cursor-pointer"
              >
                <option value="BTN">位置: BTN 按钮位</option>
                <option value="CO">位置: CO 关口位</option>
                <option value="HJ">位置: HJ 劫持位</option>
                <option value="UTG">位置: UTG 枪口位</option>
                <option value="SB">位置: SB 小盲位</option>
                <option value="BB">位置: BB 大盲位</option>
                <option value="RANDOM_MIXED">全位置随机混合</option>
              </select>

              <select
                value={scenarioMode}
                onChange={(e) => setScenarioMode(e.target.value as any)}
                className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 shadow-sm cursor-pointer"
              >
                <option value="PREFLOP_RFI">RFI 首加注决策</option>
                <option value="PREFLOP_BB_DEFENSE">大盲注 BB 盲注捍卫</option>
                <option value="PREFLOP_VS_3BET">面对 3-Bet 挤压/反击</option>
              </select>
            </>
          )}

          <button
            onClick={() => setShowMasteryMatrix(!showMasteryMatrix)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              showMasteryMatrix
                ? 'bg-amber-500 border-amber-600 text-slate-950 font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>169 矩阵热力图</span>
          </button>

          <button
            onClick={() => setShowHandLogs(!showHandLogs)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              showHandLogs
                ? 'bg-indigo-600 border-indigo-700 text-white font-black'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>手牌特训日志 ({handLogs.length})</span>
          </button>

          <button
            onClick={() => dealNewHand()}
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

      {/* 169 Hand Mastery Matrix Drawer / Modal */}
      {showMasteryMatrix && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>169 手牌掌握度分布矩阵 (点击任意手牌直接对决)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">绿色: 已精通(80%+胜率) | 黄色: 模糊区(40-80%) | 红色: 待加强(&lt;40%) | 灰色: 未测试</p>
            </div>

            <div className="flex items-center space-x-1 text-xs">
              {(['ALL', 'MASTERED', 'GRAY_ZONE', 'NEEDS_WORK', 'UNTESTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMasteryFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    masteryFilter === filter
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter === 'ALL' && '全部 (169)'}
                  {filter === 'MASTERED' && '🟢 精通'}
                  {filter === 'GRAY_ZONE' && '🟡 模糊'}
                  {filter === 'NEEDS_WORK' && '🔴 弱项'}
                  {filter === 'UNTESTED' && '⚪️ 未测试'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-13 gap-1 max-w-xl mx-auto aspect-square bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
            {matrix169Names.map((row) =>
              row.map((handName) => {
                const key = `${heroPos}_${handName}`;
                const rec = handMasteryMap[key];
                const status = getHandMasteryStatus(rec);

                let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
                if (status === 'MASTERED') bgClass = 'bg-emerald-600 text-white border-emerald-500 font-black';
                else if (status === 'GRAY_ZONE') bgClass = 'bg-amber-500 text-slate-950 border-amber-400 font-bold';
                else if (status === 'NEEDS_WORK') bgClass = 'bg-rose-600 text-white border-rose-500 font-bold';

                const isFilteredOut =
                  (masteryFilter === 'MASTERED' && status !== 'MASTERED') ||
                  (masteryFilter === 'GRAY_ZONE' && status !== 'GRAY_ZONE') ||
                  (masteryFilter === 'NEEDS_WORK' && status !== 'NEEDS_WORK') ||
                  (masteryFilter === 'UNTESTED' && status !== 'UNTESTED');

                return (
                  <button
                    key={handName}
                    disabled={isFilteredOut}
                    onClick={() => {
                      dealNewHand(handName);
                      setShowMasteryMatrix(false);
                    }}
                    title={`${handName}: ${rec ? `${rec.correct}/${rec.trials} 次正确 (${Math.round((rec.correct/rec.trials)*100)}%)` : '未出题'}`}
                    className={`rounded transition-all duration-150 flex items-center justify-center font-mono font-bold text-[9px] sm:text-xs select-none border ${bgClass} ${
                      isFilteredOut ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 hover:z-10 cursor-pointer shadow'
                    }`}
                  >
                    {handName}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Played Hand History Logs Modal */}
      {showHandLogs && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>当场手牌特训历史记录 ({handLogs.length} 把)</span>
            </h3>
            <button
              onClick={() => setHandLogs([])}
              className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
            >
              清空记录
            </button>
          </div>

          {handLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">暂无手牌记录，快开始练习吧！</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {handLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                    log.isOptimal ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      log.isOptimal ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {log.isOptimal ? '✅ 正确' : '❌ 偏离'}
                    </span>
                    <span className="font-bold text-slate-900">[{log.heroPos}] {log.heroNotation}</span>
                    {log.boardCards && <span className="font-mono text-slate-500">[{log.boardCards}]</span>}
                  </div>

                  <div className="flex items-center space-x-3 text-slate-700">
                    <span>你的选择: <strong className="text-slate-900">{log.chosenLabel}</strong></span>
                    <span>推荐: <strong className="text-emerald-700">{log.bestLabel}</strong></span>
                    {!log.isOptimal && <span className="text-rose-600 font-bold">-{log.evLoss} mBB</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Oval Poker Table Canvas */}
      <div className="relative bg-slate-100 border border-slate-200 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-sm flex flex-col justify-between my-1 w-full">
        
        {/* Table Felt Green Oval Container */}
        <div className="relative w-full max-w-5xl mx-auto aspect-[1.8/1] sm:aspect-[2.2/1] min-h-[260px] sm:min-h-[320px] md:min-h-[370px] lg:min-h-[410px] max-h-[52vh] bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-800 rounded-[50px] sm:rounded-[120px] md:rounded-[180px] border-[6px] sm:border-[12px] md:border-[16px] border-amber-950 shadow-[inset_0_0_50px_rgba(0,0,0,0.65)] flex flex-col items-center justify-center p-1.5 sm:p-3 my-1">
          
          <div className="absolute inset-2 sm:inset-3 rounded-[40px] sm:rounded-[110px] border border-emerald-300/30 pointer-events-none" />

          {/* Smart Memory / Adaptive Drilling Push Reason Banner */}
          {pushReasonBanner && (
            <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 border border-emerald-400/40 text-emerald-300 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl whitespace-nowrap max-w-[90%] overflow-hidden text-ellipsis">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span>{pushReasonBanner}</span>
            </div>
          )}

          {/* Center Board & Pot Display */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            
            <div className="px-3.5 sm:px-4 py-1 rounded-full bg-slate-900/95 border border-amber-400 text-amber-300 font-mono text-xs sm:text-sm md:text-base font-black shadow-xl flex items-center gap-1.5">
              <span>🪙 底池 (POT):</span>
              <span className="text-emerald-300 font-black text-xs sm:text-lg md:text-xl">{potSize} BB</span>
            </div>

            {/* Stage 5 Casino Ring Banner */}
            {trainingStage === 'STAGE_5_CASINO_RING' && (
              <div className="bg-amber-500/90 border border-amber-300 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black shadow-lg animate-bounce">
                {casinoRecentDialogue}
              </div>
            )}

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

          {/* Render Seats around the Poker Table (6-Max vs 9-Max) */}
          {trainingStage === 'STAGE_5_CASINO_RING' ? (
            // Stage 5: 9-Max Casino Ring Game Layout
            ALL_CASINO_SEATS.map((seat, index) => {
              const coords = NINE_MAX_COORDS[index];
              const isHero = seat.type === 'HERO';
              const isButton = btnSeatIndex === index;

              return (
                <div
                  key={seat.id}
                  style={{ top: coords.top, left: coords.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                >
                  <div
                    className={`px-2 py-1 rounded-xl border flex flex-col items-center shadow-xl transition-all ${seat.bgColor} ${seat.borderColor} ${
                      isHero ? 'ring-2 ring-amber-400 scale-105 z-30' : 'ring-1 ring-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{seat.avatar}</span>
                      <span className="font-bold text-xs text-slate-900">{seat.name}</span>
                      {isButton && (
                        <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-amber-600">
                          BTN
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{seat.vpipPfr}</span>
                  </div>

                  {isHero && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      {heroCards.map((card, idx) => (
                        <div
                          key={idx}
                          className={`w-8 h-12 rounded border bg-white shadow flex flex-col items-center justify-between p-0.5 font-mono font-black text-xs ${
                            SUIT_COLORS[card.suit]
                          }`}
                        >
                          <span>{card.rank}</span>
                          <span>{SUIT_SYMBOLS[card.suit]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Stages 1-4: Standard 6-Max Seats Layout
            SIX_MAX_POSITIONS.map((pos) => {
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
            })
          )}

        </div>

        {/* Action Control Deck */}
        <div className="relative z-20 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 max-w-4xl mx-auto w-full">
          {!isEvaluated ? (
            <div className="space-y-2.5 sm:space-y-3 text-center">
              {/* Hero Decision Status Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-cyan-50 border-2 border-cyan-300/80 text-cyan-950 px-4 py-2.5 rounded-2xl shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="bg-cyan-600 text-white px-2.5 py-0.5 rounded-md text-xs font-black animate-pulse shadow-xs">
                    🎯 HERO 决策中
                  </span>
                  <span className="text-xs sm:text-sm md:text-base font-black text-cyan-950">
                    轮到 Hero ({heroPos}) 决策 | 手牌 [{heroNotation}]
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {heroCards.map((c, i) => (
                    <div
                      key={i}
                      className={`w-9 h-12 sm:w-11 sm:h-15 rounded-lg border-2 border-slate-200 bg-white shadow-md flex flex-col items-center justify-between p-0.5 font-mono font-black text-xs sm:text-sm select-none ${
                        SUIT_COLORS[c.suit]
                      }`}
                    >
                      <span className="leading-none">{c.rank}</span>
                      <span className="text-sm sm:text-base leading-none">{SUIT_SYMBOLS[c.suit]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Grid with 3D Tactile Styling */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-xl mx-auto pt-1">
                {options.map((opt) => {
                  let buttonStyle = 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 border-2 border-b-4 border-emerald-800 border-t-emerald-300 text-white font-black shadow-md shadow-emerald-600/25 active:border-b-2';

                  if (opt.action === 'FOLD') {
                    buttonStyle = 'bg-gradient-to-b from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 border-2 border-b-4 border-amber-400 border-t-amber-50 text-amber-950 font-black shadow-md shadow-amber-300/40 active:border-b-2';
                  } else if (opt.action === 'CALL' || opt.action === 'CHECK') {
                    buttonStyle = 'bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 border-2 border-b-4 border-indigo-800 border-t-indigo-300 text-white font-black shadow-md shadow-indigo-600/25 active:border-b-2';
                  } else if (opt.action === 'THREE_BET' || opt.action === 'FOUR_BET' || opt.action === 'CBET_75') {
                    buttonStyle = 'bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 border-2 border-b-4 border-teal-800 border-t-teal-300 text-white font-black shadow-md shadow-teal-600/25 active:border-b-2';
                  }

                  return (
                    <button
                      key={opt.action}
                      onClick={() => handleSelectAction(opt.action)}
                      className={`py-3 sm:py-3.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base transition-all duration-100 cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center select-none active:translate-y-0.5 ${buttonStyle}`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Detailed Instant Judgment Card */}
              <div
                className={`p-4 rounded-2xl border flex flex-col space-y-3 shadow-sm ${
                  evalResult?.isOptimal
                    ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950'
                    : 'bg-amber-50 border-2 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {evalResult?.isOptimal ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-black text-sm sm:text-base flex items-center gap-2 text-slate-900">
                        <span>{evalResult?.isOptimal ? '当场判定：✅ 决策正确' : '当场判定：❌ 决策偏离 (漏水)'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border shadow-xs ${
                          evalResult?.isOptimal ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-amber-100 border-amber-300 text-amber-900'
                        }`}>
                          {evalResult?.isOptimal ? 'EV 0 mBB' : `EV 损耗 -${evalResult?.evLossMBB} mBB`}
                        </span>
                      </h4>
                      <p className="text-xs opacity-90 font-mono mt-0.5 text-slate-700">{evalResult?.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center space-x-2 shrink-0">
                    {/* Multi-Street Advance Buttons for Postflop */}
                    {street !== 'RIVER' && trainingStage !== 'STAGE_1_PREFLOP' && (
                      <button
                        onClick={handleAdvanceNextStreet}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>推进下条街 ({street === 'FLOP' ? 'Turn 发转牌' : 'River 发河牌'})</span>
                      </button>
                    )}

                    <button
                      onClick={handleRequestAudit}
                      disabled={aiAuditLoading}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 border border-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>{aiAuditLoading ? 'Gemini 审计中...' : 'Gemini AI 深入诊所'}</span>
                    </button>

                    <button
                      onClick={() => dealNewHand()}
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
                            className={`h-full ${opt.action === 'FOLD' ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
