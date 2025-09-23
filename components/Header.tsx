
import React from 'react';
import { User, Role } from '../types';

interface HeaderProps {
  currentUser: User;
  roles: Role[];
  onRoleChange: (role: Role) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, roles, onRoleChange }) => {
  return (
    <header className="h-20 bg-white shadow-md flex-shrink-0 flex items-center justify-between px-6 lg:px-8 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-sm text-slate-500">Here's your overview for today.</p>
      </div>
      <div className="flex items-center space-x-6">
        <div className="relative">
            <select
                value={currentUser.role}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="appearance-none bg-slate-100 border border-slate-300 rounded-md py-2 pl-4 pr-10 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
                {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
            </select>
             <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
        </div>
        <div className="relative">
          <i className="fa-regular fa-bell text-2xl text-slate-500 cursor-pointer hover:text-indigo-600"></i>
          <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex items-center space-x-3">
          <img src={currentUser.avatar} alt="User Avatar" className="h-12 w-12 rounded-full object-cover border-2 border-indigo-200" />
          <div>
            <p className="font-semibold text-slate-800">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
