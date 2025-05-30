
import React from 'react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ title, children, className = '', icon }) => {
  return (
    <div className={`bg-slate-800 shadow-xl rounded-lg p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center">
          {icon && <span className="mr-2 text-blue-400">{icon}</span>}
          {title}
        </h2>
      </div>
      <div className="text-slate-300">{children}</div>
    </div>
  );
};

export default Widget;
    