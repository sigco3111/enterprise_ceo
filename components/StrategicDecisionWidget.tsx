
import React from 'react';
import { GameState, AIDirective, StrategicDecision } from '../types'; 
import Widget from './Widget';
import StrategyIcon from './icons/StrategyIcon';
import { AI_DIRECTIVE_OPTIONS as DIRECTIVES_FROM_CONST } from '../constants';


interface StrategicDecisionWidgetProps {
  gameState: GameState;
  onSetAIDirective: (directive: AIDirective) => void;
  onMakeStrategicDecision: (decisionId: string) => void;
  availableDecisions: StrategicDecision[];
  // isDelegated prop is implicitly available via gameState.isDelegated
}

const StrategicDecisionWidget: React.FC<StrategicDecisionWidgetProps> = ({ 
  gameState, 
  onSetAIDirective,
  onMakeStrategicDecision,
  availableDecisions 
}) => {
  const { isDelegated, isGameOver, financials } = gameState;
  
  const handleDecisionClick = (decision: StrategicDecision) => {
    if (decision.cost && financials.cash < decision.cost) {
      alert("이 결정을 내리기에 충분한 현금이 없습니다!"); 
      return;
    }
    onMakeStrategicDecision(decision.id);
  };

  return (
    <Widget title="전략 지휘 본부" icon={<StrategyIcon />}>
      <div className="mb-6">
        <label htmlFor="aiDirective" className="block text-sm font-medium text-slate-300 mb-1">AI 핵심 지침:</label>
        <select
          id="aiDirective"
          value={gameState.currentAiDirective}
          onChange={(e) => onSetAIDirective(e.target.value as AIDirective)}
          className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isGameOver} // AI 지침은 위임 중에도 플레이어가 설정 가능하도록 유지
        >
          {DIRECTIVES_FROM_CONST.map(directive => (
            <option key={directive} value={directive}>{directive}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-md font-semibold text-slate-200 mb-2">주요 결정:</h3>
        {isDelegated && !isGameOver && (
          <p className="text-sm text-yellow-400 mb-2 p-2 bg-yellow-900/30 rounded-md border border-yellow-700">AI 위임 활성 중: AI가 자동으로 주요 결정을 관리합니다.</p>
        )}
        {availableDecisions.length === 0 && !isDelegated && <p className="text-sm text-slate-400">대기 중인 주요 결정이 없습니다.</p>}
        {availableDecisions.length === 0 && isDelegated && <p className="text-sm text-slate-400">AI가 관리할 수 있는 주요 결정이 현재 없습니다.</p>}
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {availableDecisions.map(decision => (
            <div key={decision.id} className={`p-3 bg-slate-700 rounded-md shadow ${isDelegated && !isGameOver ? 'opacity-60' : 'hover:bg-slate-600/70 transition-colors'}`}>
              <h4 className="font-semibold text-blue-300">{decision.title} <span className="text-xs text-slate-500">({decision.category})</span></h4>
              <p className="text-xs text-slate-400 my-1">{decision.description}</p>
              {decision.cost && <p className="text-xs text-yellow-400">비용: ${decision.cost.toLocaleString()}</p>}
              <button
                onClick={() => handleDecisionClick(decision)}
                disabled={isDelegated || isGameOver || (decision.cost && financials.cash < decision.cost)}
                className={`mt-2 w-full text-sm px-3 py-1.5 rounded-md font-medium transition-colors
                  ${(isDelegated || isGameOver || (decision.cost && financials.cash < decision.cost))
                    ? 'bg-slate-500 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {isDelegated ? 'AI 관리 중' : '실행'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
};

export default StrategicDecisionWidget;