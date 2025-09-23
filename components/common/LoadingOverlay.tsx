import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 flex flex-col justify-center items-center text-white">
      <i className="fa-solid fa-brain text-5xl text-indigo-400 animate-pulse"></i>
      <h2 className="text-2xl font-bold mt-4">IntelliSchedule AI is thinking...</h2>
      <p className="mt-2 text-slate-300">Generating an optimized timetable. This may take a moment.</p>
    </div>
  );
};
