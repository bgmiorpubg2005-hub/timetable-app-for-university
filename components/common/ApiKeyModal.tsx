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
                        <p>The Google Gemini API key is not accessible to the application.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300">
            To use the AI-powered features, this application requires an environment variable named <code>API_KEY</code>.
        </p>
        
        <div className="text-sm space-y-3 text-slate-500 dark:text-slate-400">
            <p><i className="fa-solid fa-circle-info mr-2 text-blue-500"></i>
                <strong>Note for Vercel/Netlify users:</strong> By default, hosting platforms only expose environment variables with specific prefixes (like <code>NEXT_PUBLIC_</code> or <code>VITE_</code>) to the frontend for security.
            </p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
                However, this application must read the variable with the exact name <code>API_KEY</code>.
            </p>
            <p>
                Please ensure you have configured your project's deployment settings to expose <code>API_KEY</code> to the client-side build process. You may need to adjust your build settings or framework configuration on your hosting platform.
            </p>
             <p className="text-xs italic text-red-500 dark:text-red-400 border-t border-slate-200 dark:border-slate-700 pt-3">
                <strong>Warning:</strong> Exposing API keys on the client-side is a security risk. For production applications, it is strongly recommended to route API calls through a secure backend.
            </p>
        </div>
        
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
