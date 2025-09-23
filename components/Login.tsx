import React, { useState } from 'react';
import { Role } from '../types';
import { ROLES } from '../constants';

interface LoginProps {
  onLogin: (role: Role) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<Role>(Role.FACULTY);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <i className="fa-solid fa-graduation-cap text-5xl text-indigo-600"></i>
                    <h1 className="mt-4 text-3xl font-bold text-slate-800">Smart Scheduler</h1>
                    <p className="mt-2 text-slate-500">Please select your role to sign in</p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="role-select" className="text-sm font-medium text-slate-700">Select Role</label>
                        <div className="relative mt-2">
                            <select
                                id="role-select"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as Role)}
                                className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-md py-3 pl-4 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <button
                        onClick={() => onLogin(selectedRole)}
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};