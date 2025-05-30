import React, { useRef, useEffect } from 'react';
import { GameEvent, GameEventType } from '../types';
import Widget from './Widget';

interface EventLogWidgetProps {
  events: GameEvent[];
}

const getEventColor = (type: GameEventType, severity: 'info' | 'warning' | 'critical' | 'success') => {
  if (severity === 'critical') return 'text-red-400';
  if (severity === 'warning') return 'text-yellow-400';
  if (severity === 'success') return 'text-green-400';

  switch (type) {
    case GameEventType.AI_ACTION: return 'text-blue-400';
    case GameEventType.MARKET_NEWS: return 'text-teal-400';
    case GameEventType.COMPETITOR_MOVE: return 'text-purple-400';
    case GameEventType.FINANCIAL_REPORT: return 'text-sky-400';
    case GameEventType.PLAYER_DECISION: return 'text-lime-400';
    default: return 'text-slate-300';
  }
};

const EventLogWidget: React.FC<EventLogWidgetProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to the top to show the newest event, as events are rendered newest first.
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <Widget title="정보 피드 / 이벤트 로그" className="flex flex-col">
      <div ref={scrollRef} className="flex-grow h-64 md:h-96 overflow-y-auto pr-2 space-y-2 text-xs">
        {events.slice().reverse().map(event => (
          <div key={event.id} className={`p-2 rounded-md bg-slate-700/50 border-l-2 ${getEventColor(event.type, event.severity).replace('text-', 'border-')}`}>
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${getEventColor(event.type, event.severity)}`}>{event.title} ({event.turn}월)</span>
              <span className="text-slate-500">{event.type}</span>
            </div>
            <p className="text-slate-400 mt-0.5">{event.description}</p>
          </div>
        ))}
      </div>
    </Widget>
  );
};

export default EventLogWidget;