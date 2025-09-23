import React from 'react';
import { Modal } from './Modal';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API Key Configuration Required">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-500/30">
            <div className="flex">
                <div className="flex-shrink-0">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 dark:text-amber-400 text-xl"></i>
                </div>
                <div className="ml-3">
                    <h3 className="text-md font-semibold text-amber-800 dark:text-amber-200">Action Required</h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        <p>The Google Gemini API key has not been configured for this application.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300">
            To use the AI-powered features, you must set up an environment variable named <code>API_KEY</code> with your valid Google Gemini API key.
        </p>
        <p className="text-slate-600 dark:text-slate-300">
            Please refer to the deployment documentation for instructions on how to set environment variables for your hosting provider (e.g., Vercel, Netlify) or local development environment.
        </p>
        <div className="flex justify-end pt-2">
            <button 
                onClick={onClose} 
                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
                I Understand
            </button>
        </div>
      </div>
    </Modal>
  );
};
