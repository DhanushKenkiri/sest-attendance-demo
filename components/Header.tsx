
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 shadow-lg rounded-b-xl sticky top-0 z-10">
      <div className="container mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 tracking-wider">
          Gemini Smart Attendance System
        </h1>
        <p className="text-slate-400">Project Adelta Vision & Attendance Agent</p>
      </div>
    </header>
  );
};

export default Header;
