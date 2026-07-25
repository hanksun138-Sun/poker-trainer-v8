export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export type CardSuit = 's' | 'h' | 'd' | 'c';
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

export type ActionType = 
  | 'FOLD' 
  | 'CHECK' 
  | 'CALL' 
  | 'RAISE_2'
  | 'RAISE_2_5' 
  | 'RAISE_3' 
  | 'THREE_BET' 
  | 'FOUR_BET' 
  | 'CBET_25' 
  | 'CBET_33' 
  | 'CBET_66'
  | 'CBET_75' 
  | 'CBET_125'
  | 'CBET_150'
  | 'OVERBET_125' 
  | 'ALL_IN';

export interface StrategyFrequencies {
  fold?: number;      // 0.0 to 1.0
  check?: number;
  call?: number;
  raise2_5?: number;  // RFI or Small Raise
  raise3?: number;
  threeBet?: number;
  fourBet?: number;
  cbet25?: number;
  cbet33?: number;
  cbet75?: number;
  overbet?: number;
  allIn?: number;
}

export interface HandMatrixCell {
  hand: string; // e.g. "AKs", "AA", "76o"
  category: 'pair' | 'suited' | 'offsuit';
  combosCount: number; // 6 for pairs, 4 for suited, 12 for offsuit
  frequencies: StrategyFrequencies;
  ev?: number; // Expected Value in BB
  equity?: number; // 0-100%
}

export interface RangeConverterProfile {
  id: string;
  name: string;
  version: string;
  description: string;
  positions: Position[];
  matrixData: Record<Position, Record<string, StrategyFrequencies>>; // pos -> hand -> freqs
  bbGradientDefense?: Record<string, { tier: 'PURE_3BET' | 'MIXED' | 'CALL' | 'FOLD'; callFreq: number; raiseFreq: number }>;
}

export type FlopTextureId = 'A_HIGH_DRY' | 'K_HIGH_DRY' | 'PAIRED_DRY' | 'WET_CONNECTOR' | 'MONOTONE';

export interface FlopBoardConfig {
  id: FlopTextureId;
  name: string;
  cards: [Card, Card, Card];
  description: string;
  rangeAdvantage: 'IP' | 'OOP' | 'EVEN';
  ipCbetFreq: number; // total IP cbet freq
  oopCheckFreq: number; // total OOP check freq
}

export interface PostflopNodeAction {
  action: ActionType;
  label: string;
  frequency: number;
  ev: number;
}

export interface PostflopTexasTreeStrategy {
  boardId: FlopTextureId;
  street: 'FLOP' | 'TURN' | 'RIVER';
  position: 'IP' | 'OOP'; // IP e.g. BTN, OOP e.g. BB
  handStrategies: Record<string, StrategyFrequencies & { ev: number; equity: number }>;
  nodeSummary: {
    checkFreq: number;
    betSmallFreq: number; // 25-33%
    betLargeFreq: number; // 75%+
    raiseFreq: number;
    foldFreq: number;
  };
}

export interface PracticeHand {
  id: string;
  timestamp: number;
  heroPosition: Position;
  heroHand: [Card, Card];
  heroHandNotation: string; // e.g., "AKs" or "A♠ K♠"
  villainPosition?: Position;
  potSize: number; // in BB
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';
  board: Card[];
  availableActions: { action: ActionType; label: string; gtoFreq: number; ev: number }[];
  userAction?: ActionType;
  userEvLoss?: number; // in BB or mBB
  isCorrect?: boolean;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  totalHands: number;
  correctHands: number;
  totalEvLossMBB: number; // cumulative EV Loss in milli-BB (mBB)
  preflopAccuracy: number; // percentage 0-100
  postflopAccuracy: number; // percentage 0-100
  favoritePos: Position;
  leakTags: string[];
}

export interface GtoAuditRequest {
  handDetails: {
    heroPosition: Position;
    villainPosition?: Position;
    heroHand: string;
    board?: string;
    street: string;
    potSize: number;
    userAction: string;
    gtoOptimalActions: { action: string; frequency: number; ev: number }[];
  };
  customQuestion?: string;
  userStatsSummary?: {
    accuracy: number;
    leakTags: string[];
  };
}

export interface GtoAuditResponse {
  evaluation: 'PERFECT' | 'ACCEPTABLE' | 'BLUNDER';
  analysis: string;
  keyConcepts: {
    rangeAdvantage: string;
    blockerEffect: string;
    evComparison: string;
  };
  recommendedDrill: string;
}
