import React from 'react';
import { View, Role } from '../types';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUserRole: Role;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, currentUserRole, onLogout }) => {
  const availableNavItems = NAV_ITEMS.filter(item => item.roles.includes(currentUserRole));
    
  return (
    <nav className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-slate-200">
        <i className="fa-solid fa-graduation-cap text-3xl text-indigo-600"></i>
        <h1 className="text-xl font-bold ml-3 text-slate-800">Scheduler</h1>
      </div>
      <ul className="flex-1 px-4 py-6">
        {availableNavItems.map(({ view, icon }) => (
          <li key={view} className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView(view);
              }}
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                activeView === view
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <i className={`${icon} w-6 text-center text-lg`}></i>
              <span className="ml-4 font-medium">{view}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-slate-200">
          <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <i className="fa-solid fa-right-from-bracket w-6 text-center text-lg"></i>
              <span className="ml-4 font-medium">Logout</span>
          </button>
      </div>
    </nav>
  );
};