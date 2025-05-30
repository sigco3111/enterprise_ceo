
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CompanyFinancials, GameEvent, GameEventType } from '../types';
import Widget from './Widget';
import FinancialIcon from './icons/FinancialIcon';
import { TICKER_SYMBOL } from '../constants';


interface FinancialsWidgetProps {
  financials: CompanyFinancials;
  eventLog: GameEvent[];
}

const formatCurrency = (value: number, digits = 0) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const FinancialsWidget: React.FC<FinancialsWidgetProps> = ({ financials, eventLog }) => {
  const historicalData = eventLog
    .filter(event => event.type === GameEventType.FINANCIAL_REPORT && event.data?.financials)
    .map(event => ({
      turn: `${event.turn}월`, 
      revenue: event.data.financials.monthlyRevenue, 
      profit: event.data.financials.monthlyProfit, 
      cash: event.data.financials.cash,
      stockPrice: event.data.financials.stockPrice,
    }));

  const currentChartDataPoint = {
      turn: `현재`,
      revenue: financials.monthlyRevenue, 
      profit: financials.monthlyProfit, 
      cash: financials.cash,
      stockPrice: financials.stockPrice,
  };

  const displayData = [...historicalData, currentChartDataPoint].slice(-8);
  const ceoOwnershipPercentage = financials.sharesOutstanding > 0 ? (financials.ceoShares / financials.sharesOutstanding) * 100 : 0;

  return (
    <Widget title="재무 개요" icon={<FinancialIcon />}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 text-sm">
        <div><strong className="block text-slate-400">현금</strong> {formatCurrency(financials.cash)}</div>
        <div><strong className="block text-slate-400">부채</strong> {formatCurrency(financials.debt)}</div>
        <div><strong className="block text-slate-400">월 매출</strong> {formatCurrency(financials.monthlyRevenue)}</div> 
        <div><strong className="block text-slate-400">월 비용</strong> {formatCurrency(financials.monthlyCosts)}</div> 
        <div><strong className="block text-slate-400">월 순익</strong> <span className={financials.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(financials.monthlyProfit)}</span></div> 
        <div><strong className="block text-slate-400">시가 총액</strong> {formatCurrency(financials.marketCap)}</div>
        <div><strong className="block text-slate-400">주가 ({TICKER_SYMBOL})</strong> {formatCurrency(financials.stockPrice, 2)}</div>
        <div><strong className="block text-slate-400">CEO 보유 주식</strong> {financials.ceoShares.toLocaleString()}주 ({ceoOwnershipPercentage.toFixed(2)}%)</div>
      </div>

      <div className="h-56 md:h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8" />
            <XAxis dataKey="turn" stroke="#cbd5e1" />
            <YAxis yAxisId="left" stroke="#cbd5e1" tickFormatter={(val) => formatCurrency(val)} />
            <YAxis yAxisId="right" orientation="right" stroke="#cbd5e1" tickFormatter={(val) => formatCurrency(val,2)} />
            <Tooltip
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#94a3b8' }}
                formatter={(value: number, name: string) => {
                    if (name === "주가") return formatCurrency(value, 2);
                    return formatCurrency(value);
                }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} name="매출" />
            <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#60a5fa" strokeWidth={2} name="순익" />
            <Line yAxisId="right" type="monotone" dataKey="stockPrice" stroke="#facc15" strokeWidth={2} name="주가" dot={{r:1}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
};

export default FinancialsWidget;