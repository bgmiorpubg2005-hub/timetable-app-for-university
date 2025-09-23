import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const Login: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [email, setEmail] = useState('faculty@intellischedule.ai');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = state.users.find(u => u.email === email);

        if (user && password === 'password') {
            dispatch({ type: 'LOGIN', payload: user });
        } else {
            setError('Invalid credentials. Use a valid email and "password".');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <i className="fa-solid fa-brain text-5xl text-indigo-500 dark:text-indigo-400"></i>
                    <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-100">IntelliSchedule AI</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Please sign in to continue</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">Select User (Email)</label>
                        <div className="relative mt-2">
                            <select
                                id="email-select"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-3 pl-4 pr-10 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {state.users.map(user => (
                                    <option key={user.id} value={user.email}>{user.email} ({user.role})</option>
                                ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="password-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='(Hint: password)'
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-3 px-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2"
                        />
                     </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};