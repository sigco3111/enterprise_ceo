
import React, { useState, useEffect } from 'react';
import { GameState, Competitor } from '../types';
import Widget from './Widget';
import StockIcon from './icons/StockIcon'; 

interface StockTradingWidgetProps {
  gameState: GameState;
  onBuyShares: (numberOfShares: number) => void;
  onSellShares: (percentageToSell: number) => void;
  onBuyCompetitorShares: (competitorId: string, numberOfShares: number) => void;
  onSellCompetitorShares: (competitorId: string, numberOfShares: number) => void;
  // isDelegated is part of gameState
}

const formatCurrency = (value: number, digits = 0) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const StockTradingWidget: React.FC<StockTradingWidgetProps> = ({ 
  gameState, 
  onBuyShares, 
  onSellShares,
  onBuyCompetitorShares,
  onSellCompetitorShares
}) => {
  const [buyOwnSharesAmount, setBuyOwnSharesAmount] = useState<string>('');
  const [sellOwnSharesPercentage, setSellOwnSharesPercentage] = useState<string>('');
  
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(gameState.competitors[0]?.id || '');
  const [tradeCompetitorSharesAmount, setTradeCompetitorSharesAmount] = useState<string>('');

  const { financials, competitors, companyName, isGameOver, isDelegated } = gameState;
  const ceoOwnershipPercentage = financials.sharesOutstanding > 0 ? (financials.ceoShares / financials.sharesOutstanding) * 100 : 0;

  useEffect(() => {
    if (competitors.length > 0 && (!selectedCompetitorId || !competitors.find(c => c.id === selectedCompetitorId))) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId]);

  const handleBuyOwnShares = () => {
    const numShares = parseInt(buyOwnSharesAmount, 10);
    if (isNaN(numShares) || numShares <= 0) {
      alert('매수할 유효한 주식 수를 입력하세요.');
      return;
    }
    onBuyShares(numShares);
    setBuyOwnSharesAmount('');
  };

  const handleSellOwnShares = () => {
    const percentage = parseFloat(sellOwnSharesPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      alert('매도할 유효한 비율(1-100%)을 입력하세요.');
      return;
    }
    onSellShares(percentage);
    setSellOwnSharesPercentage('');
  };

  const handleBuyCompetitor = () => {
    if (!selectedCompetitorId) {
        alert('거래할 경쟁사를 선택하세요.');
        return;
    }
    const numShares = parseInt(tradeCompetitorSharesAmount, 10);
    if (isNaN(numShares) || numShares <= 0) {
      alert('매수할 유효한 주식 수를 입력하세요.');
      return;
    }
    onBuyCompetitorShares(selectedCompetitorId, numShares);
    setTradeCompetitorSharesAmount('');
  };

  const handleSellCompetitor = () => {
    if (!selectedCompetitorId) {
        alert('거래할 경쟁사를 선택하세요.');
        return;
    }
    const numShares = parseInt(tradeCompetitorSharesAmount, 10);
    if (isNaN(numShares) || numShares <= 0) {
      alert('매도할 유효한 주식 수를 입력하세요.');
      return;
    }
    onSellCompetitorShares(selectedCompetitorId, numShares);
    setTradeCompetitorSharesAmount('');
  };

  const numBuyOwnShares = parseInt(buyOwnSharesAmount, 10) || 0;
  const costToBuyOwn = financials.stockPrice * numBuyOwnShares;
  
  const percSellOwnShares = parseFloat(sellOwnSharesPercentage) || 0;
  const numSharesToSellFromPerc = Math.floor(financials.ceoShares * (percSellOwnShares / 100));
  const proceedsFromSellOwn = financials.stockPrice * numSharesToSellFromPerc;

  const selectedCompetitor = competitors.find(c => c.id === selectedCompetitorId);
  const numTradeCompetitorShares = parseInt(tradeCompetitorSharesAmount, 10) || 0;
  const costToBuyCompetitor = selectedCompetitor ? selectedCompetitor.stockPrice * numTradeCompetitorShares : 0;
  const proceedsFromSellCompetitor = selectedCompetitor ? selectedCompetitor.stockPrice * numTradeCompetitorShares : 0;
  const ceoOwnedCompetitorShares = selectedCompetitor ? (financials.competitorShareHoldings[selectedCompetitor.id] || 0) : 0;

  const globallyDisabled = isGameOver || isDelegated;

  return (
    <Widget title="CEO 주식 관리 센터" icon={<StockIcon />}>
      {isDelegated && !isGameOver && (
        <p className="text-sm text-yellow-400 mb-3 p-2 bg-yellow-900/30 rounded-md border border-yellow-700">AI 위임 활성 중: AI가 자동으로 주식 거래를 관리합니다.</p>
      )}
      {/* Section 1: Own Company Stock */}
      <div className={`mb-6 pb-4 border-b border-slate-700 ${globallyDisabled ? 'opacity-60' : ''}`}>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">자사주 ({companyName}) 관리</h3>
        <div className="space-y-1 text-sm mb-3">
          <div><strong className="text-slate-400 w-32 inline-block">현재 주가:</strong> {formatCurrency(financials.stockPrice, 2)}</div>
          <div><strong className="text-slate-400 w-32 inline-block">CEO 보유 주식:</strong> {financials.ceoShares.toLocaleString()}주 ({ceoOwnershipPercentage.toFixed(2)}%)</div>
          <div><strong className="text-slate-400 w-32 inline-block">발행 총 주식:</strong> {financials.sharesOutstanding.toLocaleString()}주</div>
          <div><strong className="text-slate-400 w-32 inline-block">CEO 현금:</strong> {formatCurrency(financials.cash)}</div>
        </div>

        <div className="mb-3">
          <label htmlFor="buyOwnSharesAmount" className="block text-xs font-medium text-slate-300 mb-1">매수할 주식 수:</label>
          <input
            type="number"
            id="buyOwnSharesAmount"
            value={buyOwnSharesAmount}
            onChange={(e) => setBuyOwnSharesAmount(e.target.value)}
            placeholder="수량 입력"
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            disabled={globallyDisabled}
            aria-label="자사주 매수 수량"
          />
          {numBuyOwnShares > 0 && !globallyDisabled && (
            <p className="text-xs text-slate-400 mt-1">예상 비용: <span className="text-red-400">{formatCurrency(costToBuyOwn)}</span></p>
          )}
          <button
            onClick={handleBuyOwnShares}
            disabled={globallyDisabled || numBuyOwnShares <= 0 || financials.cash < costToBuyOwn}
            className={`mt-2 w-full text-sm px-3 py-1.5 rounded-md font-medium transition-colors
              ${globallyDisabled || numBuyOwnShares <= 0 || financials.cash < costToBuyOwn
                ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white shadow'}`}
          >
            {isDelegated ? 'AI 관리 중' : '자사주 매수'}
          </button>
        </div>

        <div>
          <label htmlFor="sellOwnSharesPercentage" className="block text-xs font-medium text-slate-300 mb-1">매도할 보유 주식 비율 (%):</label>
          <input
            type="number"
            id="sellOwnSharesPercentage"
            value={sellOwnSharesPercentage}
            onChange={(e) => setSellOwnSharesPercentage(e.target.value)}
            placeholder="비율 입력 (예: 10)"
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            min="1" max="100"
            disabled={globallyDisabled || financials.ceoShares === 0}
            aria-label="자사주 매도 비율"
          />
          {percSellOwnShares > 0 && financials.ceoShares > 0 && !globallyDisabled && (
            <div className="text-xs text-slate-400 mt-1">
              <p>매도 예정 주식: <span className="text-slate-200">{numSharesToSellFromPerc.toLocaleString()}주</span></p>
              <p>예상 수익: <span className="text-green-400">{formatCurrency(proceedsFromSellOwn)}</span></p>
            </div>
          )}
          <button
            onClick={handleSellOwnShares}
            disabled={globallyDisabled || numSharesToSellFromPerc <= 0 || financials.ceoShares < numSharesToSellFromPerc}
            className={`mt-2 w-full text-sm px-3 py-1.5 rounded-md font-medium transition-colors
              ${globallyDisabled || numSharesToSellFromPerc <= 0 || financials.ceoShares < numSharesToSellFromPerc
                ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white shadow'}`}
          >
            {isDelegated ? 'AI 관리 중' : `자사주 매도 (보유분의 ${percSellOwnShares || 0}%)`}
          </button>
        </div>
      </div>

      {/* Section 2: Competitor Stock Trading */}
      <div className={`${globallyDisabled ? 'opacity-60' : ''}`}>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">경쟁사 주식 포트폴리오</h3>
        {competitors.length === 0 ? (
          <p className="text-sm text-slate-400">거래 가능한 경쟁사가 없습니다.</p>
        ) : (
          <>
            <div className="mb-3">
              <label htmlFor="selectCompetitor" className="block text-xs font-medium text-slate-300 mb-1">경쟁사 선택:</label>
              <select
                id="selectCompetitor"
                value={selectedCompetitorId}
                onChange={(e) => {setSelectedCompetitorId(e.target.value); setTradeCompetitorSharesAmount('');}}
                className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={globallyDisabled}
                aria-label="경쟁사 선택"
              >
                {competitors.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>

            {selectedCompetitor && (
              <div className="space-y-1 text-sm mb-3 p-2 bg-slate-700/50 rounded">
                <div><strong className="text-slate-400 w-28 inline-block">선택된 회사:</strong> {selectedCompetitor.name}</div>
                <div><strong className="text-slate-400 w-28 inline-block">현재 주가:</strong> {formatCurrency(selectedCompetitor.stockPrice, 2)}</div>
                <div><strong className="text-slate-400 w-28 inline-block">CEO 보유량:</strong> {ceoOwnedCompetitorShares.toLocaleString()}주</div>
                <div><strong className="text-slate-400 w-28 inline-block">현재 가치:</strong> {formatCurrency(ceoOwnedCompetitorShares * selectedCompetitor.stockPrice)}</div>
              </div>
            )}
            
            <div className="mb-3">
                <label htmlFor="tradeCompetitorSharesAmount" className="block text-xs font-medium text-slate-300 mb-1">거래할 주식 수 (경쟁사):</label>
                <input
                    type="number"
                    id="tradeCompetitorSharesAmount"
                    value={tradeCompetitorSharesAmount}
                    onChange={(e) => setTradeCompetitorSharesAmount(e.target.value)}
                    placeholder="수량 입력"
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    disabled={globallyDisabled || !selectedCompetitor}
                    aria-label="경쟁사 주식 거래 수량"
                />
                {numTradeCompetitorShares > 0 && selectedCompetitor && !globallyDisabled && (
                <div className="text-xs text-slate-400 mt-1">
                    <p>매수 시 예상 비용: <span className="text-red-400">{formatCurrency(costToBuyCompetitor)}</span></p>
                    <p>매도 시 예상 수익: <span className="text-green-400">{formatCurrency(proceedsFromSellCompetitor)}</span></p>
                </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBuyCompetitor}
                disabled={globallyDisabled || !selectedCompetitor || numTradeCompetitorShares <= 0 || financials.cash < costToBuyCompetitor}
                className={`w-full text-sm px-3 py-1.5 rounded-md font-medium transition-colors
                  ${globallyDisabled || !selectedCompetitor || numTradeCompetitorShares <= 0 || financials.cash < costToBuyCompetitor
                    ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'}`}
              >
                {isDelegated ? 'AI 관리 중' : '경쟁사 주식 매수'}
              </button>
              <button
                onClick={handleSellCompetitor}
                disabled={globallyDisabled || !selectedCompetitor || numTradeCompetitorShares <= 0 || ceoOwnedCompetitorShares < numTradeCompetitorShares}
                className={`w-full text-sm px-3 py-1.5 rounded-md font-medium transition-colors
                  ${globallyDisabled || !selectedCompetitor || numTradeCompetitorShares <= 0 || ceoOwnedCompetitorShares < numTradeCompetitorShares
                    ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow'}`}
              >
                {isDelegated ? 'AI 관리 중' : '경쟁사 주식 매도'}
              </button>
            </div>
            
            <div className="mt-4">
                <h4 className="text-md font-semibold text-slate-300 mb-1">보유 경쟁사 주식 현황:</h4>
                {Object.keys(financials.competitorShareHoldings || {} ).length === 0 ? (
                    <p className="text-xs text-slate-400">보유 중인 경쟁사 주식이 없습니다.</p>
                ) : (
                    <ul className="space-y-1 text-xs">
                    {Object.entries(financials.competitorShareHoldings || {}).map(([compId, shares]) => {
                        const comp = competitors.find(c => c.id === compId);
                        if (!comp || shares === 0) return null;
                        return (
                        <li key={compId} className="flex justify-between p-1 bg-slate-700/30 rounded">
                            <span>{comp.name}: {shares.toLocaleString()}주</span>
                            <span className="text-slate-400">총 가치: {formatCurrency(shares * comp.stockPrice)}</span>
                        </li>
                        );
                    })}
                    </ul>
                )}
            </div>
          </>
        )}
      </div>
    </Widget>
  );
};

export default StockTradingWidget;