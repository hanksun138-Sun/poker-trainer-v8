import { Card, CardRank, CardSuit, Position, FlopBoardConfig, StrategyFrequencies, RangeConverterProfile, PostflopTexasTreeStrategy, UserProfile } from '../types/poker';

export const RANKS: CardRank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: CardSuit[] = ['s', 'h', 'd', 'c'];

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const SUIT_COLORS: Record<CardSuit, string> = {
  s: 'text-slate-950 bg-white border-slate-300 shadow-md', // Spades: Black on White
  h: 'text-red-600 bg-white border-slate-300 shadow-md',   // Hearts: Vibrant Red on White
  d: 'text-blue-600 bg-white border-slate-300 shadow-md',  // Diamonds: Vibrant Blue on White
  c: 'text-emerald-700 bg-white border-slate-300 shadow-md', // Clubs: Vibrant Green on White
};

// Generate 13x13 matrix hand names
export function get169HandNames(): string[][] {
  const matrix: string[][] = [];
  for (let r = 0; r < 13; r++) {
    const row: string[] = [];
    for (let c = 0; c < 13; c++) {
      const r1 = RANKS[r];
      const r2 = RANKS[c];
      if (r === c) {
        row.push(`${r1}${r2}`); // Pocket pair e.g. AA, KK
      } else if (r < c) {
        row.push(`${r1}${r2}s`); // Suited e.g. AKs, AQs
      } else {
        row.push(`${r2}${r1}o`); // Offsuit e.g. AKo, AQo
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export function getComboCount(handName: string): number {
  if (handName.length === 2) return 6; // Pair
  if (handName.endsWith('s')) return 4; // Suited
  return 12; // Offsuit
}

export function parseHandCategory(handName: string): 'pair' | 'suited' | 'offsuit' {
  if (handName.length === 2) return 'pair';
  if (handName.endsWith('s')) return 'suited';
  return 'offsuit';
}

// Standard Flop Textures for TexasSolver
export const FLOP_BOARDS: FlopBoardConfig[] = [
  {
    id: 'A_HIGH_DRY',
    name: 'A高干燥面 (A♠ 7♦ 2♣)',
    cards: [
      { rank: 'A', suit: 's' },
      { rank: '7', suit: 'd' },
      { rank: '2', suit: 'c' },
    ],
    description: 'BTN vs BB 常见单步加注底池。BTN拥有极高范围与坚果优势，C-Bet频率高达 78.4%。',
    rangeAdvantage: 'IP',
    ipCbetFreq: 0.784,
    oopCheckFreq: 0.882,
  },
  {
    id: 'K_HIGH_DRY',
    name: 'K高干燥面 (K♠ 8♦ 3♣)',
    cards: [
      { rank: 'K', suit: 's' },
      { rank: '8', suit: 'd' },
      { rank: '3', suit: 'c' },
    ],
    description: '中强范围优势，BTN倾向于使用33% Pot小额持续下注压迫OOP中等牌力。',
    rangeAdvantage: 'IP',
    ipCbetFreq: 0.695,
    oopCheckFreq: 0.840,
  },
  {
    id: 'PAIRED_DRY',
    name: '成对面 (A♠ A♦ 8♣)',
    cards: [
      { rank: 'A', suit: 's' },
      { rank: 'A', suit: 'd' },
      { rank: '8', suit: 'c' },
    ],
    description: '极度干燥公牌，三条A与Ax统治该牌面，极适合高频25% Pot超小下注。',
    rangeAdvantage: 'IP',
    ipCbetFreq: 0.852,
    oopCheckFreq: 0.920,
  },
  {
    id: 'WET_CONNECTOR',
    name: '湿润连张面 (T♠ 9♠ 8♦)',
    cards: [
      { rank: 'T', suit: 's' },
      { rank: '9', suit: 's' },
      { rank: '8', suit: 'd' },
    ],
    description: '顺子与同牌听牌丰富，BB拥有较多两对/顺子等坚果组合，BTN需高频Check过牌保护。',
    rangeAdvantage: 'OOP',
    ipCbetFreq: 0.382,
    oopCheckFreq: 0.725,
  },
  {
    id: 'MONOTONE',
    name: '单色同花面 (Q♠ J♠ 4♠)',
    cards: [
      { rank: 'Q', suit: 's' },
      { rank: 'J', suit: 's' },
      { rank: '4', suit: 's' },
    ],
    description: '3张同花牌面，拥有♠A/♠K者具备强阻挡效应，极度考验混合策略与阻挡牌认知。',
    rangeAdvantage: 'EVEN',
    ipCbetFreq: 0.420,
    oopCheckFreq: 0.810,
  },
];

// Preflop RangeConverter baseline
export const DEFAULT_RANGE_CONVERTER_PROFILE: RangeConverterProfile = {
  id: 'rc_solver_v42',
  name: 'RangeConverter 100BB 6-Max GTO',
  version: 'v42.0-2026',
  description: '基于 RangeConverter 官方真实 Solver 求解数据（单加注底池与3Bet/4Bet梯度）',
  positions: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  matrixData: {
    UTG: {
      'AA': { raise2_5: 1.0 },
      'KK': { raise2_5: 1.0 },
      'QQ': { raise2_5: 1.0 },
      'JJ': { raise2_5: 1.0 },
      'TT': { raise2_5: 0.95, fold: 0.05 },
      '99': { raise2_5: 0.80, fold: 0.20 },
      '88': { raise2_5: 0.50, fold: 0.50 },
      'AKs': { raise2_5: 1.0 },
      'AQs': { raise2_5: 1.0 },
      'AJs': { raise2_5: 1.0 },
      'ATs': { raise2_5: 0.85, fold: 0.15 },
      'A5s': { raise2_5: 0.75, fold: 0.25 },
      'A4s': { raise2_5: 0.60, fold: 0.40 },
      'AKo': { raise2_5: 1.0 },
      'AQo': { raise2_5: 0.80, fold: 0.20 },
      'KQs': { raise2_5: 0.90, fold: 0.10 },
      'KJs': { raise2_5: 0.70, fold: 0.30 },
      'QJs': { raise2_5: 0.60, fold: 0.40 },
      'JTs': { raise2_5: 0.50, fold: 0.50 },
    },
    HJ: {
      'AA': { raise2_5: 1.0 },
      'KK': { raise2_5: 1.0 },
      'QQ': { raise2_5: 1.0 },
      'JJ': { raise2_5: 1.0 },
      'TT': { raise2_5: 1.0 },
      '99': { raise2_5: 0.90, fold: 0.10 },
      '88': { raise2_5: 0.70, fold: 0.30 },
      '77': { raise2_5: 0.45, fold: 0.55 },
      'AKs': { raise2_5: 1.0 },
      'AQs': { raise2_5: 1.0 },
      'AJs': { raise2_5: 1.0 },
      'ATs': { raise2_5: 0.95, fold: 0.05 },
      'A5s': { raise2_5: 0.90, fold: 0.10 },
      'A4s': { raise2_5: 0.80, fold: 0.20 },
      'AKo': { raise2_5: 1.0 },
      'AQo': { raise2_5: 0.90, fold: 0.10 },
      'AJo': { raise2_5: 0.50, fold: 0.50 },
      'KQs': { raise2_5: 1.0 },
      'KJs': { raise2_5: 0.85, fold: 0.15 },
      'QJs': { raise2_5: 0.80, fold: 0.20 },
      'JTs': { raise2_5: 0.75, fold: 0.25 },
      'T9s': { raise2_5: 0.50, fold: 0.50 },
    },
    CO: {
      'AA': { raise2_5: 1.0 },
      'KK': { raise2_5: 1.0 },
      'QQ': { raise2_5: 1.0 },
      'JJ': { raise2_5: 1.0 },
      'TT': { raise2_5: 1.0 },
      '99': { raise2_5: 1.0 },
      '88': { raise2_5: 0.90, fold: 0.10 },
      '77': { raise2_5: 0.75, fold: 0.25 },
      '66': { raise2_5: 0.60, fold: 0.40 },
      'AKs': { raise2_5: 1.0 },
      'AQs': { raise2_5: 1.0 },
      'AJs': { raise2_5: 1.0 },
      'ATs': { raise2_5: 1.0 },
      'A9s': { raise2_5: 0.80, fold: 0.20 },
      'A5s': { raise2_5: 1.0 },
      'A4s': { raise2_5: 0.95, fold: 0.05 },
      'A3s': { raise2_5: 0.70, fold: 0.30 },
      'A2s': { raise2_5: 0.65, fold: 0.35 },
      'AKo': { raise2_5: 1.0 },
      'AQo': { raise2_5: 1.0 },
      'AJo': { raise2_5: 0.80, fold: 0.20 },
      'ATo': { raise2_5: 0.40, fold: 0.60 },
      'KQs': { raise2_5: 1.0 },
      'KJs': { raise2_5: 1.0 },
      'KTs': { raise2_5: 0.85, fold: 0.15 },
      'QJs': { raise2_5: 1.0 },
      'QTs': { raise2_5: 0.80, fold: 0.20 },
      'JTs': { raise2_5: 0.90, fold: 0.10 },
      'T9s': { raise2_5: 0.80, fold: 0.20 },
      '98s': { raise2_5: 0.65, fold: 0.35 },
      '87s': { raise2_5: 0.55, fold: 0.45 },
    },
    BTN: {
      'AA': { raise2_5: 1.0 },
      'KK': { raise2_5: 1.0 },
      'QQ': { raise2_5: 1.0 },
      'JJ': { raise2_5: 1.0 },
      'TT': { raise2_5: 1.0 },
      '99': { raise2_5: 1.0 },
      '88': { raise2_5: 1.0 },
      '77': { raise2_5: 1.0 },
      '66': { raise2_5: 0.90, fold: 0.10 },
      '55': { raise2_5: 0.85, fold: 0.15 },
      '44': { raise2_5: 0.75, fold: 0.25 },
      '33': { raise2_5: 0.70, fold: 0.30 },
      '22': { raise2_5: 0.65, fold: 0.35 },
      'AKs': { raise2_5: 1.0 },
      'AQs': { raise2_5: 1.0 },
      'AJs': { raise2_5: 1.0 },
      'ATs': { raise2_5: 1.0 },
      'A9s': { raise2_5: 1.0 },
      'A8s': { raise2_5: 0.90, fold: 0.10 },
      'A7s': { raise2_5: 0.85, fold: 0.15 },
      'A5s': { raise2_5: 1.0 },
      'A4s': { raise2_5: 1.0 },
      'A3s': { raise2_5: 0.90, fold: 0.10 },
      'A2s': { raise2_5: 0.85, fold: 0.15 },
      'AKo': { raise2_5: 1.0 },
      'AQo': { raise2_5: 1.0 },
      'AJo': { raise2_5: 1.0 },
      'ATo': { raise2_5: 0.85, fold: 0.15 },
      'A9o': { raise2_5: 0.50, fold: 0.50 },
      'KQs': { raise2_5: 1.0 },
      'KJs': { raise2_5: 1.0 },
      'KTs': { raise2_5: 1.0 },
      'K9s': { raise2_5: 1.0 },
      'KQo': { raise2_5: 1.0 },
      'KJo': { raise2_5: 0.85, fold: 0.15 },
      'QJs': { raise2_5: 1.0 },
      'QTs': { raise2_5: 1.0 },
      'Q9s': { raise2_5: 1.0 },
      'QJo': { raise2_5: 0.70, fold: 0.30 },
      'JTs': { raise2_5: 1.0 },
      'J9s': { raise2_5: 0.80, fold: 0.20 },
      'T9s': { raise2_5: 1.0 },
      'T8s': { raise2_5: 0.70, fold: 0.30 },
      '98s': { raise2_5: 0.90, fold: 0.10 },
      '87s': { raise2_5: 0.85, fold: 0.15 },
      '76s': { raise2_5: 0.80, fold: 0.20 },
      '65s': { raise2_5: 0.75, fold: 0.25 },
      '54s': { raise2_5: 0.70, fold: 0.30 },
    },
    SB: {
      'AA': { raise3: 1.0 },
      'KK': { raise3: 1.0 },
      'QQ': { raise3: 1.0 },
      'JJ': { raise3: 1.0 },
      'TT': { raise3: 1.0 },
      '99': { raise3: 0.85, call: 0.15 },
      '88': { raise3: 0.70, call: 0.30 },
      'AKs': { raise3: 1.0 },
      'AQs': { raise3: 1.0 },
      'AJs': { raise3: 1.0 },
      'A5s': { raise3: 1.0 },
      'AKo': { raise3: 1.0 },
      'AQo': { raise3: 0.90, call: 0.10 },
    },
    BB: {
      // BB vs BTN RFI Defense Frequencies
      'AA': { threeBet: 1.0 },
      'KK': { threeBet: 1.0 },
      'QQ': { threeBet: 0.85, call: 0.15 },
      'JJ': { threeBet: 0.70, call: 0.30 },
      'TT': { call: 0.85, threeBet: 0.15 },
      '99': { call: 1.0 },
      '88': { call: 1.0 },
      '77': { call: 1.0 },
      '66': { call: 1.0 },
      '55': { call: 0.85, fold: 0.15 },
      '44': { call: 0.70, fold: 0.30 },
      '33': { call: 0.60, fold: 0.40 },
      '22': { call: 0.50, fold: 0.50 },
      'AKs': { threeBet: 1.0 },
      'AQs': { threeBet: 0.75, call: 0.25 },
      'AJs': { call: 0.80, threeBet: 0.20 },
      'ATs': { call: 0.85, threeBet: 0.15 },
      'A5s': { threeBet: 0.80, call: 0.20 },
      'A4s': { threeBet: 0.75, call: 0.25 },
      'A3s': { call: 0.80, fold: 0.20 },
      'A2s': { call: 0.75, fold: 0.25 },
      'AKo': { threeBet: 0.90, call: 0.10 },
      'AQo': { call: 0.70, threeBet: 0.30 },
      'AJo': { call: 0.85, fold: 0.15 },
      'ATo': { call: 0.65, fold: 0.35 },
      'KQs': { call: 0.70, threeBet: 0.30 },
      'KJs': { call: 0.85, threeBet: 0.15 },
      'KTs': { call: 0.90, fold: 0.10 },
      'K9s': { call: 0.75, fold: 0.25 },
      'QJs': { call: 0.85, threeBet: 0.15 },
      'QTs': { call: 0.90, fold: 0.10 },
      'JTs': { call: 0.90, threeBet: 0.10 },
      'T9s': { call: 0.95, fold: 0.05 },
      '98s': { call: 0.90, fold: 0.10 },
      '87s': { call: 0.85, fold: 0.15 },
      '76s': { call: 0.80, fold: 0.20 },
      '65s': { call: 0.70, fold: 0.30 },
      '54s': { call: 0.65, fold: 0.35 },
    }
  },
  bbGradientDefense: {
    'AA': { tier: 'PURE_3BET', callFreq: 0.0, raiseFreq: 1.0 },
    'KK': { tier: 'PURE_3BET', callFreq: 0.0, raiseFreq: 1.0 },
    'AKs': { tier: 'PURE_3BET', callFreq: 0.0, raiseFreq: 1.0 },
    'QQ': { tier: 'MIXED', callFreq: 0.15, raiseFreq: 0.85 },
    'AQs': { tier: 'MIXED', callFreq: 0.25, raiseFreq: 0.75 },
    'A5s': { tier: 'MIXED', callFreq: 0.20, raiseFreq: 0.80 },
    'TT': { tier: 'CALL', callFreq: 0.85, raiseFreq: 0.15 },
    '99': { tier: 'CALL', callFreq: 1.0, raiseFreq: 0.0 },
    'JTs': { tier: 'CALL', callFreq: 0.90, raiseFreq: 0.10 },
    '72o': { tier: 'FOLD', callFreq: 0.0, raiseFreq: 0.0 },
  }
};

// TexasSolver Postflop Dataset for A-High Dry Board (A♠ 7♦ 2♣) - BTN vs BB SRP
export const TEXAS_SOLVER_A_DRY_BTNVsBB: PostflopTexasTreeStrategy = {
  boardId: 'A_HIGH_DRY',
  street: 'FLOP',
  position: 'IP',
  nodeSummary: {
    checkFreq: 0.216,
    betSmallFreq: 0.624, // 33% pot
    betLargeFreq: 0.160, // 75% pot
    raiseFreq: 0,
    foldFreq: 0,
  },
  handStrategies: {
    'AA': { cbet33: 0.45, cbet75: 0.50, check: 0.05, ev: 4.85, equity: 94.2 },
    'AKs': { cbet33: 0.70, cbet75: 0.25, check: 0.05, ev: 3.92, equity: 86.5 },
    'AKo': { cbet33: 0.75, cbet75: 0.20, check: 0.05, ev: 3.80, equity: 85.1 },
    'AQs': { cbet33: 0.65, cbet75: 0.25, check: 0.10, ev: 3.55, equity: 82.3 },
    'AQo': { cbet33: 0.70, cbet75: 0.15, check: 0.15, ev: 3.40, equity: 81.0 },
    'A5s': { cbet33: 0.85, cbet75: 0.15, check: 0.0, ev: 3.20, equity: 76.8 }, // Blocker & backdoors
    'A4s': { cbet33: 0.80, cbet75: 0.20, check: 0.0, ev: 3.15, equity: 75.9 },
    '77': { cbet33: 0.40, cbet75: 0.55, check: 0.05, ev: 4.50, equity: 92.1 },
    '22': { cbet33: 0.50, cbet75: 0.45, check: 0.05, ev: 4.10, equity: 90.0 },
    'KK': { cbet33: 0.80, check: 0.20, ev: 2.10, equity: 68.4 },
    'QQ': { cbet33: 0.80, check: 0.20, ev: 1.95, equity: 66.2 },
    'JJ': { cbet33: 0.75, check: 0.25, ev: 1.80, equity: 64.0 },
    'TT': { cbet33: 0.70, check: 0.30, ev: 1.65, equity: 61.5 },
    '98s': { cbet33: 0.60, check: 0.40, ev: 0.85, equity: 34.2 },
    '87s': { cbet33: 0.35, check: 0.65, ev: 1.45, equity: 52.0 }, // Middle pair
    '54s': { cbet33: 0.90, check: 0.10, ev: 0.95, equity: 38.5 }, // Backdoor wheel straight
    '76s': { cbet33: 0.30, check: 0.70, ev: 1.30, equity: 48.0 },
    'KQs': { cbet33: 0.55, check: 0.45, ev: 0.75, equity: 32.1 },
    'QJs': { cbet33: 0.50, check: 0.50, ev: 0.65, equity: 29.8 },
    '72o': { check: 1.0, ev: 0.0, equity: 5.0 },
  }
};

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'user_hero',
    name: 'Hero_GTO',
    avatar: '🎯',
    totalHands: 142,
    correctHands: 121,
    totalEvLossMBB: 48, // 48 mBB total loss
    preflopAccuracy: 92.4,
    postflopAccuracy: 84.1,
    favoritePos: 'BTN',
    leakTags: ['Over-cbetting wet flops', 'Under-3betting A5s SB vs BTN'],
  },
  {
    id: 'user_student',
    name: 'Student_Alex',
    avatar: '🎓',
    totalHands: 65,
    correctHands: 48,
    totalEvLossMBB: 180,
    preflopAccuracy: 81.5,
    postflopAccuracy: 69.2,
    favoritePos: 'CO',
    leakTags: ['Over-folding BB vs BTN 3Bet', 'Sizing C-Bet too large on dry A-high'],
  }
];

// Official RangeConverter 6-Max 100bb 500z PDF Chart Scenarios
export interface PdfChartConfig {
  id: string;
  category: 'RFI' | 'VS_RFI' | 'VS_3BET';
  name: string;
  subtitle: string;
  pdfPage: number;
  stats: {
    foldFreq: number;
    callFreq?: number;
    raiseFreq: number;
    raiseLabel: string;
  };
  description: string;
}

export const RANGE_CONVERTER_PDF_CHARTS: PdfChartConfig[] = [
  // Page 3: RFI
  {
    id: 'RFI_UTG',
    category: 'RFI',
    name: 'UTG RFI',
    subtitle: '6-max 100bb Range (Page 3)',
    pdfPage: 3,
    stats: { foldFreq: 82.87, raiseFreq: 17.13, raiseLabel: '2.5bb Raise' },
    description: 'UTG 枪口位开放加注：17.13% 最紧坚果及高胜率可发展手牌（77+, AKs-ATs, A5s-A4s, KQs-KJs, QJs, JTs, AKo, AQo）。',
  },
  {
    id: 'RFI_MP',
    category: 'RFI',
    name: 'MP RFI (HJ)',
    subtitle: '6-max 100bb Range (Page 3)',
    pdfPage: 3,
    stats: { foldFreq: 78.65, raiseFreq: 21.35, raiseLabel: '2.5bb Raise' },
    description: 'MP 中位开放加注：21.35%（66+, A2s+, KTs+, QTs+, JTs, T9s, 98s, AKo-AJo, KQo）。',
  },
  {
    id: 'RFI_CO',
    category: 'RFI',
    name: 'CO RFI',
    subtitle: '6-max 100bb Range (Page 3)',
    pdfPage: 3,
    stats: { foldFreq: 72.18, raiseFreq: 27.82, raiseLabel: '2.5bb Raise' },
    description: 'CO 关口位开放加注：27.82%（55+, A2s+, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, AKo-ATo, KQo-KJo, QJo）。',
  },
  {
    id: 'RFI_BTN',
    category: 'RFI',
    name: 'BTN RFI',
    subtitle: '6-max 100bb Range (Page 3)',
    pdfPage: 3,
    stats: { foldFreq: 58.46, raiseFreq: 41.54, raiseLabel: '2.5bb Raise' },
    description: 'BTN 庄家位开放加注：41.54%（22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 65s, 54s, A2o+, K8o+, Q9o+, J9o+, T9o）。',
  },
  {
    id: 'RFI_SB',
    category: 'RFI',
    name: 'SB RFI',
    subtitle: '6-max 100bb Range (Page 3)',
    pdfPage: 3,
    stats: { foldFreq: 43.32, callFreq: 29.49, raiseFreq: 27.20, raiseLabel: '3.0bb Raise' },
    description: 'SB 小盲位开放：包含 29.49% 平跟 Limp 混流与 27.20% 3.0bb 加注。',
  },

  // Page 4-8: VS RFI
  {
    id: 'VS_RFI_MP_UTG',
    category: 'VS_RFI',
    name: 'MP vs UTG RFI',
    subtitle: '6-max 100bb Range (Page 4)',
    pdfPage: 4,
    stats: { foldFreq: 91.86, raiseFreq: 8.14, raiseLabel: '8.5bb 3-Bet' },
    description: 'MP 面对 UTG 开放加注：弃牌 91.86%，8.5bb 3-Bet 极化比例 8.14%。',
  },
  {
    id: 'VS_RFI_CO_UTG',
    category: 'VS_RFI',
    name: 'CO vs UTG RFI',
    subtitle: '6-max 100bb Range (Page 5)',
    pdfPage: 5,
    stats: { foldFreq: 91.45, raiseFreq: 8.55, raiseLabel: '8.5bb 3-Bet' },
    description: 'CO 面对 UTG 开放加注：弃牌 91.45%，8.5bb 3-Bet 8.55%。',
  },
  {
    id: 'VS_RFI_CO_MP',
    category: 'VS_RFI',
    name: 'CO vs MP RFI',
    subtitle: '6-max 100bb Range (Page 5)',
    pdfPage: 5,
    stats: { foldFreq: 90.10, raiseFreq: 9.90, raiseLabel: '8.5bb 3-Bet' },
    description: 'CO 面对 MP 开放加注：弃牌 90.10%，8.5bb 3-Bet 9.90%。',
  },
  {
    id: 'VS_RFI_BTN_UTG',
    category: 'VS_RFI',
    name: 'BTN vs UTG RFI',
    subtitle: '6-max 100bb Range (Page 6)',
    pdfPage: 6,
    stats: { foldFreq: 85.78, callFreq: 6.90, raiseFreq: 7.32, raiseLabel: '8.5bb 3-Bet' },
    description: 'BTN 面对 UTG 开放：弃牌 85.78%，平跟 6.90%，8.5bb 3-Bet 7.32%。',
  },
  {
    id: 'VS_RFI_BTN_CO',
    category: 'VS_RFI',
    name: 'BTN vs CO RFI',
    subtitle: '6-max 100bb Range (Page 6)',
    pdfPage: 6,
    stats: { foldFreq: 82.84, callFreq: 5.44, raiseFreq: 11.72, raiseLabel: '8.5bb 3-Bet' },
    description: 'BTN 面对 CO 开放：弃牌 82.84%，平跟 5.44%，8.5bb 3-Bet 11.72%。',
  },
  {
    id: 'VS_RFI_BB_BTN',
    category: 'VS_RFI',
    name: 'BB vs BTN RFI',
    subtitle: '6-max 100bb Range (Page 8)',
    pdfPage: 8,
    stats: { foldFreq: 52.30, callFreq: 33.61, raiseFreq: 14.09, raiseLabel: '11.0bb 3-Bet' },
    description: 'BB 面对 BTN 开放加注：弃牌 52.30%，平跟 Call 33.61%，11.0bb 3-Bet 14.09% (3-Tier 防守)。',
  },
  {
    id: 'VS_RFI_BB_SB',
    category: 'VS_RFI',
    name: 'BB vs SB RFI',
    subtitle: '6-max 100bb Range (Page 8)',
    pdfPage: 8,
    stats: { foldFreq: 37.95, callFreq: 47.62, raiseFreq: 14.43, raiseLabel: '10.0bb 3-Bet' },
    description: 'BB 面对 SB 开放加注：弃牌 37.95%，高频平跟 47.62%，10.0bb 3-Bet 14.43%。',
  },

  // Page 9-13: VS 3BET
  {
    id: 'VS_3BET_UTG_MP',
    category: 'VS_3BET',
    name: 'UTG vs MP 3Bet',
    subtitle: '6-max 100bb Range (Page 9)',
    pdfPage: 9,
    stats: { foldFreq: 63.08, callFreq: 15.11, raiseFreq: 21.81, raiseLabel: '23.6bb 4-Bet' },
    description: 'UTG 面对 MP 3-Bet：弃牌 63.08%，平跟 15.11%，23.6bb 4-Bet 21.81%。',
  },
  {
    id: 'VS_3BET_BTN_SB',
    category: 'VS_3BET',
    name: 'BTN vs SB 3Bet',
    subtitle: '6-max 100bb Range (Page 12)',
    pdfPage: 12,
    stats: { foldFreq: 52.35, callFreq: 37.47, raiseFreq: 10.17, raiseLabel: '25.0bb 4-Bet' },
    description: 'BTN 面对 SB 3-Bet：弃牌 52.35%，平跟 37.47%，25.0bb 4-Bet 10.17%。',
  },
  {
    id: 'VS_3BET_SB_BB',
    category: 'VS_3BET',
    name: 'SB vs BB 3Bet',
    subtitle: '6-max 100bb Range (Page 13)',
    pdfPage: 13,
    stats: { foldFreq: 58.63, callFreq: 24.69, raiseFreq: 16.68, raiseLabel: '26.0bb 4-Bet' },
    description: 'SB 面对 BB 3-Bet：弃牌 58.63%，平跟 24.69%，26.0bb 4-Bet 16.68%。',
  },
];

// Helper to draw realistic card combo
export function drawRandomCardCombo(excludeCards: Card[] = []): [Card, Card] {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      if (!excludeCards.some(c => c.rank === r && c.suit === s)) {
        deck.push({ rank: r, suit: s });
      }
    }
  }
  
  // Pick two distinct
  const idx1 = Math.floor(Math.random() * deck.length);
  const card1 = deck[idx1];
  deck.splice(idx1, 1);
  const idx2 = Math.floor(Math.random() * deck.length);
  const card2 = deck[idx2];
  
  return [card1, card2];
}

