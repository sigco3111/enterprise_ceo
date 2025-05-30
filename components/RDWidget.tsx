
import React from 'react';
import { RDProject } from '../types';
import Widget from './Widget';
import RDRIcon from './icons/RDRIcon';

interface RDWidgetProps {
  projects: RDProject[];
  onFundProject?: (projectId: string, amount: number) => void;
}

const RDWidget: React.FC<RDWidgetProps> = ({ projects, onFundProject }) => {
  return (
    <Widget title="R&D 파이프라인" icon={<RDRIcon />}>
      {projects.length === 0 ? (
        <p>진행 중인 R&D 프로젝트가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="p-3 bg-slate-700 rounded-md shadow">
              <h4 className="font-semibold text-md text-blue-300">{project.name} <span className="text-xs px-2 py-0.5 bg-slate-600 rounded-full">{project.status}</span></h4>
              <p className="text-xs text-slate-400 mt-1">{project.description}</p>
              <p className="text-xs text-slate-400 mt-1">잠재적 영향: <span className="text-slate-300">{project.potentialImpact}</span></p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>진행률</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                <span>자금 지원: ${project.monthlyFunding.toLocaleString()}/월</span> {/* 변경 */}
                <span className="mx-2">|</span>
                <span>완료 비용: ${project.costToComplete.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
};

export default RDWidget;