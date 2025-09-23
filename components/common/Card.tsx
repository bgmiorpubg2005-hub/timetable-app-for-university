import React from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export const Card: React.FC<CardProps> = ({ title, description, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left w-full border border-transparent hover:border-indigo-500 dark:hover:border-indigo-600"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-slate-700">
          <i className={`${icon} text-2xl text-indigo-600 dark:text-indigo-400`}></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
};