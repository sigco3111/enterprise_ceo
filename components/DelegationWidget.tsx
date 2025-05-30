
import React from 'react';
import Widget from './Widget';
import StrategyIcon from './icons/StrategyIcon'; // Using StrategyIcon as a placeholder

interface DelegationWidgetProps {
  isDelegated: boolean;
  onToggleDelegation: () => void;
  isGameOver: boolean;
}

const DelegationWidget: React.FC<DelegationWidgetProps> = ({ isDelegated, onToggleDelegation, isGameOver }) => {
  return (
    <Widget title="AI 위임 관리" icon={<StrategyIcon />}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-300 flex-1 pr-4">
          {isDelegated 
            ? "AI가 전략 결정, 주식 거래 및 턴 진행을 자동 관리합니다." 
            : "주요 결정, 주식 거래 및 턴 진행을 직접 관리합니다."}
        </p>
        <button
          onClick={onToggleDelegation}
          disabled={isGameOver}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow whitespace-nowrap
            ${isGameOver 
              ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
              : isDelegated 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-green-600 hover:bg-green-500 text-white'}`}
          aria-pressed={isDelegated}
          aria-label={isDelegated ? "AI 위임 비활성화" : "AI 위임 활성화"}
        >
          {isDelegated ? "위임 비활성화" : "위임 활성화"}
        </button>
      </div>
      {isDelegated && !isGameOver && (
        <p className="text-xs text-yellow-400 mt-2 p-2 bg-yellow-900/30 rounded-md border border-yellow-700">
          AI 자동 관리가 활성화되어 있습니다. 턴이 자동으로 진행되며 (약 3초 간격), AI 지침을 제외한 대부분의 수동 제어가 제한됩니다.
        </p>
      )}
       {!isDelegated && !isGameOver && (
        <p className="text-xs text-slate-400 mt-2">
          AI 위임이 비활성화되어 있습니다. 모든 주요 결정과 거래, 턴 진행을 직접 수행해야 합니다.
        </p>
      )}
    </Widget>
  );
};

export default DelegationWidget;
