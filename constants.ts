
import { GameState, AIDirective, Competitor, MarketSegment, Product, RDProject, CompanyFinancials, GameEvent, GameEventType } from './types';

export const INITIAL_COMPANY_NAME = "(주)유밥"; 
export const START_TURN = 1;
export const MAX_TURNS = 100; 
export const TARGET_MARKET_SHARE_FOR_WIN = 70; // 승리를 위한 목표 시장 점유율

export const INITIAL_FINANCIALS: CompanyFinancials = {
  cash: 100000, // 기존 50000에서 증가
  debt: 100000,  // 기존 200000에서 감소
  monthlyRevenue: 0, 
  monthlyCosts: 0, 
  monthlyProfit: 0, 
  totalAssets: 300000, // 초기 자산은 현금 증가분만큼 조정될 수 있으나, 여기서는 부채 감소로 상쇄 가정
  totalLiabilities: 200000, // 초기 부채 감소분 반영
  stockPrice: 5.00,
  sharesOutstanding: 100000,
  marketCap: 5.00 * 100000,
  ceoShares: 60000, 
  competitorShareHoldings: {}, 
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod1', name: '레거시 가젯 알파', segmentId: 'seg1', quality: 50, productionCost: 12, salePrice: 25, unitsSoldPerQuarter: 0, status: '출시됨' }, // 품질 증가, 생산비용 감소
];

export const INITIAL_MARKET_SEGMENTS: MarketSegment[] = [
  { id: 'seg1', name: '소비자 가전', icon: '📱', totalMarketValue: 50000000, playerMarketShare: 2, growthPotential: '중간', trends: ['소형화', '연결성'] },
  { id: 'seg2', name: '지속 가능 솔루션', icon: '🌿', totalMarketValue: 20000000, playerMarketShare: 0, growthPotential: '높음', trends: ['친환경 소재', '탄소 중립'] },
];

export const INITIAL_COMPETITORS: Competitor[] = [
  { id: 'comp1', name: '이노바테크 Inc.', logoSeed: 'innovatech', marketShare: 30, stockPrice: 55.00, strength: '강함' },
  { id: 'comp2', name: '글로벌 디바이스 Co.', logoSeed: 'globaldev', marketShare: 25, stockPrice: 40.00, strength: '보통' },
  { id: 'comp3', name: '버젯트로닉스', logoSeed: 'budgetronics', marketShare: 15, stockPrice: 12.00, strength: '약함' },
];

export const INITIAL_RD_PROJECTS: RDProject[] = [
  { id: 'rd1', name: '프로젝트 피닉스', description: '레거시 가젯 알파 품질 개선.', progress: 10, costToComplete: 30000, monthlyFunding: 5000, potentialImpact: '레거시 가젯 알파 품질 +20', status: '진행 중' }, 
  { id: 'rd2', name: '그린 이니셔티브 연구', description: '신제품을 위한 지속 가능한 소재 탐색.', progress: 0, costToComplete: 100000, monthlyFunding: 0, potentialImpact: '새로운 친환경 제품 라인 잠금 해제', status: '대기 중' }, 
];

export const INITIAL_GAME_STATE: GameState = {
  companyName: INITIAL_COMPANY_NAME,
  currentTurn: START_TURN,
  currentAiDirective: AIDirective.STABILIZE_COMPANY,
  financials: { ...INITIAL_FINANCIALS },
  products: [...INITIAL_PRODUCTS.map(p => ({...p}))],
  competitors: [...INITIAL_COMPETITORS.map(c => ({...c}))],
  marketSegments: [...INITIAL_MARKET_SEGMENTS.map(m => ({...m}))],
  rdProjects: [...INITIAL_RD_PROJECTS.map(r => ({...r}))],
  eventLog: [{
    id: 'evt-start',
    turn: 0,
    type: GameEventType.GAME_MESSAGE,
    title: 'CEO 취임을 환영합니다!',
    description: `파산 직전의 ${INITIAL_COMPANY_NAME}을(를) 인수하셨습니다. 행운을 빕니다.`,
    severity: 'info'
  }],
  globalMarketSentiment: '중립적',
  isGameOver: false,
  gameOverMessage: '',
  isDelegated: false, 
};

export const AI_DIRECTIVE_OPTIONS: AIDirective[] = Object.values(AIDirective);

export const TICKER_SYMBOL = "SNRG";