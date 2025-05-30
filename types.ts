export enum AIDirective {
  STABILIZE_COMPANY = "회사 안정화",
  PROFIT_MAXIMIZATION = "수익 극대화",
  MARKET_SHARE_EXPANSION = "시장 점유율 확장",
  TECH_INNOVATION_PRIORITY = "기술 혁신 우선",
  COST_REDUCTION = "비용 절감",
  AGGRESSIVE_MARKET_EXPANSION = "공격적인 시장 확장",
}

export interface CompanyFinancials {
  cash: number;
  debt: number;
  monthlyRevenue: number; 
  monthlyCosts: number; 
  monthlyProfit: number; 
  totalAssets: number;
  totalLiabilities: number;
  stockPrice: number;
  sharesOutstanding: number;
  marketCap: number;
  ceoShares: number; // CEO가 보유한 주식 수
  competitorShareHoldings: { [competitorId: string]: number }; // CEO가 보유한 경쟁사 주식
}

export interface Competitor {
  id: string;
  name: string;
  logoSeed: string;
  marketShare: number; // percentage
  stockPrice: number;
  strength: '약함' | '보통' | '강함'; 
}

export interface MarketSegment {
  id:string;
  name: string;
  icon: string;
  totalMarketValue: number;
  playerMarketShare: number; // percentage
  growthPotential: '낮음' | '중간' | '높음'; 
  trends: string[];
}

export interface Product {
  id: string;
  name: string;
  segmentId: string;
  quality: number; // 0-100
  productionCost: number;
  salePrice: number;
  unitsSoldPerQuarter: number; 
  status: '개발 중' | '출시됨' | '단종됨'; 
}

export interface RDProject {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-100
  costToComplete: number;
  monthlyFunding: number; 
  potentialImpact: string;
  status: '대기 중' | '진행 중' | '완료됨' | '취소됨'; 
}

export enum GameEventType {
  AI_ACTION = 'AI 활동', // AI 지침에 따른 일반 활동 및 위임된 AI 활동
  MARKET_NEWS = '시장 뉴스',
  COMPETITOR_MOVE = '경쟁사 동향',
  FINANCIAL_REPORT = '재무 보고서',
  PLAYER_DECISION = '플레이어 결정', // 플레이어가 직접 내린 결정
  CRISIS_EVENT = '위기 상황',
  GAME_MESSAGE = '시스템 메시지',
  STOCK_TRADE = '주식 거래'
}

export interface GameEvent {
  id: string;
  turn: number;
  type: GameEventType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  data?: any;
}

export interface GameState {
  companyName: string;
  currentTurn: number;
  currentAiDirective: AIDirective;
  financials: CompanyFinancials;
  products: Product[];
  competitors: Competitor[];
  marketSegments: MarketSegment[];
  rdProjects: RDProject[];
  eventLog: GameEvent[];
  globalMarketSentiment: '긍정적' | '중립적' | '부정적'; 
  isGameOver: boolean;
  gameOverMessage: string;
  isDelegated: boolean; // AI 위임 활성화 여부
}

export interface StrategicDecision {
  id: string;
  title: string;
  description: string;
  cost?: number;
  action: (gameState: GameState) => GameState;
  category: '재무' | 'R&D' | '마케팅' | '운영' | 'M&A'; 
}