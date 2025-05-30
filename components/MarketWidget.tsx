
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MarketSegment, Competitor } from '../types';
import Widget from './Widget';
import MarketIcon from './icons/MarketIcon';

interface MarketWidgetProps {
  marketSegments: MarketSegment[];
  competitors: Competitor[];
  playerCompanyName: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const MarketWidget: React.FC<MarketWidgetProps> = ({ marketSegments, competitors, playerCompanyName }) => {
  const mainSegment = marketSegments.find(s => s.playerMarketShare > 0) || marketSegments[0];

  if (!mainSegment) return <Widget title="시장 분석" icon={<MarketIcon />}>시장 데이터가 없습니다.</Widget>;

  const competitorShares = competitors.map(c => ({ name: c.name, value: c.marketShare }));
  const playerShare = { name: playerCompanyName, value: mainSegment.playerMarketShare };
  
  let totalCompetitorMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);
  let remainingMarketShare = 100 - totalCompetitorMarketShare - mainSegment.playerMarketShare;
  if (remainingMarketShare < 0) remainingMarketShare = 0;

  const marketShareData = [
    playerShare,
    ...competitorShares,
    { name: '기타', value: remainingMarketShare }
  ].filter(s => s.value > 0);


  const segmentGrowthData = marketSegments.map(segment => ({
    name: segment.name,
    marketValue: segment.totalMarketValue,
    growth: segment.growthPotential === '높음' ? 3 : segment.growthPotential === '중간' ? 2 : 1,
  }));

  const formatCurrencyShort = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}십억`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}백만`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}천`;
    return value.toString();
  };

  return (
    <Widget title="시장 분석" icon={<MarketIcon />}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">세그먼트: {mainSegment.name} ({mainSegment.icon})</h3>
          <p className="text-sm mb-1">총 시장 가치: ${mainSegment.totalMarketValue.toLocaleString()}</p>
          <p className="text-sm mb-1">자사 점유율: {mainSegment.playerMarketShare.toFixed(1)}%</p>
          <p className="text-sm mb-3">성장 잠재력: <span className={`font-semibold ${mainSegment.growthPotential === '높음' ? 'text-green-400' : mainSegment.growthPotential === '중간' ? 'text-yellow-400' : 'text-red-400'}`}>{mainSegment.growthPotential}</span></p>
          <h4 className="text-md font-semibold text-slate-300 mb-1">시장 동향:</h4>
          <ul className="list-disc list-inside text-xs">
            {mainSegment.trends.map(trend => <li key={trend}>{trend}</li>)}
          </ul>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketShareData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {marketShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#e2e8f0' }} // 변경: 툴팁 아이템 텍스트 색상
                  labelStyle={{ color: '#e2e8f0' }} // 변경: 툴팁 레이블 텍스트 색상
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">경쟁사</h3>
          <ul className="space-y-2 text-sm mb-6">
            {competitors.slice(0,3).map(comp => (
              <li key={comp.id} className="flex justify-between items-center p-2 bg-slate-700 rounded">
                <div className="flex items-center">
                  <img src={`https://picsum.photos/seed/${comp.logoSeed}/30/30`} alt={`${comp.name} 로고`} className="rounded-full mr-2" />
                  <span>{comp.name}</span>
                </div>
                <div className="text-right">
                  <span className="block">{comp.marketShare.toFixed(1)}% MS</span>
                  <span className={`text-xs ${comp.strength === '강함' ? 'text-red-400' : comp.strength === '보통' ? 'text-yellow-400' : 'text-green-400'}`}>{comp.strength}</span>
                </div>
              </li>
            ))}
          </ul>
           <h3 className="text-lg font-semibold text-slate-200 mb-2">세그먼트 성장 잠재력</h3>
           <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentGrowthData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" width={100} tick={{fontSize: 10}}/>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#e2e8f0' }} // 툴팁 아이템 텍스트 색상 일관성 유지
                      labelStyle={{ color: '#e2e8f0' }} // 툴팁 레이블 텍스트 색상 일관성 유지
                      formatter={(value: number, name: string) => {
                        if (name === 'growth') {
                          return value === 3 ? '높음' : value === 2 ? '중간' : '낮음';
                        }
                        return `$${value.toLocaleString()}`;
                      }}
                    />
                    <Legend wrapperStyle={{fontSize: '10px'}} payload={[{ value: '시장 가치', type: 'square', id: 'marketValue', color: '#2563eb' }, { value: '성장 잠재력', type: 'square', id: 'growth', color: '#84cc16' }]}/>
                    <Bar dataKey="marketValue" name="시장 가치" fill="#2563eb" barSize={10} />
                    <Bar dataKey="growth" name="성장 잠재력" fill="#84cc16" barSize={10} />
                </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </Widget>
  );
};

export default MarketWidget;
