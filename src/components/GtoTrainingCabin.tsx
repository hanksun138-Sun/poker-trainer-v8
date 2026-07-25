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
  { id: 0, name: '你 (Hero)', type: 'HERO', avatar: '🧙‍♂️', styleLabel: 'GTO 学习者', borderColor: 'border-amber-500', bgColor: 'bg-amber-950/80', vpipPfr: 'VPIP 24% / PFR 19%', isOccupied: true },
  { id: 1, name: '毒蛇 Shark', type: 'AI_LAG', avatar: '🐍', styleLabel: '松凶 (LAG) 强攻击', borderColor: 'border-purple-500', bgColor: 'bg-purple-950/80', vpipPfr: 'VPIP 28% / PFR 23%', isOccupied: true },
  { id: 2, name: '石头 Rock', type: 'AI_NIT', avatar: '🪨', styleLabel: '紧弱 (NIT) 极其收敛', borderColor: 'border-blue-500', bgColor: 'bg-blue-950/80', vpipPfr: 'VPIP 14% / PFR 11%', isOccupied: true },
  { id: 3, name: '大鱼 Station', type: 'AI_FISH', avatar: '🐟', styleLabel: '松被动 (FISH) 站跟', borderColor: 'border-emerald-500', bgColor: 'bg-emerald-950/80', vpipPfr: 'VPIP 42% / PFR 8%', isOccupied: true },
  { id: 4, name: '规矩 Reg', type: 'AI_TAG', avatar: '🤖', styleLabel: '紧凶 (TAG) 标准 GTO', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-950/80', vpipPfr: 'VPIP 22% / PFR 18%', isOccupied: true },
  { id: 5, name: '疯子 Bully', type: 'AI_MANIAC', avatar: '🔥', styleLabel: '狂魔 (MANIAC) 重度诈唬', borderColor: 'border-rose-500', bgColor: 'bg-rose-950/80', vpipPfr: 'VPIP 55% / PFR 40%', isOccupied: true },
  { id: 6, name: '狐狸 Solver', type: 'AI_GTO', avatar: '🦊', styleLabel: '极化 Solver (GTO大师)', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-950/80', vpipPfr: 'VPIP 25% / PFR 21%', isOccupied: true },
  { id: 7, name: '刺猬 Whale', type: 'AI_WHALE', avatar: '🦔', styleLabel: '巨鲸 (WHALE) 盲目重注', borderColor: 'border-amber-400', bgColor: 'bg-amber-900/80', vpipPfr: 'VPIP 65% / PFR 35%', isOccupied: true },
  { id: 8, name: '狮子 Pro', type: 'AI_PRO', avatar: '🦁', styleLabel: '豪客牌手 (PRO) 顶级识破', borderColor: 'border-teal-500', bgColor: 'bg-teal-950/80', vpipPfr: 'VPIP 26% / PFR 22%', isOccupied: true },
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
  chosenOption: { label: string; freq: number; ev: number } | undefined,
  bestOption: { label: string; freq: number; ev: number },
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
    } else if (stage === 'STAGE_3_TURN') {
      reasoning = `转牌圈发出 [${boardStr.split(' ').slice(-1)}]，改变了双方的范围阻挡关系。Hero 坚持二弹 (Double Barrel) 成功隔离了对手的中等对子与抓诈牌。`;
      rangeLogic = `转牌高牌/威胁卡增强了 Hero 的极化范围 (Polarized Range)，强力下注将对手逼入极为艰难的抓诈考验。`;
      actionTip = `💡 转牌圈技巧：转牌是建立极化下注的关键街，适时使用 66%-125% 尺寸能大幅提升下注线期望值。`;
    } else if (stage === 'STAGE_4_RIVER') {
      reasoning = `河牌圈最终牌面 [${boardStr}] 下，Hero 的决策精准阻断了对手的坚果范围，或者精准抓到了对手的极化诈唬 (Bluff Jam)。`;
      rangeLogic = `河牌是绝对的极化与抓诈街 (Polarization vs Bluff Catcher)。阻挡牌 (Blocker) 的存在使得该动作拥有明确的净 EV 优势。`;
      actionTip = `💡 河牌圈技巧：关注你手牌中的 A/K/Q 阻挡效应。拥有关键阻挡牌时敢于推牌诈唬，能获得最高收益。`;
    }

    return { reasoning, rangeLogic, actionTip };
  } else {
    // Suboptimal or Wrong Action
    let reasoning = `在当前场景下，你的选择 [${chosenOption?.label || userAction}] 偏离了 Solver 的主导策略。`;
    let rangeLogic = `GTO Solver 更推荐选用 [${bestOption.label}] (推荐频率高达 ${(bestOption.freq * 100).toFixed(1)}%)。`;
    let actionTip = `💡 避坑建议：请注意评估手牌的阻挡效应与当前街的范围互补度，避免习惯性做出偏离 GTO 的动作。`;

    if (userAction === 'FOLD') {
      reasoning = `手牌 [${heroNotation}] 具备过高的权益与潜能，直接弃牌 (Fold) 放弃了正 EV 入局/跟注机会，属于典型的过度弃牌 (Over-folding) 漏洞。`;
      rangeLogic = `如果将此类手牌直接 Fold，你的整个防守范围将被对手的加注/下注无脑剥削 (Exploit)。`;
      actionTip = `💡 修正方案：遇到同花/顺子潜力手牌时，优先考虑 Call 平跟控池或 3-Bet 反击，切勿过早弃牌。`;
    } else if (userAction === 'CALL' && stage === 'STAGE_1_PREFLOP') {
      reasoning = `在翻前 [${heroPos}] 位置平跟 (Limp/Flat) 容易将底池主动权让给后位玩家，陷入被挤压加注 (Squeeze) 的被动局面。`;
      rangeLogic = `GTO 翻前策略在中前位极少使用平跟，应当使用 Raise 加注主动掌控底池，或直接 Fold 弃牌。`;
      actionTip = `💡 修正方案：翻前遵循 "Raise or Fold" 纪律，尽量避免在非盲注位置平跟。`;
    } else if (stage === 'STAGE_2_FLOP' && userAction === 'CHECK') {
      reasoning = `在翻牌圈 [${boardStr}]，Hero 放弃了主动下注，将免费转牌机会让给了 Villain，导致手牌权益被免费剥夺。`;
      rangeLogic = `当 Hero 拥有范围优势时，下注 33% Pot 能逼退对手大量高牌。Check 赋予了对手无代价看牌与反扑的空间。`;
      actionTip = `💡 修正方案：在干燥/高牌面主动持续下注 33% Pot，建立下注节奏。`;
    } else if (stage === 'STAGE_4_RIVER' && (userAction === 'ALL_IN' || userAction === 'CBET_150')) {
      reasoning = `在河牌圈 [${boardStr}] 无阻挡牌支持下过度下注/全下，容易被对手的成牌跟注，而只能逼退手牌强度远不如你的弃牌范围。`;
      rangeLogic = `下注需要明确是价值下注 (Value) 还是诈唬 (Bluff)。缺乏极化与阻挡效应的重注会导致严重长期漏水。`;
      actionTip = `💡 修正方案：在河牌圈重注前，确认手牌是否阻断了对手的跟注/强成牌范围。`;
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

const SIX_MAX_POSITIONS: Position[] = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

// Radial coordinates for 6-max seats around oval table
const SEAT_POSITIONS_MAP: Record<Position, { top: string; left: string }> = {
  UTG: { top: '16%', left: '30%' },
  HJ: { top: '16%', left: '70%' },
  CO: { top: '50%', left: '88%' },
  BTN: { top: '80%', left: '70%' },
  SB: { top: '80%', left: '30%' },
  BB: { top: '50%', left: '12%' },
};

// Initial mock data to give immediate visual mastery map context
const INITIAL_HAND_MASTERY_MAP: Record<string, HandMasteryData> = {
  'BTN_AA': { trials: 5, correct: 5, wrong: 0, evLoss: 0 },
  'BTN_KK': { trials: 4, correct: 4, wrong: 0, evLoss: 0 },
  'BTN_AKs': { trials: 3, correct: 3, wrong: 0, evLoss: 0 },
  'BTN_A5s': { trials: 3, correct: 1, wrong: 2, evLoss: 40 },
  'BTN_76s': { trials: 2, correct: 1, wrong: 1, evLoss: 25 },
  'BTN_KJo': { trials: 2, correct: 0, wrong: 2, evLoss: 60 },
  'BTN_QTo': { trials: 1, correct: 0, wrong: 1, evLoss: 30 },
  'BB_76o': { trials: 3, correct: 0, wrong: 3, evLoss: 90 },
};

export const GtoTrainingCabin: React.FC<GtoTrainingCabinProps> = ({
  currentUser,
  onRecordHandResult,
  onRequestAiAudit,
}) => {
  // 5-Stage Scenario progression state
  const [trainingStage, setTrainingStage] = useState<
    'STAGE_1_PREFLOP' | 'STAGE_2_FLOP' | 'STAGE_3_TURN' | 'STAGE_4_RIVER' | 'STAGE_5_CASINO_RING'
  >('STAGE_1_PREFLOP');

  const [preflopTargetPos, setPreflopTargetPos] = useState<Position | 'RANDOM_MIXED'>('BTN');
  const [heroPos, setHeroPos] = useState<Position>('BTN');
  const [villainPos, setVillainPos] = useState<Position>('BB');
  const [scenarioMode, setScenarioMode] = useState<
    'PREFLOP_RFI' | 'PREFLOP_BB_DEFENSE' | 'PREFLOP_VS_3BET' | 'POSTFLOP_MULTI_STREET'
  >('PREFLOP_RFI');

  // Stage 5 Real Casino Simulation State (6-Max, 9-Max Full Ring, or Dynamic Random Table)
  const [casinoTableFormat, setCasinoTableFormat] = useState<'6_MAX' | '9_MAX' | 'DYNAMIC_RANDOM'>('DYNAMIC_RANDOM');
  const [activeCasinoSeats, setActiveCasinoSeats] = useState<boolean[]>([
    true, true, true, true, true, true, true, true, true // 9 seats occupied by default
  ]);
  const [btnSeatIndex, setBtnSeatIndex] = useState<number>(0); // Dealer button seat index 0-8
  const [casinoBankrollBB, setCasinoBankrollBB] = useState<number>(100.0);
  const [casinoHandsPlayed, setCasinoHandsPlayed] = useState<number>(0);
  const [casinoProfitBB, setCasinoProfitBB] = useState<number>(0);
  const [casinoRecentDialogue, setCasinoRecentDialogue] = useState<string>(
    '🎰 赌场发牌员: "欢迎来到 Las Vegas 真实 9-Max / 6-Max 动态现金桌！Button 顺时针每手旋转，牌桌人数随时变动，请入座！"'
  );

  // Adaptive Drill Mode State ('ADAPTIVE' vs 'RANDOM')
  const [drillMode, setDrillMode] = useState<'ADAPTIVE' | 'RANDOM'>('ADAPTIVE');

  // Toggle 169 Hand Mastery Matrix Panel
  const [showMasteryMatrix, setShowMasteryMatrix] = useState<boolean>(true);

  // Postflop Texture / Scenario Filter States for Stage 2, Stage 3, Stage 4
  const [postflopTargetFlop, setPostflopTargetFlop] = useState<'ALL_MIXED' | 'A_HIGH_DRY' | 'K_HIGH_DRY' | 'PAIRED_DRY' | 'WET_CONNECTOR' | 'MONOTONE'>('ALL_MIXED');
  const [postflopTargetTurn, setPostflopTargetTurn] = useState<'ALL_MIXED' | 'TURN_OVERCARD' | 'TURN_BRICK' | 'TURN_FLUSH_COMPLETE' | 'TURN_PAIRED'>('ALL_MIXED');
  const [postflopTargetRiver, setPostflopTargetRiver] = useState<'ALL_MIXED' | 'RIVER_VALUE_NUT' | 'RIVER_BLUFF_JAM' | 'RIVER_HERO_CALL' | 'RIVER_BLOCKBET'>('ALL_MIXED');

  // Postflop Texture Mastery Records (Key: `FLOP_A_HIGH_DRY`, `TURN_OVERCARD`, `RIVER_BLUFF_JAM` etc.)
  const [postflopMasteryMap, setPostflopMasteryMap] = useState<Record<string, HandMasteryData>>({
    'FLOP_A_HIGH_DRY': { trials: 14, correct: 12, wrong: 2, evLoss: 25 },
    'FLOP_K_HIGH_DRY': { trials: 10, correct: 9, wrong: 1, evLoss: 15 },
    'FLOP_PAIRED_DRY': { trials: 16, correct: 15, wrong: 1, evLoss: 10 },
    'FLOP_WET_CONNECTOR': { trials: 22, correct: 13, wrong: 9, evLoss: 135 },
    'FLOP_MONOTONE': { trials: 15, correct: 9, wrong: 6, evLoss: 90 },
    'TURN_OVERCARD': { trials: 18, correct: 10, wrong: 8, evLoss: 110 },
    'TURN_BRICK': { trials: 12, correct: 11, wrong: 1, evLoss: 10 },
    'TURN_FLUSH_COMPLETE': { trials: 14, correct: 9, wrong: 5, evLoss: 75 },
    'TURN_PAIRED': { trials: 10, correct: 9, wrong: 1, evLoss: 15 },
    'RIVER_VALUE_NUT': { trials: 18, correct: 17, wrong: 1, evLoss: 10 },
    'RIVER_BLUFF_JAM': { trials: 15, correct: 8, wrong: 7, evLoss: 125 },
    'RIVER_HERO_CALL': { trials: 14, correct: 5, wrong: 9, evLoss: 155 },
    'RIVER_BLOCKBET': { trials: 12, correct: 10, wrong: 2, evLoss: 25 },
  });

  // Hand Mastery Records (Key: `${pos}_${handNotation}`)
  const [handMasteryMap, setHandMasteryMap] = useState<Record<string, HandMasteryData>>(INITIAL_HAND_MASTERY_MAP);

  // Cumulative Session Statistics State
  const [sessionStats, setSessionStats] = useState({
    totalHands: 0,
    correctHands: 0,
    evLossMBB: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  // Active Hand State
  const [heroCards, setHeroCards] = useState<[Card, Card]>([
    { rank: 'A', suit: 's' },
    { rank: '5', suit: 's' },
  ]);
  const [boardCards, setBoardCards] = useState<Card[]>([
    { rank: 'A', suit: 's' },
    { rank: '7', suit: 'd' },
    { rank: '2', suit: 'c' },
  ]);
  const [potSize, setPotSize] = useState<number>(5.5);
  const [street, setStreet] = useState<'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER'>('FLOP');

  // Decision feedback & Log history
  const [userAction, setUserAction] = useState<ActionType | null>(null);
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    isOptimal: boolean;
    evLossMBB: number;
    message: string;
    optimalActionLabel: string;
    explanation?: { reasoning: string; rangeLogic: string; actionTip: string };
  } | null>(null);

  // Hand log history for stage summary analysis
  const [stageHandLogs, setStageHandLogs] = useState<HandLogItem[]>([]);
  const [showStageSummaryModal, setShowStageSummaryModal] = useState<boolean>(false);
  const [summaryFilterStage, setSummaryFilterStage] = useState<string>('ALL');

  // Gemini AI inline audit result
  const [aiAuditLoading, setAiAuditLoading] = useState<boolean>(false);
  const [aiAuditResult, setAiAuditResult] = useState<GtoAuditResponse | null>(null);

  // Weighted adaptive card sampler prioritizing mistakes and gray zones
  const drawAdaptiveCardCombo = (pos: Position, excludeCards: Card[] = []): { cards: [Card, Card]; handNotation: string; status: string } => {
    const allNames = get169HandNames().flat();
    const weightedList: { notation: string; weight: number; status: string }[] = [];

    allNames.forEach((notation) => {
      const key = `${pos}_${notation}`;
      const record = handMasteryMap[key];
      const status = getHandMasteryStatus(record);

      let weight = 3; // UNTESTED
      if (status === 'NEEDS_WORK') weight = 12; // 🔴 High priority mistake drill
      if (status === 'GRAY_ZONE') weight = 6;   // 🟡 Medium priority gray zone
      if (status === 'MASTERED') weight = 1;    // 🟢 Lower priority (already mastered)

      weightedList.push({ notation, weight, status });
    });

    const totalWeight = weightedList.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * totalWeight;

    let chosenItem = weightedList[0];
    for (const item of weightedList) {
      if (rand < item.weight) {
        chosenItem = item;
        break;
      }
      rand -= item.weight;
    }

    const cards = generateCardComboForNotation(chosenItem.notation, excludeCards);
    return { cards, handNotation: chosenItem.notation, status: chosenItem.status };
  };

  // Drill specific hand directly selected from matrix
  const drillSpecificHand = (handNotation: string) => {
    const cards = generateCardComboForNotation(handNotation);
    setHeroCards(cards);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);
  };

  // Deal a new hand (adaptive or random with Stage logic)
  const dealNewHand = () => {
    let newHero: [Card, Card];
    let drawnNotation = '';

    // Determine active position for Stages 1, 2, 3, 4
    let activePos: Position = 'BTN';
    if (preflopTargetPos === 'RANDOM_MIXED') {
      const sixPos: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      activePos = sixPos[Math.floor(Math.random() * sixPos.length)];
    } else {
      activePos = preflopTargetPos;
    }

    if (drillMode === 'ADAPTIVE') {
      const res = drawAdaptiveCardCombo(activePos);
      newHero = res.cards;
      drawnNotation = res.handNotation;
    } else {
      newHero = drawRandomCardCombo();
      drawnNotation = getHandNotationFromCards(newHero[0], newHero[1]);
    }

    setHeroCards(newHero);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);

    const flopBoard = FLOP_BOARDS[0].cards; // A♠ 7♦ 2♣
    const turnCard: Card = { rank: 'K', suit: 'd' };
    const riverCard: Card = { rank: 'Q', suit: 's' };

    const villainPosMap: Record<Position, Position> = {
      BTN: 'BB',
      CO: 'BB',
      HJ: 'BTN',
      UTG: 'BB',
      SB: 'BB',
      BB: 'BTN',
    };

    if (trainingStage === 'STAGE_5_CASINO_RING') {
      let currentSeatsOccupied = [...activeCasinoSeats];

      // Format Enforcement & Dynamic Seats Fluctuation
      if (casinoTableFormat === '6_MAX') {
        currentSeatsOccupied = [true, true, true, true, true, true, false, false, false];
      } else if (casinoTableFormat === '9_MAX') {
        currentSeatsOccupied = [true, true, true, true, true, true, true, true, true];
      } else if (casinoTableFormat === 'DYNAMIC_RANDOM') {
        // Random player arrival / departure fluctuation
        if (Math.random() < 0.45) {
          const targetSeat = Math.floor(Math.random() * 8) + 1; // Seats 1-8 (Seat 0 Hero always stays)
          const targetSeatInfo = ALL_CASINO_SEATS[targetSeat];
          const isJoining = !currentSeatsOccupied[targetSeat];
          currentSeatsOccupied[targetSeat] = isJoining;

          const occupiedCount = currentSeatsOccupied.filter(Boolean).length;
          if (isJoining) {
            setCasinoRecentDialogue(`🎰 赌场广播: ${targetSeat}号位 [${targetSeatInfo.avatar} ${targetSeatInfo.name}] 携带 200BB 筹码买入坐下！当前桌上 ${occupiedCount} 人在座。`);
          } else {
            setCasinoRecentDialogue(`🎰 赌场广播: ${targetSeat}号位 [${targetSeatInfo.avatar} ${targetSeatInfo.name}] 输光离场，等待新对手... 当前桌上 ${occupiedCount} 人。`);
          }
        }
      }
      setActiveCasinoSeats(currentSeatsOccupied);

      // Rotate Button among occupied seats
      let nextBtnIdx = (btnSeatIndex + 1) % 9;
      while (!currentSeatsOccupied[nextBtnIdx]) {
        nextBtnIdx = (nextBtnIdx + 1) % 9;
      }
      setBtnSeatIndex(nextBtnIdx);
      setCasinoHandsPlayed((h) => h + 1);

      // Position mapping by distance from BTN (Hero is seat 0)
      const heroSeatIdx = 0;
      let distFromBtn = 0;
      let checkSeat = nextBtnIdx;
      while (checkSeat !== heroSeatIdx) {
        if (currentSeatsOccupied[checkSeat]) {
          distFromBtn++;
        }
        checkSeat = (checkSeat + 1) % 9;
      }

      const totalOccupied = currentSeatsOccupied.filter(Boolean).length;
      const posMapByDist9: Position[] = ['BTN', 'SB', 'BB', 'UTG', 'UTG', 'HJ', 'HJ', 'CO', 'CO'];
      const currentHeroPos = posMapByDist9[distFromBtn % totalOccupied] || 'BTN';
      setHeroPos(currentHeroPos);
      setVillainPos(villainPosMap[currentHeroPos] || 'BB');

      // Board texture determination based on user selection
      let curFlopBoard: Card[] = FLOP_BOARDS[0].cards;
      if (postflopTargetFlop === 'K_HIGH_DRY') {
        curFlopBoard = FLOP_BOARDS[1].cards;
      } else if (postflopTargetFlop === 'PAIRED_DRY') {
        curFlopBoard = FLOP_BOARDS[2].cards;
      } else if (postflopTargetFlop === 'WET_CONNECTOR') {
        curFlopBoard = FLOP_BOARDS[3].cards;
      } else if (postflopTargetFlop === 'MONOTONE') {
        curFlopBoard = FLOP_BOARDS[4].cards;
      } else if (postflopTargetFlop === 'ALL_MIXED') {
        const randBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)];
        curFlopBoard = randBoard.cards;
      }

      let curTurnCard: Card = { rank: 'K', suit: 'd' };
      if (postflopTargetTurn === 'TURN_OVERCARD') {
        curTurnCard = { rank: 'A', suit: 's' };
      } else if (postflopTargetTurn === 'TURN_BRICK') {
        curTurnCard = { rank: '2', suit: 'd' };
      } else if (postflopTargetTurn === 'TURN_FLUSH_COMPLETE') {
        curTurnCard = { rank: '9', suit: 's' };
      } else if (postflopTargetTurn === 'TURN_PAIRED') {
        curTurnCard = { rank: '7', suit: 'h' };
      }

      let curRiverCard: Card = { rank: 'Q', suit: 's' };
      if (postflopTargetRiver === 'RIVER_VALUE_NUT') {
        curRiverCard = { rank: 'A', suit: 'h' };
      } else if (postflopTargetRiver === 'RIVER_BLUFF_JAM') {
        curRiverCard = { rank: '4', suit: 's' };
      } else if (postflopTargetRiver === 'RIVER_HERO_CALL') {
        curRiverCard = { rank: '2', suit: 'd' };
      } else if (postflopTargetRiver === 'RIVER_BLOCKBET') {
        curRiverCard = { rank: '3', suit: 'c' };
      }

      // Randomly pick street for real casino diversity
      const randStreet = Math.random();
      if (randStreet < 0.25) {
        setBoardCards([]);
        setPotSize(2.5);
        setStreet('PREFLOP');
      } else if (randStreet < 0.55) {
        setBoardCards(curFlopBoard);
        setPotSize(5.5);
        setStreet('FLOP');
      } else if (randStreet < 0.80) {
        setBoardCards([...curFlopBoard, curTurnCard]);
        setPotSize(12.0);
        setStreet('TURN');
      } else {
        setBoardCards([...curFlopBoard, curTurnCard, curRiverCard]);
        setPotSize(22.5);
        setStreet('RIVER');
      }
    } else if (trainingStage === 'STAGE_4_RIVER') {
      let curFlopBoard: Card[] = FLOP_BOARDS[0].cards;
      if (postflopTargetFlop === 'K_HIGH_DRY') curFlopBoard = FLOP_BOARDS[1].cards;
      else if (postflopTargetFlop === 'PAIRED_DRY') curFlopBoard = FLOP_BOARDS[2].cards;
      else if (postflopTargetFlop === 'WET_CONNECTOR') curFlopBoard = FLOP_BOARDS[3].cards;
      else if (postflopTargetFlop === 'MONOTONE') curFlopBoard = FLOP_BOARDS[4].cards;
      else if (postflopTargetFlop === 'ALL_MIXED') curFlopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)].cards;

      let curTurnCard: Card = { rank: 'K', suit: 'd' };
      if (postflopTargetTurn === 'TURN_OVERCARD') curTurnCard = { rank: 'A', suit: 's' };
      else if (postflopTargetTurn === 'TURN_BRICK') curTurnCard = { rank: '2', suit: 'd' };
      else if (postflopTargetTurn === 'TURN_FLUSH_COMPLETE') curTurnCard = { rank: '9', suit: 's' };
      else if (postflopTargetTurn === 'TURN_PAIRED') curTurnCard = { rank: '7', suit: 'h' };

      let curRiverCard: Card = { rank: 'Q', suit: 's' };
      if (postflopTargetRiver === 'RIVER_VALUE_NUT') curRiverCard = { rank: 'A', suit: 'h' };
      else if (postflopTargetRiver === 'RIVER_BLUFF_JAM') curRiverCard = { rank: '4', suit: 's' };
      else if (postflopTargetRiver === 'RIVER_HERO_CALL') curRiverCard = { rank: '2', suit: 'd' };
      else if (postflopTargetRiver === 'RIVER_BLOCKBET') curRiverCard = { rank: '3', suit: 'c' };

      let hero = newHero;
      const fullBoard = [...curFlopBoard, curTurnCard, curRiverCard];
      if (hero.some(c => fullBoard.some(b => b.rank === c.rank && b.suit === c.suit))) {
        hero = generateCardComboForNotation(drawnNotation || getHandNotationFromCards(newHero[0], newHero[1]), fullBoard);
        setHeroCards(hero);
      }
      setBoardCards(fullBoard);
      setPotSize(18.5);
      setStreet('RIVER');
      setHeroPos(activePos);
      setVillainPos(villainPosMap[activePos] || 'BB');
    } else if (trainingStage === 'STAGE_3_TURN') {
      let curFlopBoard: Card[] = FLOP_BOARDS[0].cards;
      if (postflopTargetFlop === 'K_HIGH_DRY') curFlopBoard = FLOP_BOARDS[1].cards;
      else if (postflopTargetFlop === 'PAIRED_DRY') curFlopBoard = FLOP_BOARDS[2].cards;
      else if (postflopTargetFlop === 'WET_CONNECTOR') curFlopBoard = FLOP_BOARDS[3].cards;
      else if (postflopTargetFlop === 'MONOTONE') curFlopBoard = FLOP_BOARDS[4].cards;
      else if (postflopTargetFlop === 'ALL_MIXED') curFlopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)].cards;

      let curTurnCard: Card = { rank: 'K', suit: 'd' };
      if (postflopTargetTurn === 'TURN_OVERCARD') curTurnCard = { rank: 'A', suit: 's' };
      else if (postflopTargetTurn === 'TURN_BRICK') curTurnCard = { rank: '2', suit: 'd' };
      else if (postflopTargetTurn === 'TURN_FLUSH_COMPLETE') curTurnCard = { rank: '9', suit: 's' };
      else if (postflopTargetTurn === 'TURN_PAIRED') curTurnCard = { rank: '7', suit: 'h' };

      let hero = newHero;
      const fourBoard = [...curFlopBoard, curTurnCard];
      if (hero.some(c => fourBoard.some(b => b.rank === c.rank && b.suit === c.suit))) {
        hero = generateCardComboForNotation(drawnNotation || getHandNotationFromCards(newHero[0], newHero[1]), fourBoard);
        setHeroCards(hero);
      }
      setBoardCards(fourBoard);
      setPotSize(10.5);
      setStreet('TURN');
      setHeroPos(activePos);
      setVillainPos(villainPosMap[activePos] || 'BB');
    } else if (trainingStage === 'STAGE_2_FLOP') {
      let curFlopBoard: Card[] = FLOP_BOARDS[0].cards;
      if (postflopTargetFlop === 'K_HIGH_DRY') curFlopBoard = FLOP_BOARDS[1].cards;
      else if (postflopTargetFlop === 'PAIRED_DRY') curFlopBoard = FLOP_BOARDS[2].cards;
      else if (postflopTargetFlop === 'WET_CONNECTOR') curFlopBoard = FLOP_BOARDS[3].cards;
      else if (postflopTargetFlop === 'MONOTONE') curFlopBoard = FLOP_BOARDS[4].cards;
      else if (postflopTargetFlop === 'ALL_MIXED') curFlopBoard = FLOP_BOARDS[Math.floor(Math.random() * FLOP_BOARDS.length)].cards;

      let hero = newHero;
      if (hero.some(c => curFlopBoard.some(b => b.rank === c.rank && b.suit === c.suit))) {
        hero = generateCardComboForNotation(drawnNotation || getHandNotationFromCards(newHero[0], newHero[1]), curFlopBoard);
        setHeroCards(hero);
      }
      setBoardCards(curFlopBoard);
      setPotSize(5.5);
      setStreet('FLOP');
      setHeroPos(activePos);
      setVillainPos(villainPosMap[activePos] || 'BB');
    } else {
      // Stage 1 Preflop
      setBoardCards([]);
      setPotSize(1.5);
      setStreet('PREFLOP');
      setHeroPos(activePos);
      setVillainPos(activePos === 'BB' ? 'BTN' : 'BB');
      setScenarioMode(activePos === 'BB' ? 'PREFLOP_BB_DEFENSE' : 'PREFLOP_RFI');
    }
  };

  useEffect(() => {
    dealNewHand();
  }, [trainingStage, scenarioMode]);

  // Deal Turn Card (4th card)
  const dealTurnCard = () => {
    if (boardCards.length < 3) return;
    const turnCardPool: Card[] = [
      { rank: 'K', suit: 'd' },
      { rank: '8', suit: 's' },
      { rank: 'J', suit: 'c' },
      { rank: '4', suit: 'h' },
    ];
    const turn = turnCardPool[Math.floor(Math.random() * turnCardPool.length)];
    setBoardCards((prev) => (prev.length === 3 ? [...prev, turn] : prev));
    setStreet('TURN');
    setPotSize((p) => p + 4.0);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);
  };

  // Deal River Card (5th card)
  const dealRiverCard = () => {
    if (boardCards.length < 4) return;
    const riverCardPool: Card[] = [
      { rank: 'Q', suit: 's' },
      { rank: '3', suit: 'd' },
      { rank: '9', suit: 'c' },
      { rank: 'T', suit: 'h' },
    ];
    const river = riverCardPool[Math.floor(Math.random() * riverCardPool.length)];
    setBoardCards((prev) => (prev.length === 4 ? [...prev, river] : prev));
    setStreet('RIVER');
    setPotSize((p) => p + 8.5);
    setUserAction(null);
    setIsEvaluated(false);
    setEvalResult(null);
    setAiAuditResult(null);
  };

  const heroNotation = getHandNotationFromCards(heroCards[0], heroCards[1]);

  const getGtoActionOptions = () => {
    if (street === 'FLOP' || trainingStage === 'STAGE_2_FLOP') {
      const handStrat = TEXAS_SOLVER_A_DRY_BTNVsBB.handStrategies[heroNotation] || {
        cbet33: 0.50,
        cbet75: 0.20,
        check: 0.20,
        ev: 1.5,
      };

      return [
        { action: 'CBET_33' as ActionType, label: 'Flop 下注 33% Pot (小注打频)', freq: handStrat.cbet33 || 0.40, ev: handStrat.ev },
        { action: 'CBET_75' as ActionType, label: 'Flop 下注 75% Pot (重注极化)', freq: handStrat.cbet75 || 0.25, ev: handStrat.ev - 0.05 },
        { action: 'RAISE_3' as ActionType, label: 'Flop 加注 Raise 3.0x (Check-Raise 反击)', freq: 0.12, ev: handStrat.ev - 0.10 },
        { action: 'ALL_IN' as ActionType, label: 'Flop 极化推牌 All-In (深筹极化 Shove)', freq: 0.05, ev: handStrat.ev - 0.25 },
        { action: 'CALL' as ActionType, label: '跟注 Call (平跟控池)', freq: 0.08, ev: handStrat.ev - 0.15 },
        { action: 'CHECK' as ActionType, label: 'Flop 过牌 Check', freq: handStrat.check || 0.10, ev: handStrat.ev - 0.20 },
      ];
    } else if (street === 'TURN' || trainingStage === 'STAGE_3_TURN') {
      return [
        { action: 'CBET_33' as ActionType, label: 'Turn 小注试探 33% Pot', freq: 0.20, ev: 2.6 },
        { action: 'CBET_66' as ActionType, label: 'Turn 标准二弹 66% Pot', freq: 0.40, ev: 2.9 },
        { action: 'CBET_125' as ActionType, label: 'Turn 超额下注 Overbet 125%', freq: 0.15, ev: 2.7 },
        { action: 'RAISE_3' as ActionType, label: 'Turn 加注 Raise 3.0x (转牌反打)', freq: 0.08, ev: 2.4 },
        { action: 'ALL_IN' as ActionType, label: 'Turn 提前全下 All-In (极化 Jam)', freq: 0.07, ev: 2.2 },
        { action: 'CALL' as ActionType, label: 'Turn 平跟 / Float Call', freq: 0.05, ev: 2.1 },
        { action: 'CHECK' as ActionType, label: 'Turn 控池过牌 Check', freq: 0.05, ev: 2.0 },
      ];
    } else if (street === 'RIVER' || trainingStage === 'STAGE_4_RIVER') {
      return [
        { action: 'CBET_33' as ActionType, label: 'River 抓薄价值 Block Bet 33%', freq: 0.15, ev: 4.8 },
        { action: 'CBET_75' as ActionType, label: 'River 标准价值 75% Pot', freq: 0.35, ev: 5.8 },
        { action: 'CBET_150' as ActionType, label: 'River 极化超额 150% Overbet', freq: 0.15, ev: 5.5 },
        { action: 'RAISE_3' as ActionType, label: 'River 强力加注 Raise 3.0x', freq: 0.05, ev: 4.5 },
        { action: 'ALL_IN' as ActionType, label: 'River 极化三弹 All-In (推牌 Shove)', freq: 0.18, ev: 5.4 },
        { action: 'CALL' as ActionType, label: 'River 抓诈跟注 Hero Call', freq: 0.07, ev: 4.2 },
        { action: 'CHECK' as ActionType, label: 'River 摊牌 Check', freq: 0.05, ev: 4.0 },
      ];
    } else if (scenarioMode === 'PREFLOP_RFI') {
      const positionMap = DEFAULT_RANGE_CONVERTER_PROFILE.matrixData[heroPos] || {};
      const freqs = positionMap[heroNotation] || { fold: 0.8, raise2_5: 0.2 };

      if (heroPos === 'SB') {
        return [
          { action: 'RAISE_2_5' as ActionType, label: '加注 2.5x BB (SB Open)', freq: freqs.raise2_5 || 0.15, ev: 0.4 },
          { action: 'RAISE_3' as ActionType, label: '加注 3.0x BB (SB Strong Open)', freq: freqs.raise3 || 0.25, ev: 0.5 },
          { action: 'ALL_IN' as ActionType, label: '极化全下 Push All-In (短筹码 15BB)', freq: 0.05, ev: 0.1 },
          { action: 'CALL' as ActionType, label: '平跟 Call (SB Limp 1.0BB)', freq: freqs.call || 0.20, ev: 0.3 },
          { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: freqs.fold || 0.35, ev: 0.0 },
        ];
      }

      return [
        { action: 'RAISE_2' as ActionType, label: '微型加注 2.0x BB (Mini-Open)', freq: 0.10, ev: 0.3 },
        { action: 'RAISE_2_5' as ActionType, label: '标准加注 2.5x BB (Standard Open)', freq: freqs.raise2_5 || freqs.raise3 || 0.35, ev: 0.5 },
        { action: 'RAISE_3' as ActionType, label: '强力加注 3.0x BB (Strong Open)', freq: freqs.raise3 || 0.15, ev: 0.4 },
        { action: 'ALL_IN' as ActionType, label: '短筹码 Push/Fold All-In', freq: 0.02, ev: -0.2 },
        { action: 'CALL' as ActionType, label: '平跟 Call (Limp 防守)', freq: 0.03, ev: -0.1 },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: freqs.fold || 0.35, ev: 0.0 },
      ];
    } else if (scenarioMode === 'PREFLOP_VS_3BET') {
      return [
        { action: 'FOUR_BET' as ActionType, label: '4-Bet 强力加注 (25BB)', freq: 0.20, ev: 1.5 },
        { action: 'ALL_IN' as ActionType, label: '5-Bet Jam / All-In (100BB 极化推牌)', freq: 0.08, ev: 1.1 },
        { action: 'CALL' as ActionType, label: '平跟跟注 Call (Call 3-Bet)', freq: 0.38, ev: 0.9 },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: 0.34, ev: 0.0 },
      ];
    } else {
      // BB Defense
      const bbMap = DEFAULT_RANGE_CONVERTER_PROFILE.matrixData['BB'] || {};
      const freqs = bbMap[heroNotation] || { fold: 0.5, call: 0.5 };

      return [
        { action: 'THREE_BET' as ActionType, label: '3-Bet 反击加注 (10BB)', freq: freqs.threeBet || 0.18, ev: 0.8 },
        { action: 'ALL_IN' as ActionType, label: '3-Bet Shove 全下 All-In (短筹码反击)', freq: 0.05, ev: 0.4 },
        { action: 'CALL' as ActionType, label: '平跟跟注 Call (2.5BB 捍卫盲注)', freq: freqs.call || 0.45, ev: 0.3 },
        { action: 'FOLD' as ActionType, label: '弃牌 Fold', freq: freqs.fold || 0.32, ev: 0.0 },
      ];
    }
  };

  const options = getGtoActionOptions();

  const handleSelectAction = (action: ActionType) => {
    if (isEvaluated) return;
    setUserAction(action);
    setIsEvaluated(true);

    const chosenOption = options.find(o => o.action === action);
    const bestOption = [...options].sort((a, b) => b.freq - a.freq)[0];

    const isOptimal = (chosenOption?.freq || 0) >= 0.25;
    const evLoss = isOptimal ? 0 : Math.round(((bestOption.freq - (chosenOption?.freq || 0)) * 150));

    // Update Hand Mastery Map for current position + hand notation
    const key = `${heroPos}_${heroNotation}`;
    let newStatusBadge = '';

    setHandMasteryMap((prev) => {
      const existing = prev[key] || { trials: 0, correct: 0, wrong: 0, evLoss: 0 };
      const updated: HandMasteryData = {
        trials: existing.trials + 1,
        correct: existing.correct + (isOptimal ? 1 : 0),
        wrong: existing.wrong + (isOptimal ? 0 : 1),
        evLoss: existing.evLoss + evLoss,
      };

      const newAcc = Math.round((updated.correct / updated.trials) * 100);
      const newStatus = getHandMasteryStatus(updated);

      if (newStatus === 'MASTERED') {
        newStatusBadge = `🟢 手牌 [${heroNotation}] 达标已掌握 (${newAcc}%)`;
      } else if (newStatus === 'GRAY_ZONE') {
        newStatusBadge = `🟡 手牌 [${heroNotation}] 进入灰色地带 (${newAcc}%)`;
      } else {
        newStatusBadge = `🔴 手牌 [${heroNotation}] 标记为高频错题 (${newAcc}%)`;
      }

      return { ...prev, [key]: updated };
    });

    // Update Postflop Mastery Map
    const postflopKey =
      trainingStage === 'STAGE_2_FLOP'
        ? `FLOP_${postflopTargetFlop === 'ALL_MIXED' ? 'WET_CONNECTOR' : postflopTargetFlop}`
        : trainingStage === 'STAGE_3_TURN'
        ? `TURN_${postflopTargetTurn === 'ALL_MIXED' ? 'TURN_OVERCARD' : postflopTargetTurn}`
        : trainingStage === 'STAGE_4_RIVER'
        ? `RIVER_${postflopTargetRiver === 'ALL_MIXED' ? 'RIVER_HERO_CALL' : postflopTargetRiver}`
        : null;

    if (postflopKey) {
      setPostflopMasteryMap((prev) => {
        const existing = prev[postflopKey] || { trials: 0, correct: 0, wrong: 0, evLoss: 0 };
        return {
          ...prev,
          [postflopKey]: {
            trials: existing.trials + 1,
            correct: existing.correct + (isOptimal ? 1 : 0),
            wrong: existing.wrong + (isOptimal ? 0 : 1),
            evLoss: existing.evLoss + evLoss,
          },
        };
      });
    }

    // Cumulative session stats updating
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

    // Stage 5 Casino Challenge Bankroll & Dialogue update
    if (trainingStage === 'STAGE_5_CASINO_RING') {
      const potBonus = isOptimal ? Math.round(potSize * 0.8) : -Math.round(potSize * 0.7);
      setCasinoProfitBB((p) => p + potBonus);
      setCasinoBankrollBB((b) => Math.max(0, b + potBonus));

      const activeOpponent = ALL_CASINO_SEATS[(btnSeatIndex + 1) % ALL_CASINO_SEATS.length];
      let quote = '';
      if (activeOpponent.type === 'AI_FISH') {
        quote = isOptimal
          ? `🐟 大鱼 Station: "哎呀，跟注到底还是输了...你的打法太抓人了！"`
          : `🐟 大鱼 Station: "哈哈！管你什么 GTO，我这对底牌照样跟到底收下！"`;
      } else if (activeOpponent.type === 'AI_MANIAC') {
        quote = isOptimal
          ? `🔥 疯子 Bully: "切！居然被你识破我的假下注！下一把看我加倍打回来！"`
          : `🔥 疯子 Bully: "看到没有！全下的气势就能把你吓退！这个底池归我了！"`;
      } else if (activeOpponent.type === 'AI_NIT') {
        quote = isOptimal
          ? `🪨 石头 Rock: "没有 AA/KK/AK 的话，这坑我绝对不跳，Fold 保命。"`
          : `🪨 石头 Rock: "你的下注露出了破绽，我的高超对轻轻松松收池。"`;
      } else if (activeOpponent.type === 'AI_LAG') {
        quote = isOptimal
          ? `🐍 毒蛇 Shark: "不错的抓诈选择，防守范围很规范，算你厉害。"`
          : `🐍 毒蛇 Shark: "你的防守频率不够！我的持续挤压让你白白丢了底池！"`;
      } else if (activeOpponent.type === 'AI_GTO') {
        quote = isOptimal
          ? `🦊 狐狸 Solver: "精准符合 100BB GTO 求解器期望值，策略极其平衡！"`
          : `🦊 狐狸 Solver: "你的混和频率在此场景下偏移了 0.18 EV，被我成功剥削。"`;
      } else if (activeOpponent.type === 'AI_WHALE') {
        quote = isOptimal
          ? `🦔 刺猬 Whale: "啧，这次没诈唬成功！下一把我要带 500BB 全下！"`
          : `🦔 刺猬 Whale: "这才叫德州扑克！大把筹码收进来的感觉太爽了！"`;
      } else if (activeOpponent.type === 'AI_PRO') {
        quote = isOptimal
          ? `🦁 狮子 Pro: "非常严密的下注构建，没有露出半点范围漏洞。" `
          : `🦁 狮子 Pro: "你的阻挡牌思考出现了漏洞，被我精准读牌抓住！"`;
      } else {
        quote = isOptimal
          ? `🤖 规矩 Reg: "动作标准符合 GTO 最优期望值，完美规避了 EV 漏水！"`
          : `🤖 规矩 Reg: "你的决策偏离了标准 GTO，产生了显著的 EV 漏水。"`;
      }
      setCasinoRecentDialogue(quote);
    }

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

    setStageHandLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
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
      },
      ...prev,
    ]);

    setEvalResult({
      isOptimal,
      evLossMBB: evLoss,
      message: isOptimal
        ? `✅ 当场判定正确！满足 GTO 建议策略 (频率 ${(chosenOption?.freq ? (chosenOption.freq * 100).toFixed(1) : 0)}%)`
        : `❌ 当场判定偏离！Solver 推荐动作: ${bestOption.label} (${(bestOption.freq * 100).toFixed(1)}%)`,
      optimalActionLabel: newStatusBadge ? `${bestOption.label} • ${newStatusBadge}` : bestOption.label,
      explanation,
    });

    onRecordHandResult({
      isCorrect: isOptimal,
      evLossMBB: evLoss,
      leakTag: !isOptimal ? `Suboptimal ${action} on ${heroNotation}` : undefined,
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
          gtoOptimalActions: options.map(o => ({ action: o.label, frequency: o.freq, ev: o.ev })),
        },
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
        setAiAuditResult(data.audit);
      } else {
        throw new Error(data.error || 'Audit request failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gemini AI 审计失败: ' + err.message);
    } finally {
      setAiAuditLoading(false);
    }
  };

  const accuracyPercent = sessionStats.totalHands > 0
    ? Math.round((sessionStats.correctHands / sessionStats.totalHands) * 100)
    : 100;

  return (
    <div className="space-y-6">
      
      {/* Cumulative Live Session Analytics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>当场累计训练实操统计分析</span>
              <span className="text-[11px] font-mono font-normal text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md">
                实战实时监控
              </span>
            </h3>
            <p className="text-xs text-slate-400">实时计算决策准确度、EV 漏水与漏洞归因</p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs w-full md:w-auto justify-between md:justify-end">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[80px]">
            <span className="text-[10px] text-slate-400 block">训练手牌</span>
            <span className="text-slate-200 font-bold text-sm">{sessionStats.totalHands} 手</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 block">当场准确率</span>
            <span className={`font-black text-sm ${accuracyPercent >= 80 ? 'text-emerald-400' : accuracyPercent >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {accuracyPercent}%
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 block">累积 EV 损耗</span>
            <span className="text-rose-400 font-bold text-sm">-{sessionStats.evLossMBB} mBB</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[80px]">
            <span className="text-[10px] text-slate-400 block">连胜/最高</span>
            <span className="text-amber-400 font-bold text-sm">
              🔥 {sessionStats.currentStreak} / {sessionStats.bestStreak}
            </span>
          </div>

          <button
            onClick={() => setSessionStats({ totalHands: 0, correctHands: 0, evLossMBB: 0, currentStreak: 0, bestStreak: 0 })}
            title="重置当场统计"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Realistic Oval Poker Table Canvas */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 md:p-4 shadow-2xl flex flex-col justify-between my-1 w-full">
        
        {/* Table Felt Green Oval Container */}
        <div className="relative w-full max-w-5xl mx-auto aspect-[1.8/1] sm:aspect-[2.2/1] min-h-[260px] sm:min-h-[320px] md:min-h-[370px] lg:min-h-[410px] max-h-[52vh] bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-950 rounded-[50px] sm:rounded-[120px] md:rounded-[180px] border-[6px] sm:border-[12px] md:border-[16px] border-amber-950/90 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-1.5 sm:p-3 my-1">
          
          {/* Inner Table Trim Line */}
          <div className="absolute inset-2 sm:inset-3 rounded-[40px] sm:rounded-[110px] border border-emerald-500/25 pointer-events-none" />

          {/* Center Board & Pot Display */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            
            {/* Main Pot Chips Badge */}
            <div className="px-3 sm:px-4 py-1 rounded-full bg-slate-950/95 border border-amber-500/90 text-amber-300 font-mono text-xs sm:text-sm md:text-base font-bold shadow-2xl flex items-center gap-1.5">
              <span>🪙 底池 (POT):</span>
              <span className="text-emerald-400 font-black text-xs sm:text-lg md:text-xl">{potSize} BB</span>
            </div>

            {/* Community Board Cards */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5 my-1">
              {boardCards.length > 0 ? (
                boardCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`w-11 h-16 sm:w-14 sm:h-20 md:w-17 md:h-24 rounded-lg sm:rounded-xl border-2 border-slate-200 shadow-xl flex flex-col items-center justify-between p-1 font-mono font-black select-none transition-all hover:scale-105 ${
                      SUIT_COLORS[card.suit]
                    }`}
                  >
                    <span className="text-sm sm:text-xl md:text-2xl leading-none">{card.rank}</span>
                    <span className="text-lg sm:text-2xl md:text-3xl leading-none">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                ))
              ) : (
                <div className="text-emerald-200/90 italic text-xs sm:text-sm py-1 font-mono font-bold">Preflop 翻前开局阶段...</div>
              )}
            </div>
          </div>

          {/* Render 9 Seats around the Poker Table (Casino Mode with rotating Button & AI personalities) */}
          {trainingStage === 'STAGE_5_CASINO_RING' ? (
            ALL_CASINO_SEATS.map((seat, seatIdx) => {
              const isOccupied = activeCasinoSeats[seatIdx];
              const isDealer = isOccupied && seatIdx === btnSeatIndex;
              const isHeroSeat = seat.id === 0;
              const coords = NINE_MAX_COORDS[seatIdx];

              if (!isOccupied) {
                return (
                  <div
                    key={seat.id}
                    style={{ top: coords.top, left: coords.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center opacity-60"
                  >
                    <div className="px-1.5 py-0.5 rounded-lg border border-dashed border-slate-700/80 bg-slate-950/60 text-slate-400 text-[9px] sm:text-[10px] font-mono shadow">
                      <span>┼ {seatIdx}号位 空位</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={seat.id}
                  style={{ top: coords.top, left: coords.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                >
                  {/* Dealer Button Chip */}
                  {isDealer && (
                    <div className="absolute -top-2 -right-2 z-30 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 border-2 border-amber-500 text-amber-950 font-black text-[10px] sm:text-xs flex items-center justify-center shadow-lg animate-bounce">
                      D
                    </div>
                  )}

                  {/* Player Seat Card Badge */}
                  <div
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border flex flex-col items-center shadow-xl transition-all ${seat.bgColor} ${seat.borderColor} ${
                      isHeroSeat ? 'ring-2 ring-amber-400/80 scale-105 z-30' : 'opacity-95'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-xs sm:text-sm">{seat.avatar}</span>
                      <span className="font-black text-[10px] sm:text-xs text-white whitespace-nowrap">{seat.name}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-200 font-medium">{seat.styleLabel}</span>
                  </div>

                  {/* Player Action Text Badge */}
                  <div className={`mt-0.5 px-1.5 sm:px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-mono font-bold shadow whitespace-nowrap ${
                    isHeroSeat
                      ? isEvaluated ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse'
                      : isDealer ? 'bg-indigo-950 text-indigo-300 border-indigo-600' : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}>
                    {isHeroSeat ? (isEvaluated ? '已决策' : '🎯 Hero 决策中') : isDealer ? 'D 庄家位' : '❌ 弃牌 Fold'}
                  </div>

                  {/* Dealt Hole Cards */}
                  {isHeroSeat ? (
                    <div className="flex items-center space-x-1 mt-0.5 animate-in fade-in zoom-in-95 duration-200">
                      {heroCards.map((card, idx) => (
                        <div
                          key={idx}
                          className={`w-9 h-13 sm:w-12 sm:h-17 md:w-14 md:h-20 rounded-md sm:rounded-lg border-2 border-slate-200 shadow-xl flex flex-col items-center justify-between p-0.5 font-mono font-black select-none ${
                            SUIT_COLORS[card.suit]
                          }`}
                        >
                          <span className="text-xs sm:text-sm md:text-base leading-none">{card.rank}</span>
                          <span className="text-sm sm:text-lg md:text-xl leading-none">{SUIT_SYMBOLS[card.suit]}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-0.5 mt-0.5 opacity-80">
                      <div className="w-5 h-7 sm:w-6 sm:h-9 rounded bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 shadow">🎴</div>
                      <div className="w-5 h-7 sm:w-6 sm:h-9 rounded bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 shadow">🎴</div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            SIX_MAX_POSITIONS.map((pos) => {
              const isHero = pos === heroPos;
              const isVillain = pos === villainPos;
              const coords = SEAT_POSITIONS_MAP[pos];

              {/* Action Badge Calculation for 6-Max Player Seats */}
              let actionBadge = { label: '❌ 弃牌 Fold', bg: 'bg-slate-900/90 text-slate-400 border-slate-700/80' };
              if (isHero) {
                if (isEvaluated) {
                  const chosenText = evalResult?.chosenOption?.label || '已决策';
                  actionBadge = {
                    label: evalResult?.isOptimal ? `✅ ${chosenText}` : `⚠️ ${chosenText}`,
                    bg: evalResult?.isOptimal ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-rose-950 text-rose-300 border-rose-600',
                  };
                } else {
                  actionBadge = { label: '🎯 Hero 决策中', bg: 'bg-amber-400 text-slate-950 border-amber-300 font-black animate-pulse' };
                }
              } else if (isVillain) {
                if (scenarioMode === 'PREFLOP_RFI') {
                  actionBadge = { label: '⏳ 盲注待定', bg: 'bg-slate-800 text-slate-300 border-slate-600' };
                } else if (scenarioMode === 'PREFLOP_3BET') {
                  actionBadge = { label: '💥 3-Bet 加注 7.5x', bg: 'bg-rose-950 text-rose-300 border-rose-600 font-bold' };
                } else if (scenarioMode === 'PREFLOP_CALL_VS_OPEN' || scenarioMode === 'PREFLOP_BB_DEFENSE') {
                  actionBadge = { label: '💥 翻前加注 2.5x', bg: 'bg-amber-950 text-amber-300 border-amber-600 font-bold' };
                } else {
                  actionBadge = { label: '💥 入局对战 (Villain)', bg: 'bg-indigo-950 text-indigo-300 border-indigo-600 font-bold' };
                }
              }

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
                        ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/60 scale-105 z-30'
                        : isVillain
                        ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/40 z-20'
                        : 'bg-slate-950/80 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-100">{pos}</span>
                      {isHero && <span className="text-[9px] sm:text-[10px] bg-amber-400 text-slate-950 font-black px-1 rounded">Hero</span>}
                      {isVillain && <span className="text-[9px] sm:text-[10px] bg-rose-500 text-white font-black px-1 rounded">Villain</span>}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-300 font-semibold">100 BB</span>
                  </div>

                  {/* Player Action Text Badge */}
                  <div className={`mt-0.5 px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold shadow-md whitespace-nowrap ${actionBadge.bg}`}>
                    {actionBadge.label}
                  </div>

                  {/* Dealt Hole Cards for Hero or Villain */}
                  {isHero && (
                    <div className="flex items-center space-x-1 mt-0.5 animate-in fade-in zoom-in-95 duration-200">
                      {heroCards.map((card, idx) => (
                        <div
                          key={idx}
                          className={`w-9 h-13 sm:w-12 sm:h-17 md:w-14 md:h-20 rounded-md sm:rounded-lg border-2 border-slate-200 shadow-xl flex flex-col items-center justify-between p-0.5 font-mono font-black select-none ${
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

        {/* Live Casino Dialogue Feed Banner */}
        {trainingStage === 'STAGE_5_CASINO_RING' && (
          <div className="bg-slate-950/90 border border-amber-500/30 p-2 rounded-xl my-1.5 flex items-center space-x-2 text-xs sm:text-sm font-mono text-amber-200 shadow-md">
            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">{casinoRecentDialogue}</span>
          </div>
        )}

        {/* Action Control Deck (Responsive for iPhone/iPad/Desktop) */}
        <div className="relative z-20 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-800/80 max-w-4xl mx-auto w-full">
          {!isEvaluated ? (
            <div className="space-y-2.5 sm:space-y-3 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl sm:rounded-2xl shadow-md">
                <span className="text-xs sm:text-sm md:text-base text-slate-100 font-black">
                  当前轮到 Hero ({heroPos}) 决策 | 手牌 [{heroNotation}]:
                </span>
                <div className="flex items-center space-x-1.5">
                  {heroCards.map((c, i) => (
                    <div
                      key={i}
                      className={`w-9 h-13 sm:w-11 sm:h-16 md:w-13 md:h-18 rounded-lg border-2 border-slate-200 shadow-md flex flex-col items-center justify-between p-0.5 font-mono font-black text-xs sm:text-sm select-none ${
                        SUIT_COLORS[c.suit]
                      }`}
                    >
                      <span className="leading-none">{c.rank}</span>
                      <span className="text-sm sm:text-base leading-none">{SUIT_SYMBOLS[c.suit]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Grid - Fully visible on iPhone / iPad / Desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {options.map((opt) => (
                  <button
                    key={opt.action}
                    onClick={() => handleSelectAction(opt.action)}
                    className={`py-3 sm:py-3.5 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl border font-black text-xs sm:text-sm md:text-base transition-all shadow-lg active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      opt.action === 'ALL_IN'
                        ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 hover:from-rose-800 hover:to-amber-700 border-rose-500 text-rose-100 font-black shadow-rose-950/80 ring-2 ring-rose-500/60 scale-[1.01]'
                        : opt.action === 'CALL'
                        ? 'bg-emerald-950 hover:bg-emerald-600 border-emerald-500/80 text-emerald-200 hover:text-white shadow-emerald-950/50'
                        : opt.action === 'FOLD'
                        ? 'bg-rose-950/80 hover:bg-rose-700 border-rose-800 text-rose-200 hover:text-white'
                        : opt.action === 'CBET_125' || opt.action === 'CBET_150'
                        ? 'bg-indigo-950 hover:bg-indigo-600 border-indigo-500/80 text-indigo-200 hover:text-white'
                        : opt.action === 'RAISE_2' || opt.action === 'RAISE_2_5' || opt.action === 'RAISE_3' || opt.action === 'THREE_BET' || opt.action === 'FOUR_BET'
                        ? 'bg-amber-950/90 hover:bg-amber-600 border-amber-500/80 text-amber-200 hover:text-white'
                        : 'bg-slate-900 hover:bg-amber-600 border-slate-700 hover:border-amber-500 text-slate-100 hover:text-white'
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
                className={`p-4 rounded-2xl border flex flex-col space-y-3 ${
                  evalResult?.isOptimal
                    ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200 shadow-lg shadow-emerald-950/50'
                    : 'bg-rose-950/90 border-rose-700 text-rose-200 shadow-lg shadow-rose-950/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {evalResult?.isOptimal ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-black text-sm sm:text-base flex items-center gap-2">
                        <span>{evalResult?.isOptimal ? '当场判定：✅ 决策正确' : '当场判定：❌ 决策偏离 (漏水)'}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-900/80 border border-slate-700">
                          {evalResult?.isOptimal ? 'EV 0 mBB' : `EV 损耗 -${evalResult?.evLossMBB} mBB`}
                        </span>
                      </h4>
                      <p className="text-xs opacity-90 font-mono mt-0.5">{evalResult?.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center space-x-2 shrink-0">
                    <button
                      onClick={handleRequestAudit}
                      disabled={aiAuditLoading}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-900/90 hover:bg-purple-800 border border-purple-600 text-purple-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      <span>{aiAuditLoading ? 'Gemini 审计中...' : 'Gemini AI 深入诊所'}</span>
                    </button>

                    {/* Multi-street Next Card Progression Buttons */}
                    {scenarioMode === 'POSTFLOP_MULTI_STREET' && street === 'FLOP' && (
                      <button
                        onClick={dealTurnCard}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        <span>进入转牌 Turn 🎴</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {scenarioMode === 'POSTFLOP_MULTI_STREET' && street === 'TURN' && (
                      <button
                        onClick={dealRiverCard}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        <span>进入河牌 River 🎴</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={dealNewHand}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
                    >
                      <span>下一发手牌</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Solver Action Frequency Distribution Bars */}
                <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {options.map((opt) => {
                    const isChosen = userAction === opt.action;
                    const pct = Math.round(opt.freq * 100);
                    return (
                      <div
                        key={opt.action}
                        className={`p-2 rounded-lg border font-mono text-xs flex flex-col justify-between ${
                          isChosen
                            ? 'bg-slate-900 border-amber-400/80 ring-2 ring-amber-400/30'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">
                            {opt.label} {isChosen && <span className="text-amber-400 font-black">(你的选择)</span>}
                          </span>
                          <span className="font-bold text-amber-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${opt.action === 'CALL' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Immediate Strategic Explanation & Tactical Advice Box */}
                {evalResult?.explanation && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-100">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold">
                      <Brain className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>GTO 决策建议与原理详细说明:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-200 font-sans">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold block">【决策诊断与战术原理】:</span>
                        <p className="leading-relaxed opacity-90">{evalResult.explanation.reasoning}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                        <span className="text-cyan-400 font-bold block">【范围与阻挡效应分析】:</span>
                        <p className="leading-relaxed opacity-90">{evalResult.explanation.rangeLogic}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 font-medium leading-relaxed">
                      {evalResult.explanation.actionTip}
                    </div>
                  </div>
                )}
              </div>

              {/* Frequencies Bar Breakdown */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-2">
                <div className="text-slate-400 font-medium">GTO Solver 概率构成:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {options.map((opt) => (
                    <div
                      key={opt.action}
                      className={`p-2 rounded-lg border flex justify-between items-center ${
                        userAction === opt.action
                          ? 'border-amber-500 bg-slate-800 font-bold'
                          : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <span className="text-slate-300">{opt.label}:</span>
                      <span className="font-mono text-emerald-400 font-bold">{(opt.freq * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Gemini AI Inline Audit Output */}
      {aiAuditResult && (
        <div className="bg-slate-900 border border-purple-800/80 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 border-b border-purple-900/50 pb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Gemini 3.6 Flash GTO 实战牌桌剖析</h3>
              <p className="text-xs text-slate-400">基于 Range Advantage & Blockers 的深度求解分析</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-3">
            <p className="bg-slate-950 p-4 rounded-xl border border-slate-800">{aiAuditResult.analysis}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-amber-400 block mb-1">范围优势:</strong>
                <span>{aiAuditResult.keyConcepts.rangeAdvantage}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-cyan-400 block mb-1">阻挡牌效应:</strong>
                <span>{aiAuditResult.keyConcepts.blockerEffect}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-emerald-400 block mb-1">EV 与决策理由:</strong>
                <span>{aiAuditResult.keyConcepts.evComparison}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iPad Touch & Scenario Control Banner */}
      {/* 5-Stage Mastery Progression Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>6-Max 阶梯式 GTO 大师晋级阶梯</span>
                <span className="text-xs font-normal text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
                  五大关卡逐级征服
                </span>
              </h2>
              <p className="text-xs text-slate-400">掌握 169 翻前 ➔ 翻牌 3 张 ➔ 转牌第 4 张 ➔ 河牌第 5 张 ➔ 真实赌场 9-Max / 6-Max 动态实战</p>
            </div>
          </div>

          {/* Major Stage Level Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <button
              onClick={() => {
                setTrainingStage('STAGE_1_PREFLOP');
                setScenarioMode('PREFLOP_RFI');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                trainingStage === 'STAGE_1_PREFLOP'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              关卡1: 翻前 169 矩阵独训
            </button>
            <button
              onClick={() => {
                setTrainingStage('STAGE_2_FLOP');
                setScenarioMode('POSTFLOP_MULTI_STREET');
                setStreet('FLOP');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                trainingStage === 'STAGE_2_FLOP'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              关卡2: 翻牌圈 (3张)
            </button>
            <button
              onClick={() => {
                setTrainingStage('STAGE_3_TURN');
                setScenarioMode('POSTFLOP_MULTI_STREET');
                setStreet('TURN');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                trainingStage === 'STAGE_3_TURN'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950 ring-2 ring-cyan-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              关卡3: 转牌圈 (第4张)
            </button>
            <button
              onClick={() => {
                setTrainingStage('STAGE_4_RIVER');
                setScenarioMode('POSTFLOP_MULTI_STREET');
                setStreet('RIVER');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                trainingStage === 'STAGE_4_RIVER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 ring-2 ring-indigo-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              关卡4: 河牌圈 (第5张)
            </button>
            <button
              onClick={() => {
                setTrainingStage('STAGE_5_CASINO_RING');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                trainingStage === 'STAGE_5_CASINO_RING'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg ring-2 ring-amber-300/80'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>关卡5: 真实赌场 9-Max / 6-Max 动态现金桌</span>
            </button>

            {/* Stage Analytics Summary & Diagnostic Modal Trigger */}
            <button
              onClick={() => {
                setSummaryFilterStage(trainingStage);
                setShowStageSummaryModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg ring-1 ring-cyan-300/40"
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>📊 阶段统计分析与总结报告 ({stageHandLogs.filter(l => l.stage === trainingStage).length}手)</span>
            </button>
          </div>
        </div>

        {/* Stage-Specific Sub-Controls for Stages 1, 2, 3, 4 */}
        {trainingStage !== 'STAGE_5_CASINO_RING' && (
          <div className="flex flex-col space-y-3 pt-1 border-t border-slate-800/80">
            {/* Stage 1: Preflop Subcontrols */}
            {trainingStage === 'STAGE_1_PREFLOP' && (
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
                    <span className="text-xs text-amber-400 font-bold shrink-0">翻前训练模式:</span>

                    <button
                      onClick={() => {
                        setPreflopTargetPos('RANDOM_MIXED');
                        dealNewHand();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                        preflopTargetPos === 'RANDOM_MIXED'
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md font-black ring-2 ring-amber-300/80 scale-105'
                          : 'bg-slate-950 border border-slate-800 text-amber-300 hover:border-amber-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-300" />
                      <span>🎲 6位置 随机混合特训</span>
                    </button>

                    <div className="h-4 w-[1px] bg-slate-800 shrink-0 mx-1" />
                    <span className="text-xs text-slate-400 font-medium shrink-0">单位置独训:</span>

                    {(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as Position[]).map((pos) => {
                      let count = 0;
                      get169HandNames().flat().forEach((hand) => {
                        const rec = handMasteryMap[`${pos}_${hand}`];
                        if (rec && rec.trials > 0) count++;
                      });

                      return (
                        <button
                          key={pos}
                          onClick={() => {
                            setPreflopTargetPos(pos);
                            setHeroPos(pos);
                            if (pos === 'BB') {
                              setScenarioMode('PREFLOP_BB_DEFENSE');
                              setVillainPos('BTN');
                            } else {
                              setScenarioMode('PREFLOP_RFI');
                              setVillainPos('BB');
                            }
                            dealNewHand();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                            preflopTargetPos === pos
                              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-300/50'
                              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{pos}</span>
                          <span className="text-[10px] opacity-80 font-normal">({count}/169)</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preflop Mastery Progress */}
                  {(() => {
                    let totalTested = 0;
                    const totalPossible = 169 * 6;
                    get169HandNames().flat().forEach((hand) => {
                      (['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as Position[]).forEach((p) => {
                        const rec = handMasteryMap[`${p}_${hand}`];
                        if (rec && rec.trials > 0) totalTested++;
                      });
                    });
                    return (
                      <div className="text-xs font-mono text-slate-300 bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between sm:justify-start gap-2 shadow shrink-0">
                        <span className="text-slate-400">翻前矩阵掌握度:</span>
                        <span className="text-amber-400 font-bold">
                          {totalTested} / {totalPossible} ({Math.round((totalTested / totalPossible) * 100)}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Stage 1 Preflop Brain Learning & Weakness Diagnostic Bar */}
                <div className="mt-1 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border border-amber-500/30 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-900/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 shadow">
                      <Brain className="w-4 h-4 text-amber-300 animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 flex items-center gap-1">
                          🧠 翻前人脑认知与 169手牌弱点自动诊断系统
                        </span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">
                          自适应 12.0x 错题采样权重
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        根据艾宾浩斯记忆遗忘曲线，实时聚类 6 大位置与 169 组合的漏水决策 (mBB)，自动调配发牌概率。
                      </p>
                    </div>
                  </div>

                  {/* Preflop Top Leak Diagnostic & Quick Jump Button */}
                  {(() => {
                    let worstPos: Position = 'BB';
                    let maxEvLoss = -1;
                    let posLeakCount: Record<Position, number> = { UTG: 0, HJ: 0, CO: 0, BTN: 0, SB: 0, BB: 0 };

                    (['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as Position[]).forEach((p) => {
                      let pLoss = 0;
                      get169HandNames().flat().forEach((hand) => {
                        const rec = handMasteryMap[`${p}_${hand}`];
                        if (rec) pLoss += rec.evLoss;
                      });
                      posLeakCount[p] = pLoss;
                      if (pLoss > maxEvLoss) {
                        maxEvLoss = pLoss;
                        worstPos = p;
                      }
                    });

                    const posDescriptions: Record<Position, string> = {
                      'BB': '🔴 BB 位防守 3-Bet/Fold 频率偏离 GTO',
                      'SB': '🔴 SB 位盲注战 平跟 (Limp) 漏水严重',
                      'BTN': '🔴 BTN 位偷盲与边缘手牌 跟注/弃牌 模糊',
                      'CO': '🔴 CO 位隔离加注 (Isolate) 范围过宽',
                      'HJ': '🔴 HJ 位面对 3-Bet 弃牌率偏高',
                      'UTG': '🔴 UTG 枪位入局范围过于激进/沉闷',
                    };

                    const currentPreflopLeakText = maxEvLoss > 0 ? posDescriptions[worstPos] : '🟡 翻前 6 位置 正在建立基础认知模型...';

                    return (
                      <div className="flex items-center space-x-2 shrink-0 bg-slate-900 border border-slate-800 p-2 rounded-lg w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-300 font-medium">诊断翻前最大漏水点:</span>
                          <span className="text-amber-300 font-bold font-mono">{currentPreflopLeakText}</span>
                        </div>

                        <button
                          onClick={() => {
                            setDrillMode('ADAPTIVE');
                            setPreflopTargetPos(worstPos);
                            setHeroPos(worstPos);
                            if (worstPos === 'BB') {
                              setScenarioMode('PREFLOP_BB_DEFENSE');
                              setVillainPos('BTN');
                            } else {
                              setScenarioMode('PREFLOP_RFI');
                              setVillainPos('BB');
                            }
                            dealNewHand();
                          }}
                          className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-[11px] shadow cursor-pointer whitespace-nowrap transition-all active:scale-95"
                        >
                          🎯 翻前弱点靶向强特训
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Stage 2: Flop Texture Subcontrols */}
            {trainingStage === 'STAGE_2_FLOP' && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
                  <span className="text-xs text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> 翻牌牌面特训:
                  </span>

                  <button
                    onClick={() => {
                      setPostflopTargetFlop('ALL_MIXED');
                      dealNewHand();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                      postflopTargetFlop === 'ALL_MIXED'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md font-black ring-2 ring-emerald-300/80'
                        : 'bg-slate-950 border border-slate-800 text-emerald-300 hover:border-emerald-500/50'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5 text-emerald-300" />
                    <span>🎲 5大翻牌面 随机特训</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-800 shrink-0 mx-1" />

                  {[
                    { id: 'A_HIGH_DRY', label: 'A高干燥 (A-7-2)' },
                    { id: 'K_HIGH_DRY', label: 'K高干燥 (K-8-3)' },
                    { id: 'PAIRED_DRY', label: '公成对 (A-A-8)' },
                    { id: 'WET_CONNECTOR', label: '湿润连张 (T-9-8)' },
                    { id: 'MONOTONE', label: '单色同花 (Q♠J♠4♠)' },
                  ].map((t) => {
                    const rec = postflopMasteryMap[`FLOP_${t.id}`];
                    const acc = rec && rec.trials > 0 ? Math.round((rec.correct / rec.trials) * 100) : 0;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setPostflopTargetFlop(t.id as any);
                          dealNewHand();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                          postflopTargetFlop === t.id
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-300/60'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{t.label}</span>
                        {rec && rec.trials > 0 && (
                          <span className={`text-[10px] px-1 rounded ${acc >= 80 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                            {acc}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-mono text-slate-300 bg-slate-950 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow shrink-0">
                  <span className="text-slate-400">翻牌圈准确率:</span>
                  <span className="text-emerald-400 font-bold">
                    {(() => {
                      let t = 0, c = 0;
                      Object.keys(postflopMasteryMap).filter(k => k.startsWith('FLOP_')).forEach(k => {
                        t += postflopMasteryMap[k].trials;
                        c += postflopMasteryMap[k].correct;
                      });
                      return t > 0 ? `${Math.round((c / t) * 100)}% (${c}/${t}次)` : '待测试';
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Stage 3: Turn Scenario Subcontrols */}
            {trainingStage === 'STAGE_3_TURN' && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
                  <span className="text-xs text-cyan-400 font-bold shrink-0 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> 转牌(第4张)场景特训:
                  </span>

                  <button
                    onClick={() => {
                      setPostflopTargetTurn('ALL_MIXED');
                      dealNewHand();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                      postflopTargetTurn === 'ALL_MIXED'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-black ring-2 ring-cyan-300/80'
                        : 'bg-slate-950 border border-slate-800 text-cyan-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5 text-cyan-300" />
                    <span>🎲 4大转牌场景 随机特训</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-800 shrink-0 mx-1" />

                  {[
                    { id: 'TURN_OVERCARD', label: '高牌威胁卡 (Overcard)' },
                    { id: 'TURN_BRICK', label: '砖头废牌 (Brick)' },
                    { id: 'TURN_FLUSH_COMPLETE', label: '同花成花 (Flush)' },
                    { id: 'TURN_PAIRED', label: '公成双对 (Paired)' },
                  ].map((t) => {
                    const rec = postflopMasteryMap[t.id];
                    const acc = rec && rec.trials > 0 ? Math.round((rec.correct / rec.trials) * 100) : 0;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setPostflopTargetTurn(t.id as any);
                          dealNewHand();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                          postflopTargetTurn === t.id
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black ring-2 ring-cyan-300/60'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{t.label}</span>
                        {rec && rec.trials > 0 && (
                          <span className={`text-[10px] px-1 rounded ${acc >= 80 ? 'bg-cyan-950 text-cyan-300' : 'bg-rose-950 text-rose-300'}`}>
                            {acc}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-mono text-slate-300 bg-slate-950 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow shrink-0">
                  <span className="text-slate-400">转牌圈准确率:</span>
                  <span className="text-cyan-400 font-bold">
                    {(() => {
                      let t = 0, c = 0;
                      Object.keys(postflopMasteryMap).filter(k => k.startsWith('TURN_')).forEach(k => {
                        t += postflopMasteryMap[k].trials;
                        c += postflopMasteryMap[k].correct;
                      });
                      return t > 0 ? `${Math.round((c / t) * 100)}% (${c}/${t}次)` : '待测试';
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Stage 4: River Scenario Subcontrols */}
            {trainingStage === 'STAGE_4_RIVER' && (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
                  <span className="text-xs text-indigo-400 font-bold shrink-0 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> 河牌(第5张)场景特训:
                  </span>

                  <button
                    onClick={() => {
                      setPostflopTargetRiver('ALL_MIXED');
                      dealNewHand();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                      postflopTargetRiver === 'ALL_MIXED'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md font-black ring-2 ring-indigo-300/80'
                        : 'bg-slate-950 border border-slate-800 text-indigo-300 hover:border-indigo-500/50'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5 text-indigo-300" />
                    <span>🎲 4大河牌场景 随机特训</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-800 shrink-0 mx-1" />

                  {[
                    { id: 'RIVER_VALUE_NUT', label: '坚果三弹价值注 (Value)' },
                    { id: 'RIVER_BLUFF_JAM', label: '阻挡牌极化推牌 (Bluff Jam)' },
                    { id: 'RIVER_HERO_CALL', label: '抓诈防守 (Hero Call)' },
                    { id: 'RIVER_BLOCKBET', label: '阻挡下注/控池 (Blockbet)' },
                  ].map((t) => {
                    const rec = postflopMasteryMap[t.id];
                    const acc = rec && rec.trials > 0 ? Math.round((rec.correct / rec.trials) * 100) : 0;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setPostflopTargetRiver(t.id as any);
                          dealNewHand();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                          postflopTargetRiver === t.id
                            ? 'bg-indigo-500 text-white shadow-md font-black ring-2 ring-indigo-300/60'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{t.label}</span>
                        {rec && rec.trials > 0 && (
                          <span className={`text-[10px] px-1 rounded ${acc >= 80 ? 'bg-indigo-950 text-indigo-300' : 'bg-rose-950 text-rose-300'}`}>
                            {acc}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-mono text-slate-300 bg-slate-950 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow shrink-0">
                  <span className="text-slate-400">河牌圈准确率:</span>
                  <span className="text-indigo-400 font-bold">
                    {(() => {
                      let t = 0, c = 0;
                      Object.keys(postflopMasteryMap).filter(k => k.startsWith('RIVER_')).forEach(k => {
                        t += postflopMasteryMap[k].trials;
                        c += postflopMasteryMap[k].correct;
                      });
                      return t > 0 ? `${Math.round((c / t) * 100)}% (${c}/${t}次)` : '待测试';
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Brain Cognitive Learning & Weakness Auto-Diagnostics Panel */}
            <div className="mt-2 bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-purple-500/30 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-900/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0 shadow">
                  <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 flex items-center gap-1">
                      🧠 人类大脑认知强化与艾宾浩斯遗忘曲线复习引擎
                    </span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-bold">
                      自适应权重: 4.0x 错题优先
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    系统根据大脑记忆巩固规律，对错题、高漏水 (mBB) 与反应迟疑场景实施间隔靶向推发牌，彻底根治盲点。
                  </p>
                </div>
              </div>

              {/* Top Leak Spot Diagnostic & Quick Jump */}
              {(() => {
                let maxLeakKey = '';
                let maxLeakValue = -1;
                Object.keys(postflopMasteryMap).forEach((k) => {
                  const data = postflopMasteryMap[k];
                  if (data.trials > 0 && data.evLoss > maxLeakValue) {
                    maxLeakValue = data.evLoss;
                    maxLeakKey = k;
                  }
                });

                const leakLabels: Record<string, string> = {
                  'FLOP_WET_CONNECTOR': '🔴 翻牌 湿润连张面 C-Bet 过激',
                  'FLOP_MONOTONE': '🔴 翻牌 单色面 阻挡效应误判',
                  'TURN_OVERCARD': '🔴 转牌 高牌场景 缺乏 Overbet 极化',
                  'RIVER_BLUFF_JAM': '🔴 河牌 阻挡牌极化诈唬 频率偏低',
                  'RIVER_HERO_CALL': '🔴 河牌 抓诈 Hero Call 抓诈过度',
                };

                const currentLeakText = leakLabels[maxLeakKey] || '🟡 正在进行多阶段认知采样诊断...';

                return (
                  <div className="flex items-center space-x-2 shrink-0 bg-slate-900 border border-slate-800 p-2 rounded-lg w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-slate-300 font-medium">诊断最高漏水点:</span>
                      <span className="text-rose-300 font-bold font-mono">{currentLeakText}</span>
                    </div>

                    <button
                      onClick={() => {
                        setDrillMode('ADAPTIVE');
                        if (maxLeakKey.startsWith('FLOP_')) {
                          setTrainingStage('STAGE_2_FLOP');
                          setPostflopTargetFlop(maxLeakKey.replace('FLOP_', '') as any);
                        } else if (maxLeakKey.startsWith('TURN_')) {
                          setTrainingStage('STAGE_3_TURN');
                          setPostflopTargetTurn(maxLeakKey as any);
                        } else if (maxLeakKey.startsWith('RIVER_')) {
                          setTrainingStage('STAGE_4_RIVER');
                          setPostflopTargetRiver(maxLeakKey as any);
                        }
                        dealNewHand();
                      }}
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] shadow cursor-pointer whitespace-nowrap transition-all active:scale-95"
                    >
                      🎯 靶向强特训
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Stage 5 Real Casino Mode HUD & Table Controls */}
        {trainingStage === 'STAGE_5_CASINO_RING' && (
          <div className="bg-slate-950 border border-amber-500/40 p-3.5 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs font-mono">
            {/* Bankroll & Profit Info */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>现金筹码: {casinoBankrollBB.toFixed(1)} BB (${(casinoBankrollBB * 10).toFixed(0)})</span>
              </div>
              <div className={`font-bold ${casinoProfitBB >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                累计盈亏: {casinoProfitBB >= 0 ? `+${casinoProfitBB}` : casinoProfitBB} BB
              </div>
              <div className="text-slate-400">
                已战手牌: <strong className="text-white">{casinoHandsPlayed}</strong> 手
              </div>
            </div>

            {/* Table Format & Dynamic Seating Selector */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto">
              <span className="text-slate-400 text-[11px] shrink-0">桌型模式:</span>
              <button
                onClick={() => {
                  setCasinoTableFormat('6_MAX');
                  setActiveCasinoSeats([true, true, true, true, true, true, false, false, false]);
                  setCasinoRecentDialogue('🎰 赌场发牌员: "已切换至 标准 6-Max 现金桌模式！"');
                  dealNewHand();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  casinoTableFormat === '6_MAX'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                6-Max 常用桌
              </button>
              <button
                onClick={() => {
                  setCasinoTableFormat('9_MAX');
                  setActiveCasinoSeats([true, true, true, true, true, true, true, true, true]);
                  setCasinoRecentDialogue('🎰 赌场发牌员: "已切换至 9-Max 满员大桌 (Full Ring) 模式！9 位高手齐聚！"');
                  dealNewHand();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  casinoTableFormat === '9_MAX'
                    ? 'bg-indigo-600 text-white font-black shadow ring-1 ring-indigo-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                9-Max 满员桌
              </button>
              <button
                onClick={() => {
                  setCasinoTableFormat('DYNAMIC_RANDOM');
                  setCasinoRecentDialogue('🎰 赌场发牌员: "已开启 🎲 动态随机人数模式！玩家随时赢光离场或买入坐下！"');
                  dealNewHand();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  casinoTableFormat === 'DYNAMIC_RANDOM'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black shadow ring-1 ring-amber-300/60'
                    : 'bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-800'
                }`}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>🎲 动态变动人数 ({activeCasinoSeats.filter(Boolean).length}人在座)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 169 Hand GTO Mastery Heatmap & Adaptive Drill Engine Panel */}
      {(() => {
        const matrixHandNames = get169HandNames();
        let mastered = 0;
        let grayZone = 0;
        let needsWork = 0;
        let untested = 0;

        matrixHandNames.flat().forEach((hand) => {
          const rec = handMasteryMap[`${heroPos}_${hand}`];
          const st = getHandMasteryStatus(rec);
          if (st === 'MASTERED') mastered++;
          else if (st === 'GRAY_ZONE') grayZone++;
          else if (st === 'NEEDS_WORK') needsWork++;
          else untested++;
        });

        const masteredPct = Math.round((mastered / 169) * 100);
        const grayPct = Math.round((grayZone / 169) * 100);
        const needsWorkPct = Math.round((needsWork / 169) * 100);

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{heroPos} 位置 169 手牌 GTO 掌握度热力阵图</span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-md">
                      掌握进度 {masteredPct}%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    🟢 已掌握 ({mastered}) • 🟡 灰色地带 ({grayZone}) • 🔴 重点错题 ({needsWork}) • ⚪ 未测试 ({untested})
                  </p>
                </div>
              </div>

              {/* Drill Mode Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
                  <button
                    onClick={() => setDrillMode('ADAPTIVE')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      drillMode === 'ADAPTIVE'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>⚡ 自适应弱点强化</span>
                  </button>
                  <button
                    onClick={() => setDrillMode('RANDOM')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      drillMode === 'RANDOM'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🎲 纯随机发牌</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowMasteryMatrix(!showMasteryMatrix)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showMasteryMatrix ? '收起 169 矩阵' : '展开 169 矩阵热力图'}</span>
                </button>
              </div>
            </div>

            {/* Segmented Mastery Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                <div style={{ width: `${(mastered / 169) * 100}%` }} className="bg-emerald-500 h-full rounded-l-full transition-all" title={`已掌握 ${mastered} 手`} />
                <div style={{ width: `${(grayZone / 169) * 100}%` }} className="bg-amber-400 h-full transition-all" title={`灰色地带 ${grayZone} 手`} />
                <div style={{ width: `${(needsWork / 169) * 100}%` }} className="bg-rose-500 h-full transition-all" title={`重点错题 ${needsWork} 手`} />
                <div style={{ width: `${(untested / 169) * 100}%` }} className="bg-slate-800 h-full rounded-r-full transition-all" title={`未测试 ${untested} 手`} />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 🟢 已掌握 (准确率≥80%且≥2次): <strong className="text-emerald-400">{mastered}</strong></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 🟡 灰色地带 (准确率40-79%): <strong className="text-amber-400">{grayZone}</strong></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> 🔴 尚未掌握/频繁做错: <strong className="text-rose-400">{needsWork}</strong></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700" /> ⚪ 未测试: <strong className="text-slate-400">{untested}</strong></span>
              </div>
            </div>

            {/* Interactive 13x13 Mastery Grid */}
            {showMasteryMatrix && (
              <div className="overflow-x-auto pt-2 animate-in fade-in duration-200">
                <div className="inline-block min-w-[550px] w-full">
                  <div className="grid grid-cols-13 gap-1 text-center font-mono">
                    {matrixHandNames.map((row, rIdx) =>
                      row.map((handName, cIdx) => {
                        const rec = handMasteryMap[`${heroPos}_${handName}`];
                        const st = getHandMasteryStatus(rec);
                        const isCurrentHand = heroNotation === handName;

                        let colorClass = 'bg-slate-950/70 border-slate-800/80 text-slate-500 hover:border-slate-600';
                        if (st === 'MASTERED') {
                          colorClass = 'bg-emerald-950/90 border-emerald-600/80 text-emerald-300 font-bold hover:bg-emerald-800/90';
                        } else if (st === 'GRAY_ZONE') {
                          colorClass = 'bg-amber-950/90 border-amber-600/80 text-amber-300 font-bold hover:bg-amber-800/90';
                        } else if (st === 'NEEDS_WORK') {
                          colorClass = 'bg-rose-950/90 border-rose-600/80 text-rose-300 font-bold hover:bg-rose-800/90 animate-pulse';
                        }

                        const trials = rec?.trials || 0;
                        const acc = trials > 0 ? Math.round((rec.correct / trials) * 100) : 0;

                        return (
                          <button
                            key={handName}
                            onClick={() => drillSpecificHand(handName)}
                            title={`手牌 ${handName} | 测试 ${trials} 次 | 准确率 ${acc}% | 状态: ${st}`}
                            className={`p-1.5 sm:p-2 rounded-md border text-[10px] sm:text-xs transition-all relative cursor-pointer flex flex-col items-center justify-center ${colorClass} ${
                              isCurrentHand ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 z-10 scale-105' : ''
                            }`}
                          >
                            <span className="leading-none">{handName}</span>
                            {trials > 0 && (
                              <span className="text-[9px] opacity-80 mt-0.5">
                                {acc}%
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2 font-mono">
                  💡 点击矩阵中任意手牌格，可立即发起对该手牌的单手独训强攻！
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Stage Summary & Executive Report Modal */}
      {showStageSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>阶段训练统计分析与归纳总结报告</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                      GTO Executive Report
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">基于近期实战数据与大脑记忆巩固度的多维度归纳分析</p>
                </div>
              </div>

              <button
                onClick={() => setShowStageSummaryModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs by Stage */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-bold">
              {[
                { id: 'ALL', label: '🌐 综合全关卡汇总' },
                { id: 'STAGE_1_PREFLOP', label: '关卡1: 翻前矩阵' },
                { id: 'STAGE_2_FLOP', label: '关卡2: 翻牌圈' },
                { id: 'STAGE_3_TURN', label: '关卡3: 转牌圈' },
                { id: 'STAGE_4_RIVER', label: '关卡4: 河牌圈' },
                { id: 'STAGE_5_CASINO_RING', label: '关卡5: 赌场实战' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSummaryFilterStage(st.id)}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    summaryFilterStage === st.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Stage Performance Badge & Major Metrics */}
            {(() => {
              const filteredLogs = summaryFilterStage === 'ALL'
                ? stageHandLogs
                : stageHandLogs.filter(l => l.stage === summaryFilterStage);

              const total = filteredLogs.length;
              const correct = filteredLogs.filter(l => l.isOptimal).length;
              const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
              const totalEvLoss = filteredLogs.reduce((acc, l) => acc + l.evLoss, 0);
              const avgEvLoss = total > 0 ? (totalEvLoss / total).toFixed(1) : '0';

              let rankBadge = { title: 'S级 · GTO 求解大师', color: 'border-cyan-500 bg-cyan-950/60 text-cyan-300', icon: '🏆', desc: '决策准确度媲美顶级 100BB GTO Solver，范围无缝防御，极化与阻挡效应运用出神入化！' };
              if (accuracy < 55) {
                rankBadge = { title: 'D级/C级 · 认知有待突破', color: 'border-rose-500 bg-rose-950/60 text-rose-300', icon: '🥉', desc: '当前阶段存在较明显偏离 (如盲目跟注、翻前平跟或忽视 C-Bet 保护)，需进行靶向强化。' };
              } else if (accuracy < 70) {
                rankBadge = { title: 'B级 · 稳健竞技型', color: 'border-amber-500 bg-amber-950/60 text-amber-300', icon: '🥈', desc: '具备良好的标准 GTO 框架，但在极化场景或重注下注尺寸上偶有漏洞，需要精细化微调。' };
              } else if (accuracy < 85) {
                rankBadge = { title: 'A级 · 卓越职业牌手', color: 'border-emerald-500 bg-emerald-950/60 text-emerald-300', icon: '🥇', desc: '绝大多数场景表现极其稳健，能保持高水准的平跟与下注平衡，长远 EV 累积极为丰厚！' };
              }

              const wrongLogs = filteredLogs.filter(l => !l.isOptimal);

              return (
                <div className="space-y-6">
                  {/* Scorecard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-2xl border ${rankBadge.color} flex flex-col justify-between col-span-1 md:col-span-2 shadow-lg`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{rankBadge.icon}</span>
                        <div>
                          <span className="text-xs opacity-75 font-mono uppercase block">阶段评级勋章</span>
                          <h4 className="text-base font-black">{rankBadge.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs opacity-90 mt-2 leading-relaxed">{rankBadge.desc}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-mono">已测手牌与准确率</span>
                      <div>
                        <div className="text-2xl font-black font-mono text-cyan-400">{accuracy}%</div>
                        <span className="text-xs text-slate-400">正确 {correct} / 共 {total} 手</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-mono">平均 EV 损耗</span>
                      <div>
                        <div className={`text-2xl font-black font-mono ${totalEvLoss === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          -{avgEvLoss} <span className="text-xs text-slate-400">mBB/手</span>
                        </div>
                        <span className="text-xs text-slate-400">累计损耗 -{totalEvLoss} mBB</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Mistakes Cluster & Leak Summary */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                        <ShieldAlert className="w-4 h-4" />
                        <span>阶段核心漏洞与错误归纳总结:</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">错误记录 {wrongLogs.length} 次</span>
                    </div>

                    {wrongLogs.length === 0 ? (
                      <p className="text-xs text-emerald-400 font-medium py-2">
                        🎉 太棒了！在当前筛选模式下尚未录入任何错题决策，你的策略极其严密完美！
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {wrongLogs.slice(0, 5).map((log, idx) => (
                          <div key={log.id || idx} className="p-3 rounded-xl bg-slate-900 border border-rose-950 flex flex-col space-y-1 text-xs">
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-slate-200">
                                [{log.stage}] {log.heroPos} vs {log.villainPos} • 手牌: <strong className="text-amber-400">{log.heroNotation}</strong>
                              </span>
                              <span className="text-rose-400 font-bold">EV 损耗 -{log.evLoss} mBB</span>
                            </div>
                            <div className="text-slate-300">
                              ❌ 你的选择: <span className="line-through text-rose-300 font-bold">{log.chosenLabel}</span>
                              <span className="mx-2">➔</span>
                              推荐动作: <span className="text-emerald-400 font-bold">{log.bestLabel}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                              {log.explanation.reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tailored GTO Improvement Guidance */}
                  <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-purple-950/60 border border-cyan-500/40 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>下阶段针对性提分与 GTO 避坑指南</span>
                    </h4>
                    <ul className="text-xs text-slate-200 space-y-1.5 list-disc list-inside leading-relaxed">
                      <li><strong>翻前规范</strong>：在中前位严禁无脑平跟入局，坚持 Raise 2.5BB 或 Direct Fold，保持隔离主动权。</li>
                      <li><strong>翻牌 C-Bet 策略</strong>：干燥 A/K 高牌面高频下注 33% Pot 保护范围，湿润连张面优先考虑 Check 控池防守。</li>
                      <li><strong>转牌/河牌极化</strong>：利用阻挡牌 (Blocker) 在河牌敢于极化推牌，抓诈时确认阻断对手成牌。</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => {
                        setDrillMode('ADAPTIVE');
                        setShowStageSummaryModal(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
                    >
                      <Target className="w-4 h-4" />
                      <span>🎯 针对本阶段错题发起靶向强特训</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {summaryFilterStage === 'STAGE_1_PREFLOP' && (
                        <button
                          onClick={() => {
                            setTrainingStage('STAGE_2_FLOP');
                            setScenarioMode('POSTFLOP_MULTI_STREET');
                            setStreet('FLOP');
                            setShowStageSummaryModal(false);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer"
                        >
                          推进至关卡2: 翻牌圈 ➔
                        </button>
                      )}

                      <button
                        onClick={() => setShowStageSummaryModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                      >
                        关闭分析报告
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};
