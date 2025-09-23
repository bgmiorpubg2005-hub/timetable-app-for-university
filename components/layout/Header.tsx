import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { currentUser, notifications } = state;
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);


  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.isRead).length;
  }, [userNotifications]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };
  
  const handleToggleSidebar = () => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
  }

  const handleMarkAsRead = () => {
    if (!currentUser) return;
    dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { userId: currentUser.id } });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="h-20 bg-white dark:bg-slate-800 shadow-md flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-10 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center">
        <button onClick={handleToggleSidebar} className="text-slate-500 dark:text-slate-400 mr-4 lg:hidden">
            <i className="fas fa-bars text-xl"></i>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">IntelliSchedule AI</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        <div className="relative" ref={notificationRef}>
          <button 
              onClick={() => setNotificationsOpen(!isNotificationsOpen)} 
              className="flex items-center justify-center h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="Notifications"
          >
              <i className="fa-regular fa-bell text-lg"></i>
              {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                      {unreadCount}
                  </span>
              )}
          </button>
          
          {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-30 animate-fade-in-down">
                  <div className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h4>
                      {unreadCount > 0 && <button onClick={handleMarkAsRead} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mark all as read</button>}
                  </div>
                  <div className="max-h-96 overflow-y-auto sidebar-scroll">
                      {userNotifications.length > 0 ? (
                          userNotifications.map(n => (
                              <div key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-700/50 ${!n.isRead ? 'bg-indigo-50 dark:bg-slate-700/50' : ''}`}>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                              </div>
                          ))
                      ) : (
                          <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">You have no new notifications.</p>
                      )}
                  </div>
              </div>
          )}
      </div>

        <div className='hidden sm:block text-right'>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{currentUser.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center justify-center h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Logout"
        >
          <i className="fa-solid fa-right-from-bracket text-lg"></i>
        </button>
      </div>
    </header>
  );
};
