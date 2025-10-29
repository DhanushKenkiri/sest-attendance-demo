
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <h2 className="text-xl font-semibold bg-slate-700/50 p-4 border-b border-slate-700 text-cyan-300">
        {title}
      </h2>
      <div className="p-4 md:p-6 space-y-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
