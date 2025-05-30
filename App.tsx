
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, AIDirective, StrategicDecision, GameEventType, GameEvent, MarketSegment } from './types';
import { INITIAL_GAME_STATE } from './constants';
import FinancialsWidget from './components/FinancialsWidget';
import MarketWidget from './components/MarketWidget';
import RDWidget from './components/RDWidget';
import EventLogWidget from './components/EventLogWidget';
import StrategicDecisionWidget from './components/StrategicDecisionWidget';
import StockTradingWidget from './components/StockTradingWidget';
import DelegationWidget from './components/DelegationWidget';
// import CheatWidget from './components/CheatWidget'; // Removed CheatWidget
import Widget from './components/Widget';
import { 
  advanceTurn, 
  getAvailableStrategicDecisions, 
  applyStrategicDecision, 
  buyCeoShares, 
  sellCeoShares,
  buyCompetitorShares,
  sellCompetitorShares,
  // cheatIncreaseMarketShare // Removed cheat function import
} from './services/gameLogic';

const AUTO_TURN_INTERVAL = 1500; // 1.5 seconds, (기존 3000에서 변경)

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const freshState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
    if (!freshState.financials.competitorShareHoldings) {
        freshState.financials.competitorShareHoldings = {};
    }
    freshState.isDelegated = false; 
    return freshState;
  });
  const [availableDecisions, setAvailableDecisions] = useState<StrategicDecision[]>([]);
  const [isLoadingNextTurn, setIsLoadingNextTurn] = useState(false);

  const [isGameSetup, setIsGameSetup] = useState(true);
  const [inputCompanyName, setInputCompanyName] = useState(INITIAL_GAME_STATE.companyName);

  const turnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGameSetup && !gameState.isGameOver && !gameState.isDelegated) { 
      setAvailableDecisions(getAvailableStrategicDecisions(gameState));
    } else if (gameState.isGameOver || gameState.isDelegated) { 
      setAvailableDecisions([]); 
    }
  }, [gameState, isGameSetup]);

  const handleSetAIDirective = useCallback((directive: AIDirective) => {
    if (gameState.isGameOver) return;
    setGameState(prev => ({ ...prev, currentAiDirective: directive }));
  }, [gameState.isGameOver]);

  const handleMakeStrategicDecision = useCallback((decisionId: string) => {
    if (gameState.isGameOver || gameState.isDelegated) return; 
    setGameState(prev => applyStrategicDecision(prev, decisionId, false)); 
  }, [gameState.isGameOver, gameState.isDelegated]);

  const handleNextTurn = useCallback(() => {
    if (gameState.isGameOver || isLoadingNextTurn) return;
    setIsLoadingNextTurn(true);
    const delay = gameState.isDelegated ? 100 : 500; 
    setTimeout(() => {
      setGameState(prev => advanceTurn(prev));
      setIsLoadingNextTurn(false);
    }, delay); 
  }, [gameState.isGameOver, isLoadingNextTurn, gameState.isDelegated]);


  useEffect(() => {
    if (gameState.isDelegated && !gameState.isGameOver) {
      if (turnIntervalRef.current) {
        clearInterval(turnIntervalRef.current);
      }
      turnIntervalRef.current = setInterval(() => {
        handleNextTurn();
      }, AUTO_TURN_INTERVAL);
    } else {
      if (turnIntervalRef.current) {
        clearInterval(turnIntervalRef.current);
        turnIntervalRef.current = null;
      }
    }

    return () => { 
      if (turnIntervalRef.current) {
        clearInterval(turnIntervalRef.current);
      }
    };
  }, [gameState.isDelegated, gameState.isGameOver, handleNextTurn]);


  const handleToggleDelegation = useCallback(() => {
    if (gameState.isGameOver) return;
    setGameState(prev => {
      const newDelegatedState = !prev.isDelegated;
      const newEvent: GameEvent = {
          id: `evt-delegation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          turn: prev.currentTurn,
          type: GameEventType.GAME_MESSAGE,
          title: newDelegatedState ? "AI 위임 활성화됨" : "AI 위임 비활성화됨",
          description: newDelegatedState 
            ? "AI가 주요 결정, 주식 거래 및 턴 진행을 자동으로 관리합니다." 
            : "이제부터 주요 결정, 주식 거래 및 턴 진행을 직접 관리합니다.",
          severity: 'info'
      };
      return {
        ...prev,
        isDelegated: newDelegatedState,
        eventLog: [...prev.eventLog, newEvent]
      };
    });
  }, [gameState.isGameOver]);


  const handleStartGame = () => {
    setIsLoadingNextTurn(true); 
    const finalCompanyName = inputCompanyName.trim() === '' ? INITIAL_GAME_STATE.companyName : inputCompanyName.trim();

    setTimeout(() => {
        const freshState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
         if (!freshState.financials.competitorShareHoldings) {
            freshState.financials.competitorShareHoldings = {};
        }
        freshState.isDelegated = false;

        let updatedEventLog = freshState.eventLog.map((event: GameEvent) => 
          event.id === 'evt-start' 
          ? {...event, description: `파산 직전의 ${finalCompanyName}을(를) 인수하셨습니다. 행운을 빕니다.`} 
          : event
        );
      
        setGameState({
            ...freshState, 
            companyName: finalCompanyName,
            eventLog: updatedEventLog,
        });
        setIsGameSetup(false);
        setIsLoadingNextTurn(false); 
    }, 300); 
  };

  const handleRestartGame = () => {
    if (turnIntervalRef.current) { 
        clearInterval(turnIntervalRef.current);
        turnIntervalRef.current = null;
    }
    const freshInitialState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
    if (!freshInitialState.financials.competitorShareHoldings) {
        freshInitialState.financials.competitorShareHoldings = {};
    }
    freshInitialState.isDelegated = false; 
    setGameState(freshInitialState);
    setInputCompanyName(freshInitialState.companyName); 
    setIsGameSetup(true); 
    setIsLoadingNextTurn(false);
  };
  
  const handleBuyShares = useCallback((numberOfShares: number) => {
    if (gameState.isGameOver || gameState.isDelegated) return; 
    setGameState(prev => buyCeoShares(prev, numberOfShares, false));
  }, [gameState.isGameOver, gameState.isDelegated]);

  const handleSellShares = useCallback((percentageToSell: number) => {
    if (gameState.isGameOver || gameState.isDelegated) return;
    setGameState(prev => sellCeoShares(prev, percentageToSell, false));
  }, [gameState.isGameOver, gameState.isDelegated]);

  const handleBuyCompetitorShares = useCallback((competitorId: string, numberOfShares: number) => {
    if (gameState.isGameOver || gameState.isDelegated) return;
    setGameState(prev => buyCompetitorShares(prev, competitorId, numberOfShares, false));
  }, [gameState.isGameOver, gameState.isDelegated]);

  const handleSellCompetitorShares = useCallback((competitorId: string, numberOfShares: number) => {
    if (gameState.isGameOver || gameState.isDelegated) return;
    setGameState(prev => sellCompetitorShares(prev, competitorId, numberOfShares, false));
  }, [gameState.isGameOver, gameState.isDelegated]);

  // Removed handleCheatIncreaseMarketShare

  if (isGameSetup) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-sky-400 mb-6">회사 설립</h1>
          <p className="text-slate-300 mb-6 text-sm md:text-base">CEO로서 여정을 시작할 회사 이름을 입력해주세요. 비워두시면 기본 이름으로 자동 설정됩니다.</p>
          <input
            type="text"
            value={inputCompanyName}
            onChange={(e) => setInputCompanyName(e.target.value)}
            placeholder={`기본값: ${INITIAL_GAME_STATE.companyName}`}
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md p-3 mb-6 text-center focus:ring-blue-500 focus:border-blue-500"
            aria-label="회사 이름 입력"
          />
          <button
            onClick={handleStartGame}
            disabled={isLoadingNextTurn}
            className={`w-full px-6 py-3 rounded-md font-semibold text-white shadow-lg transition-colors
              ${isLoadingNextTurn
                ? 'bg-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500'}`}
          >
            {isLoadingNextTurn ? "설립 중..." : "게임 시작"}
          </button>
        </div>
        <footer className="text-center text-xs text-slate-500 mt-8 py-4">
          엔터프라이즈 시뮬레이션 &copy; {new Date().getFullYear()}.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 lg:p-8">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-400">엔터프라이즈: CEO 대시보드</h1>
          <p className="text-slate-400">회사: {gameState.companyName} | 월: {gameState.currentTurn} {gameState.isDelegated ? "| 🤖 AI 위임 (자동 진행 중)" : ""}</p> 
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          {!gameState.isDelegated && !gameState.isGameOver && (
            <button
              onClick={handleNextTurn}
              disabled={isLoadingNextTurn}
              className={`px-6 py-3 rounded-md font-semibold transition-colors
                ${isLoadingNextTurn
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
            >
              {isLoadingNextTurn ? '처리 중...' : `${gameState.currentTurn + 1}월로 진행`} 
            </button>
          )}
          {gameState.isDelegated && !gameState.isGameOver && (
             <div className="px-6 py-3 rounded-md font-semibold bg-sky-700 text-sky-100 shadow-lg">
                AI 자동 진행 중... (1.5초/턴)
            </div>
          )}
          {gameState.isGameOver && (
             <button
                onClick={handleRestartGame}
                className="px-6 py-3 rounded-md font-semibold bg-orange-500 hover:bg-orange-400 text-white shadow-lg transition-colors"
            >
                게임 재시작
            </button>
          )}
        </div>
      </header>

      {gameState.isGameOver && (
        <div className="my-8 p-6 bg-red-800/80 border border-red-600 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-red-200 mb-2">게임 종료</h2>
          <p className="text-xl text-red-100 whitespace-pre-line">{gameState.gameOverMessage}</p>
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
           <DelegationWidget 
            isDelegated={gameState.isDelegated}
            onToggleDelegation={handleToggleDelegation}
            isGameOver={gameState.isGameOver}
          />
          <StrategicDecisionWidget
            gameState={gameState} 
            onSetAIDirective={handleSetAIDirective}
            onMakeStrategicDecision={handleMakeStrategicDecision}
            availableDecisions={availableDecisions}
          />
          <RDWidget projects={gameState.rdProjects} />
          <EventLogWidget events={gameState.eventLog} />
        </div>

        <div className="lg:col-span-1 space-y-4 md:space-y-6">
           <FinancialsWidget financials={gameState.financials} eventLog={gameState.eventLog} />
           <MarketWidget
            marketSegments={gameState.marketSegments}
            competitors={gameState.competitors}
            playerCompanyName={gameState.companyName}
          />
        </div>

        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <StockTradingWidget
            gameState={gameState} 
            onBuyShares={handleBuyShares}
            onSellShares={handleSellShares}
            onBuyCompetitorShares={handleBuyCompetitorShares}
            onSellCompetitorShares={handleSellCompetitorShares}
          />
           <Widget title="회사 현황">
            <p className="text-sm">출시된 제품 수: {gameState.products.filter(p=>p.status === '출시됨').length}개</p>
            <p className="text-sm">글로벌 시장 심리: <span className={gameState.globalMarketSentiment === '긍정적' ? 'text-green-400' : gameState.globalMarketSentiment === '부정적' ? 'text-red-400' : 'text-yellow-400'}>{gameState.globalMarketSentiment}</span></p>
            {gameState.products.filter(p=>p.status === '출시됨').map(p => (
              <div key={p.id} className="mt-2 p-2 bg-slate-700/50 rounded text-xs">
                <strong>{p.name}</strong> ({p.status}) - 품질: {p.quality}/100 | 가격: ${p.salePrice} | {gameState.currentTurn > 1 ? `${gameState.currentTurn-1}월` : '이전'} 판매량: {p.unitsSoldPerQuarter.toLocaleString()} 
              </div>
            ))}
            {gameState.products.filter(p=>p.status === '출시됨').length === 0 && <p className="text-xs text-slate-400 mt-2">현재 출시된 제품이 없습니다.</p>}
          </Widget>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 mt-8 py-4 border-t border-slate-700">
        엔터프라이즈 시뮬레이션 &copy; {new Date().getFullYear()}. 현대 CEO 경험.
      </footer>
    </div>
  );
};

export default App;
