import React, { ReactNode, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { Toast } from '../common/Toast';
import { Header } from './Header';
import { Sidebar } from './Sidebar';


export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, dispatch } = useContext(AppContext);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={() => dispatch({ type: 'HIDE_TOAST' })}
        />
      )}
      {state.isGenerating && <LoadingOverlay />}
    </div>
  );
};