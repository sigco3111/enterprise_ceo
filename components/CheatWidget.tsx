
import React, { useState, useEffect } from 'react';
import { MarketSegment } from '../types';
import Widget from './Widget';

interface CheatWidgetProps {
  marketSegments: MarketSegment[];
  onIncreaseMarketShare: (segmentId: string, amount: number) => void;
  disabled?: boolean;
}

const CheatWidget: React.FC<CheatWidgetProps> = ({ marketSegments, onIncreaseMarketShare, disabled = false }) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const cheatAmount = 10; // Increase by 10% each time

  useEffect(() => {
    if (marketSegments.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(marketSegments[0].id);
    } else if (marketSegments.length > 0 && selectedSegmentId && !marketSegments.find(s => s.id === selectedSegmentId)) {
      // If current selectedSegmentId is no longer valid (e.g. segments changed), reset to first valid one.
      setSelectedSegmentId(marketSegments[0].id);
    } else if (marketSegments.length === 0) {
      setSelectedSegmentId('');
    }
  }, [marketSegments, selectedSegmentId]);

  const handleCheat = () => {
    if (!selectedSegmentId) {
      alert('치트를 적용할 시장 세그먼트를 선택하세요.');
      return;
    }
    onIncreaseMarketShare(selectedSegmentId, cheatAmount);
  };

  const selectedSegment = marketSegments.find(s => s.id === selectedSegmentId);

  return (
    <Widget title="🧪 테스트/치트 패널" className={`border-2 border-yellow-500 ${disabled ? 'opacity-70' : ''}`}>
      <p className="text-xs text-yellow-300 mb-3">주의: 이 패널은 테스트 목적으로만 사용됩니다.</p>
      
      {marketSegments.length === 0 ? (
        <p className="text-sm text-slate-400">시장 세그먼트 정보가 없습니다.</p>
      ) : (
        <>
          <div className="mb-3">
            <label htmlFor="cheatSegmentSelect" className="block text-sm font-medium text-slate-300 mb-1">
              대상 시장 세그먼트:
            </label>
            <select
              id="cheatSegmentSelect"
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
              disabled={disabled || marketSegments.length === 0}
              aria-label="치트 대상 시장 세그먼트 선택"
            >
              {marketSegments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name} (현재 점유율: {segment.playerMarketShare.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheat}
            disabled={disabled || !selectedSegmentId || (selectedSegment && selectedSegment.playerMarketShare >= 100)}
            className={`w-full px-4 py-2 rounded-md font-semibold text-sm transition-colors
              ${(disabled || !selectedSegmentId || (selectedSegment && selectedSegment.playerMarketShare >= 100))
                ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow'}`}
          >
            선택 세그먼트 점유율 +{cheatAmount}% 증가
          </button>
          {selectedSegment && selectedSegment.playerMarketShare >= 100 && !disabled && (
            <p className="text-xs text-green-400 mt-1">이미 해당 세그먼트의 최대 점유율(100%)에 도달했습니다.</p>
          )}
        </>
      )}
    </Widget>
  );
};

export default CheatWidget;
