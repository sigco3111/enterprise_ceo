
import { GameState, AIDirective, GameEvent, GameEventType, Product, RDProject, StrategicDecision, CompanyFinancials, Competitor, MarketSegment } from '../types';
import { MAX_TURNS, INITIAL_COMPETITORS, TARGET_MARKET_SHARE_FOR_WIN } from '../constants'; 

// Helper to format currency for logs, if needed, though not strictly required if messages are generic
const formatCurrencyForLog = (value: number, digits = 0) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const createEvent = (turn: number, type: GameEventType, title: string, description: string, severity: 'info' | 'warning' | 'critical' | 'success' = 'info', data?: any, isAIAction: boolean = false): GameEvent => {
  let eventTitle = title;
  let eventType = type;

  if (isAIAction === true && (type === GameEventType.PLAYER_DECISION || type === GameEventType.STOCK_TRADE)) {
    eventType = GameEventType.AI_ACTION;
    eventTitle = `AI 위임: ${title}`;
  }
  
  return {
    id: `evt-${turn}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    turn,
    type: eventType,
    title: eventTitle,
    description,
    severity,
    data,
  };
};

const simulateAIBehavior = (gameState: GameState): GameState => {
  let newLog: GameEvent[] = [];
  const { currentAiDirective, financials, products, rdProjects } = gameState;

  let revenueChangeFactor = 1.0;
  let costChangeFactor = 1.0;
  let innovationFocus = 0;

  switch (currentAiDirective) {
    case AIDirective.PROFIT_MAXIMIZATION:
      revenueChangeFactor = 1.02;
      costChangeFactor = 0.98;
      newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 수익성", "AI가 수익성 최적화를 진행 중입니다. 약간의 매출 증대와 비용 절감이 예상됩니다."));
      break;
    case AIDirective.MARKET_SHARE_EXPANSION:
      revenueChangeFactor = 1.05;
      costChangeFactor = 1.01;
      gameState.marketSegments = gameState.marketSegments.map(ms => ms.playerMarketShare > 0 ? {...ms, playerMarketShare: Math.min(100, ms.playerMarketShare * 1.01)} : ms);
      newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 시장 점유율", "AI가 시장 확장을 추진 중입니다. 공격적인 판매 및 마케팅이 시뮬레이션됩니다."));
      break;
    case AIDirective.COST_REDUCTION:
      costChangeFactor = 0.95;
      newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 비용 절감", "AI가 운영 전반에 걸쳐 비용 절감 조치를 시행 중입니다."));
      break;
    case AIDirective.TECH_INNOVATION_PRIORITY:
      innovationFocus = 0.1;
      newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 혁신", "AI가 R&D 노력을 우선시하고 있습니다. 프로젝트 완료가 빨라질 것으로 예상됩니다."));
      break;
    case AIDirective.STABILIZE_COMPANY:
        if (financials.cash > financials.debt * 0.1 && financials.debt > 0) {
            const debtPayment = Math.min(financials.debt * 0.02, financials.cash * 0.1);
            financials.cash -= debtPayment;
            financials.debt -= debtPayment;
            newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 조치: 부채 상환", `AI가 $${debtPayment.toLocaleString()}의 소규모 부채를 상환했습니다.`));
        } else {
            newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 안정화", "AI가 현재 운영 수준을 유지하며 안정성에 집중하고 있습니다."));
        }
        break;
     case AIDirective.AGGRESSIVE_MARKET_EXPANSION:
        revenueChangeFactor = 1.08;
        costChangeFactor = 1.03;
        gameState.marketSegments = gameState.marketSegments.map(ms => ms.playerMarketShare > 0 ? {...ms, playerMarketShare: Math.min(100, ms.playerMarketShare * 1.03)} : ms);
        newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "AI 초점: 공격적 확장", "AI가 공격적인 마케팅 캠페인과 판매 촉진을 시작합니다."));
        break;
  }

  const updatedRdProjects = rdProjects.map(p => {
    if (p.status === '진행 중' && p.monthlyFunding > 0 && financials.cash >= p.monthlyFunding) { 
      financials.cash -= p.monthlyFunding; 
      let progressIncrease = (p.monthlyFunding / (p.costToComplete + p.monthlyFunding)) * 25 + (innovationFocus * 100) ; 
      progressIncrease = Math.max(5, progressIncrease);

      p.progress = Math.min(100, p.progress + progressIncrease);
      if (p.progress >= 100) {
        p.status = '완료됨';
        newLog.push(createEvent(gameState.currentTurn, GameEventType.AI_ACTION, "R&D 완료!", `${p.name}이(가) 성공적으로 개발되었습니다. 영향: ${p.potentialImpact}`, 'success'));
      }
    }
    return p;
  });
  const totalRdFundingThisMonth = rdProjects
    .filter(p => p.status === '진행 중' && p.monthlyFunding > 0)
    .reduce((sum, p) => sum + p.monthlyFunding, 0);
  financials.monthlyCosts += totalRdFundingThisMonth;


  return { ...gameState, financials: {...financials}, rdProjects: updatedRdProjects, eventLog: [...gameState.eventLog, ...newLog] };
};

const simulateMarketAndEconomy = (gameState: GameState): GameState => {
  let newLog: GameEvent[] = [];
  const { globalMarketSentiment, products } = gameState;
  let { financials, competitors } = gameState;

  let totalRevenueThisTurn = 0;
  let totalCostsThisTurn = financials.monthlyCosts; 

  products.forEach(p => {
    if (p.status === '출시됨') {
      let demandFactor = (p.quality / p.salePrice) * 10;
      if (globalMarketSentiment === '긍정적') demandFactor *= 1.2;
      if (globalMarketSentiment === '부정적') demandFactor *= 0.8;

      const unitsSold = Math.floor(Math.random() * 500 + demandFactor * 50);
      p.unitsSoldPerQuarter = unitsSold; 
      totalRevenueThisTurn += unitsSold * p.salePrice;
      totalCostsThisTurn += unitsSold * p.productionCost; 
    }
  });

  const newFinancials: CompanyFinancials = { ...financials };

  newFinancials.monthlyRevenue = totalRevenueThisTurn; 
  newFinancials.monthlyCosts = totalCostsThisTurn; 
  newFinancials.monthlyProfit = newFinancials.monthlyRevenue - newFinancials.monthlyCosts; 
  newFinancials.cash += newFinancials.monthlyProfit; 

  let profitImpactFactor = (newFinancials.monthlyProfit / (newFinancials.marketCap || 1)) * 0.15; 
  if (newFinancials.monthlyProfit < 0) {
      profitImpactFactor *= 0.8; 
  } else if (newFinancials.monthlyProfit > 0) {
      profitImpactFactor *= 1.1; 
  }
  newFinancials.stockPrice = Math.max(0.1, newFinancials.stockPrice * (1 + profitImpactFactor));


  if(isNaN(newFinancials.stockPrice) || !isFinite(newFinancials.stockPrice)) newFinancials.stockPrice = 0.1;
  newFinancials.marketCap = newFinancials.stockPrice * newFinancials.sharesOutstanding;

  const updatedCompetitors = competitors.map(comp => {
    const fluctuation = (Math.random() - 0.48) * 0.08; 
    let newPrice = comp.stockPrice * (1 + fluctuation);
    newPrice = Math.max(0.01, newPrice); 
    return { ...comp, stockPrice: parseFloat(newPrice.toFixed(2)) };
  });

  if (Math.random() < 0.15) {
    const eventType = Math.random() < 0.5 ? GameEventType.MARKET_NEWS : GameEventType.COMPETITOR_MOVE;
    if (eventType === GameEventType.MARKET_NEWS) {
        const sentimentShift = Math.random() < 0.5 ? '긍정적' : '부정적';
        gameState.globalMarketSentiment = sentimentShift;
        newLog.push(createEvent(gameState.currentTurn, GameEventType.MARKET_NEWS, `시장 심리 변화`, `경제 지표가 ${sentimentShift.toLowerCase()}인 시장 심리를 가리킵니다.`, sentimentShift === '긍정적' ? 'info' : 'warning'));
    } else {
        const competitor = updatedCompetitors[Math.floor(Math.random() * updatedCompetitors.length)];
        newLog.push(createEvent(gameState.currentTurn, GameEventType.COMPETITOR_MOVE, `${competitor.name} 발표`, `${competitor.name}이(가) 새로운 마케팅 캠페인을 시작하여 시장 역학에 영향을 미칠 수 있습니다.`, 'info'));
    }
  }

   newLog.push(createEvent(
    gameState.currentTurn,
    GameEventType.FINANCIAL_REPORT,
    `${gameState.currentTurn}월 재무 보고서`, 
    `매출: $${newFinancials.monthlyRevenue.toLocaleString()}, 순익: $${newFinancials.monthlyProfit.toLocaleString()}, 현금: $${newFinancials.cash.toLocaleString()}`, 
    'info',
    { financials: { ...newFinancials } } 
  ));

  return { ...gameState, financials: newFinancials, competitors: updatedCompetitors, eventLog: [...gameState.eventLog, ...newLog] };
};

const checkWinLossConditions = (gameState: GameState): GameState => {
  if (gameState.isGameOver) return gameState; 

  // Market Share Win Condition
  for (const segment of gameState.marketSegments) {
    if (segment.playerMarketShare >= TARGET_MARKET_SHARE_FOR_WIN) {
      const fin = gameState.financials;
      const winMessage = `승리! ${gameState.currentTurn}개월 만에 ${segment.name} 시장 점유율 ${TARGET_MARKET_SHARE_FOR_WIN}%를 달성하셨습니다!\n\n` +
                         `최종 재무 개요:\n` +
                         `  현금: $${fin.cash.toLocaleString()}\n` +
                         `  부채: $${fin.debt.toLocaleString()}\n` +
                         `  월 순익: $${fin.monthlyProfit.toLocaleString()}\n` +
                         `  주가: $${fin.stockPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n` +
                         `  시가총액: $${fin.marketCap.toLocaleString()}`;
      return { ...gameState, isGameOver: true, gameOverMessage: winMessage };
    }
  }

  if (gameState.financials.cash < 0 && gameState.financials.monthlyProfit < 0) {
    return { ...gameState, isGameOver: true, gameOverMessage: "파산! 회사 현금이 바닥나고 지속적인 손실이 발생했습니다. 게임 종료." };
  }
  
  if (gameState.financials.sharesOutstanding > 0 && 
      (gameState.financials.ceoShares < gameState.financials.sharesOutstanding * 0.5)) { 
    return { ...gameState, isGameOver: true, gameOverMessage: "경영권 상실! CEO가 회사에 대한 통제권을 잃었습니다 (지분 50% 미만). 게임 종료." };
  }

  if (gameState.currentTurn >= MAX_TURNS) {
    // Existing MAX_TURNS win condition is now secondary or could be a "stalemate" type ending if not removed.
    // For now, let's keep it as a fallback if market share win isn't achieved.
    if (gameState.financials.marketCap > 10000000 && gameState.marketSegments.some(s => s.playerMarketShare > 50)) {
         return { ...gameState, isGameOver: true, gameOverMessage: "축하합니다, CEO님! 글로벌 강자로 회사를 키워내셨습니다! 승리!" };
    }
    return { ...gameState, isGameOver: true, gameOverMessage: "CEO 임기가 종료되었습니다. 회사의 미래는 안정적입니다. 게임 종료." };
  }
  return gameState;
};

export const getAvailableStrategicDecisions = (gameState: GameState): StrategicDecision[] => {
    const decisions: StrategicDecision[] = [];
    const { financials, rdProjects, products, marketSegments, currentTurn } = gameState;

    const pendingRD = rdProjects.find(p => p.status === '대기 중');
    if (pendingRD && financials.cash > (pendingRD.costToComplete * 0.1)) {
        decisions.push({
            id: `fund_rd_${pendingRD.id}`,
            title: `R&D 자금 지원: ${pendingRD.name}`,
            description: `${pendingRD.name} 시작을 위한 초기 자금 할당. 잠재력: ${pendingRD.potentialImpact}`,
            cost: pendingRD.costToComplete * 0.1,
            category: 'R&D',
            action: (gs) => {
                const updatedGs = {...gs, financials: {...gs.financials}, rdProjects: gs.rdProjects.map(p => ({...p}))};
                const project = updatedGs.rdProjects.find(p => p.id === pendingRD.id);
                if (project && updatedGs.financials.cash >= (pendingRD.costToComplete * 0.1)) {
                    project.status = '진행 중';
                    project.monthlyFunding = project.costToComplete * 0.05; 
                    updatedGs.financials.cash -= (project.costToComplete * 0.1);
                    updatedGs.eventLog.push(createEvent(updatedGs.currentTurn, GameEventType.PLAYER_DECISION, "R&D 프로젝트 자금 지원됨", `${project.name}이(가) 이제 활성화되었습니다.`, "success", {}, (gs as any).isAIcalling)); 
                }
                return updatedGs;
            }
        });
    }

    const completedRDForProduct = rdProjects.find(p => p.status === '완료됨' && (p.potentialImpact.toLowerCase().includes("새로운 제품") || p.potentialImpact.toLowerCase().includes("new product")) && !p.potentialImpact.toLowerCase().includes("(출시됨)"));
    if (completedRDForProduct) {
        const newProductNameCandidate = completedRDForProduct.potentialImpact.replace(/새로운 제품: |new product: /i, "").split('(')[0].trim();
        if (!products.find(prod => prod.name === newProductNameCandidate)) {
            decisions.push({
                id: `launch_product_${completedRDForProduct.id}`,
                title: `신제품 출시: ${newProductNameCandidate}`,
                description: `${completedRDForProduct.name}에서 개발된 제품을 출시합니다.`,
                cost: 50000,
                category: '마케팅',
                action: (gs) => {
                    const updatedGs = {...gs, financials: {...gs.financials}, products: [...gs.products], rdProjects: gs.rdProjects.map(p => ({...p}))};
                    if (updatedGs.financials.cash >= 50000) {
                        const newProduct: Product = {
                            id: `prod-${Date.now()}`,
                            name: newProductNameCandidate,
                            segmentId: updatedGs.marketSegments[0]?.id || 'seg1',
                            quality: 70, 
                            productionCost: 30, 
                            salePrice: 60, 
                            unitsSoldPerQuarter: 0,
                            status: '출시됨'
                        };
                        updatedGs.products.push(newProduct);
                        updatedGs.financials.cash -= 50000;
                        const rdProj = updatedGs.rdProjects.find(p => p.id === completedRDForProduct.id);
                        if(rdProj) rdProj.potentialImpact = `${rdProj.potentialImpact} (출시됨)`;

                        updatedGs.eventLog.push(createEvent(updatedGs.currentTurn, GameEventType.PLAYER_DECISION, "신제품 출시!", `${newProduct.name}이(가) 시장에 출시되었습니다.`, "success", {}, (gs as any).isAIcalling));
                    }
                    return updatedGs;
                }
            });
        }
    }

    if(financials.cash > 20000) {
        decisions.push({
            id: 'marketing_campaign_basic',
            title: '기본 마케팅 캠페인 시작',
            description: '제품 인지도 향상을 위한 일반 마케팅 캠페인을 실행합니다. 소폭의 매출 증가가 예상됩니다.',
            cost: 20000,
            category: '마케팅',
            action: (gs) => {
                const updatedGs = {...gs, financials: {...gs.financials}};
                if (updatedGs.financials.cash >= 20000) {
                    updatedGs.financials.cash -= 20000;
                    // updatedGs.financials.monthlyCosts += 20000; // 마케팅 비용은 즉시 발생하나, 효과는 다음턴부터. 월 비용으로 잡을지, 일회성으로 할지. 일단 즉시 지출로만.
                    updatedGs.eventLog.push(createEvent(updatedGs.currentTurn, GameEventType.PLAYER_DECISION, "마케팅 캠페인 시작됨", `기본 캠페인이 시작되었습니다.`, "success", {}, (gs as any).isAIcalling)); 
                }
                return updatedGs;
            }
        });
    }

    if(financials.debt < financials.totalAssets * 0.8 && financials.cash < 50000) {
         decisions.push({
            id: 'issue_debt_small',
            title: '소규모 채권 발행 (50,000달러 조달)',
            description: '채권 발행을 통해 자본을 조달합니다. 부채와 현금이 증가합니다.',
            category: '재무',
            action: (gs) => {
                const updatedGs = {...gs, financials: {...gs.financials}};
                updatedGs.financials.cash += 50000;
                updatedGs.financials.debt += 50000;
                updatedGs.eventLog.push(createEvent(updatedGs.currentTurn, GameEventType.PLAYER_DECISION, "채권 발행됨", `채권 발행을 통해 성공적으로 50,000달러를 조달했습니다.`, "success", {}, (gs as any).isAIcalling));
                return updatedGs;
            }
        });
    }
    
    if (financials.cash > 50000 && financials.debt > 10000) {
        const repayAmount = Math.min(financials.debt, 25000); 
         decisions.push({
            id: 'repay_debt_small',
            title: `소규모 부채 상환 ($${repayAmount.toLocaleString()})`,
            description: `은행 부채 중 일부를 상환하여 이자 부담을 줄입니다.`,
            cost: repayAmount,
            category: '재무',
            action: (gs) => {
                const updatedGs = {...gs, financials: {...gs.financials}};
                if (updatedGs.financials.cash >= repayAmount) {
                    updatedGs.financials.cash -= repayAmount;
                    updatedGs.financials.debt -= repayAmount;
                    updatedGs.eventLog.push(createEvent(updatedGs.currentTurn, GameEventType.PLAYER_DECISION, "부채 상환", `$${repayAmount.toLocaleString()}의 부채를 상환했습니다.`, "success", {}, (gs as any).isAIcalling));
                }
                return updatedGs;
            }
        });
    }


    return decisions;
};

export const applyStrategicDecision = (currentState: GameState, decisionId: string, isAIAction: boolean | undefined = false): GameState => {
    const decisions = getAvailableStrategicDecisions(currentState);
    const decision = decisions.find(d => d.id === decisionId);

    if (decision) {
        if (decision.cost && currentState.financials.cash < decision.cost) {
            if (!isAIAction) {
                const newEventLog = [...currentState.eventLog, createEvent(currentState.currentTurn, GameEventType.GAME_MESSAGE, "결정 실패", "이 결정에 필요한 자금이 부족합니다.", "warning", {}, false)];
                return {...currentState, eventLog: newEventLog};
            }
            return currentState; 
        }
        let tempState = JSON.parse(JSON.stringify(currentState));
        (tempState as any).isAIcalling = isAIAction; 

        let afterActionState = decision.action(tempState);
        
        delete (afterActionState as any).isAIcalling; 
        afterActionState = checkWinLossConditions(afterActionState); 
        return afterActionState;
    }
    return currentState;
};

export const buyCeoShares = (gameState: GameState, numberOfShares: number, isAIAction: boolean | undefined = false): GameState => {
  const { financials, companyName } = gameState;
  const cost = numberOfShares * financials.stockPrice;

  if (numberOfShares <= 0) {
    if (!isAIAction) gameState.eventLog.push(createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매수 오류", "매수할 주식 수를 정확히 입력하세요.", "warning", {}, false));
    return gameState;
  }
  if (financials.cash < cost) {
    if (!isAIAction) gameState.eventLog.push(createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매수 실패", `주식 매수에 필요한 현금이 부족합니다. (필요: $${cost.toLocaleString()})`, "warning", {}, false));
    return gameState; 
  }

  const newFinancials = {
    ...financials,
    cash: financials.cash - cost,
    ceoShares: financials.ceoShares + numberOfShares,
  };
  
  const newEvent = createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매수", `CEO${isAIAction? '(AI)':''}가 ${companyName} 주식 ${numberOfShares.toLocaleString()}주를 주당 $${financials.stockPrice.toFixed(2)}에 매수했습니다. (총 $${cost.toLocaleString()})`, "success", {}, isAIAction);
  let updatedGameState = { ...gameState, financials: newFinancials, eventLog: [...gameState.eventLog, newEvent] };
  updatedGameState = checkWinLossConditions(updatedGameState); 
  return updatedGameState;
};

export const sellCeoShares = (gameState: GameState, percentageToSell: number, isAIAction: boolean | undefined = false): GameState => {
  const { financials, companyName } = gameState;

  if (percentageToSell <= 0 || percentageToSell > 100) {
     if (!isAIAction) gameState.eventLog.push(createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매도 오류", "매도할 보유 주식 비율은 0% 초과 100% 이하여야 합니다.", "warning", {}, false));
     return gameState;
  }
  
  const numberOfSharesToSell = Math.floor(financials.ceoShares * (percentageToSell / 100));

  if (numberOfSharesToSell <= 0) {
    if (!isAIAction) gameState.eventLog.push(createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매도 오류", `매도할 주식이 없습니다 (계산된 수량: ${numberOfSharesToSell}주). 보유 주식을 확인하세요.`, "warning", {}, false));
    return gameState;
  }

  const proceeds = numberOfSharesToSell * financials.stockPrice;
  const newFinancials = {
    ...financials,
    cash: financials.cash + proceeds,
    ceoShares: financials.ceoShares - numberOfSharesToSell,
  };

  const newEvent = createEvent(gameState.currentTurn, GameEventType.STOCK_TRADE, "자사주 매도", `CEO${isAIAction? '(AI)':''}가 ${companyName} 주식 ${numberOfSharesToSell.toLocaleString()}주 (${percentageToSell.toFixed(1)}%)를 주당 $${financials.stockPrice.toFixed(2)}에 매도했습니다. (총 $${proceeds.toLocaleString()})`, "success", {}, isAIAction);
  let updatedGameState = { ...gameState, financials: newFinancials, eventLog: [...gameState.eventLog, newEvent] };
  
  updatedGameState = checkWinLossConditions(updatedGameState);
  return updatedGameState;
};

export const buyCompetitorShares = (gameState: GameState, competitorId: string, numberOfShares: number, isAIAction: boolean | undefined = false): GameState => {
  const { financials, competitors, currentTurn } = gameState;
  const competitor = competitors.find(c => c.id === competitorId);

  if (!competitor) {
    if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매수 오류", "선택한 경쟁사를 찾을 수 없습니다.", "warning", {}, false));
    return gameState;
  }
  if (numberOfShares <= 0) {
    if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매수 오류", "매수할 주식 수를 정확히 입력하세요.", "warning", {}, false));
    return gameState;
  }

  const cost = numberOfShares * competitor.stockPrice;
  if (financials.cash < cost) {
    if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매수 실패", `${competitor.name} 주식 매수에 필요한 현금이 부족합니다. (필요: $${cost.toLocaleString()})`, "warning", {}, false));
    return gameState;
  }

  const newCompetitorShareHoldings = { ...(financials.competitorShareHoldings || {}) };
  newCompetitorShareHoldings[competitorId] = (newCompetitorShareHoldings[competitorId] || 0) + numberOfShares;

  const newFinancials = {
    ...financials,
    cash: financials.cash - cost,
    competitorShareHoldings: newCompetitorShareHoldings,
  };
  
  const newEvent = createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매수", `CEO${isAIAction? '(AI)':''}가 ${competitor.name} 주식 ${numberOfShares.toLocaleString()}주를 주당 $${competitor.stockPrice.toFixed(2)}에 매수했습니다. (총 $${cost.toLocaleString()})`, "success", {}, isAIAction);
  return { ...gameState, financials: newFinancials, eventLog: [...gameState.eventLog, newEvent] };
};

export const sellCompetitorShares = (gameState: GameState, competitorId: string, numberOfShares: number, isAIAction: boolean | undefined = false): GameState => {
  const { financials, competitors, currentTurn } = gameState;
  const competitor = competitors.find(c => c.id === competitorId);

  if (!competitor) {
    if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매도 오류", "선택한 경쟁사를 찾을 수 없습니다.", "warning", {}, false));
    return gameState;
  }
  if (numberOfShares <= 0) {
     if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매도 오류", "매도할 주식 수를 정확히 입력하세요.", "warning", {}, false));
     return gameState;
  }
  
  const sharesOwned = (financials.competitorShareHoldings || {})[competitorId] || 0;
  if (sharesOwned < numberOfShares) {
    if(!isAIAction) gameState.eventLog.push(createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매도 실패", `${competitor.name} 주식을 충분히 보유하고 있지 않습니다. (보유: ${sharesOwned.toLocaleString()}주, 시도: ${numberOfShares.toLocaleString()}주)`, "warning", {}, false));
    return gameState;
  }

  const proceeds = numberOfShares * competitor.stockPrice;
  const newCompetitorShareHoldings = { ...(financials.competitorShareHoldings || {}) };
  newCompetitorShareHoldings[competitorId] -= numberOfShares;
  if (newCompetitorShareHoldings[competitorId] <= 0) { 
    delete newCompetitorShareHoldings[competitorId]; 
  }

  const newFinancials = {
    ...financials,
    cash: financials.cash + proceeds,
    competitorShareHoldings: newCompetitorShareHoldings,
  };

  const newEvent = createEvent(currentTurn, GameEventType.STOCK_TRADE, "경쟁사 주식 매도", `CEO${isAIAction? '(AI)':''}가 ${competitor.name} 주식 ${numberOfShares.toLocaleString()}주를 주당 $${competitor.stockPrice.toFixed(2)}에 매도했습니다. (총 $${proceeds.toLocaleString()})`, "success", {}, isAIAction);
  return { ...gameState, financials: newFinancials, eventLog: [...gameState.eventLog, newEvent] };
};


const MIN_AI_CASH_BUFFER = 25000;

const handleAIDelegatedActions = (currentGameState: GameState): GameState => {
  let newState = JSON.parse(JSON.stringify(currentGameState)); 
  const { financials, currentAiDirective, competitors, sharesOutstanding, ceoShares } = newState;

  // 1. AI Strategic Decisions (e.g., 30% chance)
  if (Math.random() < 0.3 && !newState.isGameOver) {
    let availableDecisions = getAvailableStrategicDecisions(newState);
    let affordableDecisions = availableDecisions.filter(d => (!d.cost || financials.cash >= (d.cost + MIN_AI_CASH_BUFFER)));
    
    if (affordableDecisions.length > 0) {
      let bestDecision: StrategicDecision | undefined = undefined;
      let maxScore = -1;

      affordableDecisions.forEach(decision => {
        let score = 0;
        if (decision.cost && decision.cost > financials.cash * 0.5) score -= 5; 

        switch (currentAiDirective) {
          case AIDirective.TECH_INNOVATION_PRIORITY:
            if (decision.category === 'R&D') score += 10;
            if (decision.title.includes("자금 지원") && newState.rdProjects.find(p=>p.id === decision.id.split('_').pop() && p.progress > 50)) score +=5; 
            break;
          case AIDirective.MARKET_SHARE_EXPANSION:
          case AIDirective.AGGRESSIVE_MARKET_EXPANSION:
            if (decision.category === '마케팅') score += 10;
            break;
          case AIDirective.PROFIT_MAXIMIZATION:
             if (!decision.cost || decision.cost < 10000) score +=5; 
            break;
          case AIDirective.COST_REDUCTION:
            if (decision.title.includes("절감") || (decision.cost && decision.cost < 0)) score += 10; 
            if (decision.cost && decision.cost > 30000) score -=5; 
            break;
          case AIDirective.STABILIZE_COMPANY:
            if (decision.category === '재무' && decision.title.includes("상환")) score += 10; 
            if (decision.cost && decision.cost > 25000) score -= 3; 
            break;
        }
        if (score > maxScore) {
          maxScore = score;
          bestDecision = decision;
        } else if (score === maxScore && decision.cost && bestDecision?.cost && decision.cost < bestDecision.cost) {
            bestDecision = decision; 
        }
      });
      
      if (!bestDecision && affordableDecisions.length > 0) { 
          bestDecision = affordableDecisions.sort((a,b) => (a.cost || 0) - (b.cost || 0))[0];
      }

      if (bestDecision) {
        newState = applyStrategicDecision(newState, bestDecision.id, true); 
      }
    }
  }

  // 2. AI Trades Own Company Shares (e.g., 25% chance)
  if (Math.random() < 0.25 && financials.stockPrice > 0.01 && !newState.isGameOver) {
    const ceoOwnershipPercentage = sharesOutstanding > 0 ? (ceoShares / sharesOutstanding) * 100 : 0;
    const targetCeoOwnership = 62.5;
    const buyTriggerCash = 50000 + MIN_AI_CASH_BUFFER;
    const sellTriggerCash = 15000; 
    const sellOwnershipThreshold = 75;
    const safeOwnershipFloor = 55; 

    if (ceoOwnershipPercentage < targetCeoOwnership && 
        financials.cash > buyTriggerCash && 
        financials.monthlyProfit >= 0) {
      
      const budgetForBuy = Math.min(financials.cash - buyTriggerCash, financials.cash * 0.1);
      let sharesToBuy = Math.floor(budgetForBuy / financials.stockPrice);
      sharesToBuy = Math.min(sharesToBuy, Math.floor(sharesOutstanding * 0.01)); 
      if (sharesToBuy > 0) {
        newState = buyCeoShares(newState, sharesToBuy, true); 
      }
    } 
    else if (ceoOwnershipPercentage > sellOwnershipThreshold && financials.cash < sellTriggerCash) {
      const maxSharesToSellToMaintainFloor = Math.max(0, financials.ceoShares - Math.ceil(sharesOutstanding * (safeOwnershipFloor / 100)));
      const sharesToSellByPerc = financials.ceoShares * ((Math.random() * 1.5 + 0.5) / 100); 
      const actualSharesToSell = Math.min(maxSharesToSellToMaintainFloor, Math.floor(sharesToSellByPerc));

      if (actualSharesToSell > 0) {
        const percentageToSellCalculated = (actualSharesToSell / financials.ceoShares) * 100;
        if(percentageToSellCalculated > 0) { 
            newState = sellCeoShares(newState, percentageToSellCalculated, true);
        }
      }
    }
  }

  // 3. AI Trades Competitor Shares (e.g., 20% chance)
  if (Math.random() < 0.2 && competitors.length > 0 && !newState.isGameOver) {
    const buyCompetitorTriggerCash = 75000 + MIN_AI_CASH_BUFFER;
    const sellCompetitorTriggerCash = 20000;

    for (const competitor of competitors) {
      if (competitor.stockPrice <= 0.01) continue;

      const initialCompData = INITIAL_COMPETITORS.find(ic => ic.id === competitor.id);
      if (!initialCompData) continue;

      const sharesOwned = (financials.competitorShareHoldings || {})[competitor.id] || 0;

      if (sharesOwned > 0 && (financials.cash < sellCompetitorTriggerCash || competitor.stockPrice > initialCompData.stockPrice * 1.3)) {
        let sharesToSell = Math.floor(sharesOwned * (Math.random() * 0.25 + 0.25)); 
        sharesToSell = Math.max(1, sharesToSell);
        if (sharesOwned >= sharesToSell) {
            newState = sellCompetitorShares(newState, competitor.id, sharesToSell, true);
        }
      }
      else if (financials.cash > buyCompetitorTriggerCash && (competitor.strength === '약함' || competitor.stockPrice < initialCompData.stockPrice * 0.9)) {
         const budgetForCompetitorBuy = Math.min(financials.cash - buyCompetitorTriggerCash, financials.cash * 0.05);
         let sharesToBuy = Math.floor(budgetForCompetitorBuy / competitor.stockPrice);
         sharesToBuy = Math.min(sharesToBuy, 5000); 
         if (sharesToBuy > 0) {
           newState = buyCompetitorShares(newState, competitor.id, sharesToBuy, true);
         }
      }
    }
  }
  return newState; 
};

export const advanceTurn = (currentState: GameState): GameState => {
  if (currentState.isGameOver) return currentState;

  let newState = JSON.parse(JSON.stringify(currentState)); 

  newState.currentTurn += 1;
  newState.financials.monthlyRevenue = 0; 
  newState.financials.monthlyCosts = 0; 
  newState.financials.monthlyProfit = 0; 

  if (newState.isDelegated && !newState.isGameOver) {
    newState = handleAIDelegatedActions(newState);
  }
  
  // Check win/loss conditions after AI actions, as AI might trigger game over
  newState = checkWinLossConditions(newState);
  if (newState.isGameOver) {
    if (!newState.eventLog.some(e => e.title.includes("게임 종료") && e.description === newState.gameOverMessage)) {
       newState.eventLog.push(createEvent(newState.currentTurn, GameEventType.GAME_MESSAGE, `게임 종료`, newState.gameOverMessage, "critical"));
    }
    return newState;
  }

  newState = simulateAIBehavior(newState); 
  newState = simulateMarketAndEconomy(newState); 
  newState = checkWinLossConditions(newState); 

  if(!newState.isGameOver){ 
    newState.eventLog.push(createEvent(newState.currentTurn, GameEventType.GAME_MESSAGE, `${newState.currentTurn}월 시작`, "보고서를 검토하고 전략적 결정을 내리십시오.")); 
  } else {
    if (!newState.eventLog.some(e => e.title.includes("게임 종료") && e.description === newState.gameOverMessage)) { 
       newState.eventLog.push(createEvent(newState.currentTurn, GameEventType.GAME_MESSAGE, `게임 종료`, newState.gameOverMessage, "critical"));
    }
  }

  return newState;
};

// Removed cheatIncreaseMarketShare function