export function formatCardString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function getHandNotationFromCards(c1: Card, c2: Card): string {
  const r1Idx = RANKS.indexOf(c1.rank);
  const r2Idx = RANKS.indexOf(c2.rank);
  
  // Higher rank first
  const highCard = r1Idx <= r2Idx ? c1 : c2;
  const lowCard = r1Idx <= r2Idx ? c2 : c1;
  
  if (highCard.rank === lowCard.rank) {
    return `${highCard.rank}${lowCard.rank}`;
  }
  
  const suited = highCard.suit === lowCard.suit ? 's' : 'o';
  return `${highCard.rank}${lowCard.rank}${suited}`;
}

// Smart GTO Preflop strategy resolver with realistic Solver thresholds for offsuit/suited borderline hands
export function getGtoPreflopStrategyForHand(pos: Position, handNotation: string): StrategyFrequencies {
  const posMap = DEFAULT_RANGE_CONVERTER_PROFILE.matrixData[pos];
  if (posMap && posMap[handNotation]) {
    return posMap[handNotation];
  }

  const isPair = handNotation.length === 2;
  const isSuited = handNotation.endsWith('s');
  const r1 = handNotation[0] as CardRank;
  const r2 = handNotation[1] as CardRank;
  const r1Val = 14 - RANKS.indexOf(r1);
  const r2Val = 14 - RANKS.indexOf(r2);

  if (pos === 'BTN') {
    if (isPair) {
      return { raise2_5: 0.60, fold: 0.40 };
    }
    if (isSuited) {
      if (r1Val >= 10 || r2Val >= 9) {
        return { raise2_5: 0.75, fold: 0.25 };
      }
      return { raise2_5: 0.50, fold: 0.50 };
    }
    // Offsuit Hands on BTN
    if (handNotation === '65o' || handNotation === '76o' || handNotation === '87o' || handNotation === '54o') {
      return { fold: 0.85, raise2_5: 0.15 }; // 85% Fold / 15% Mix Raise for offsuit connectors on BTN
    }
    if (r1Val >= 12 && r2Val >= 8) { // K8o, Q9o, J9o
      return { raise2_5: 0.60, fold: 0.40 };
    }
    if (r1Val === 14) { // Ax offsuit e.g. A3o, A2o
      return { raise2_5: 0.55, fold: 0.45 };
    }
    // Pure Trash Offsuit Hands (e.g., J2o, Q3o, K2o, 94o, 72o)
    return { fold: 1.0, raise2_5: 0.0 };
  }

  if (pos === 'CO' || pos === 'HJ' || pos === 'UTG') {
    if (isSuited && r1Val >= 11) {
      return { raise2_5: 0.50, fold: 0.50 };
    }
    return { fold: 1.0, raise2_5: 0.0 };
  }

  if (pos === 'SB') {
    if (isSuited) return { raise3: 0.40, call: 0.30, fold: 0.30 };
    return { fold: 0.80, raise3: 0.20 };
  }

  if (pos === 'BB') {
    if (isSuited) return { call: 0.60, fold: 0.40 };
    if (r1Val >= 10) return { call: 0.50, fold: 0.50 };
    return { fold: 0.85, call: 0.15 };
  }

  return { fold: 1.0 };
}

