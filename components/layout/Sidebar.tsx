import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Role, View } from '../../context/types';

const NAV_ITEMS: { view: View; icon: string; roles: Role[] }[] = [
    { view: 'Dashboard', icon: 'fa-solid fa-chart-pie', roles: [Role.ADMIN, Role.FACULTY, Role.PRINCIPAL] },
    // Admin
    { view: 'Core Data Management', icon: 'fa-solid fa-database', roles: [Role.ADMIN] },
    { view: 'Faculty Management', icon: 'fa-solid fa-users-gear', roles: [Role.ADMIN] },
    { view: 'Timetable', icon: 'fa-solid fa-calendar-days', roles: [Role.ADMIN] },
    // Faculty
    { view: 'My Schedule', icon: 'fa-solid fa-calendar-user', roles: [Role.FACULTY] },
    { view: 'Availability & Requests', icon: 'fa-solid fa-clock-rotate-left', roles: [Role.FACULTY] },
    // Principal & Faculty
    { view: 'View Timetable', icon: 'fa-solid fa-calendar-check', roles: [Role.PRINCIPAL, Role.FACULTY] },
    { view: 'Approvals', icon: 'fa-solid fa-stamp', roles: [Role.PRINCIPAL, Role.ADMIN] },
];

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { currentUser, activeView, isSidebarOpen } = state;

  if (!currentUser) return null;

  const availableNavItems = NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));

  const handleNavClick = (view: View) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
  };

  return (
    <>
    <nav className={`absolute lg:relative w-64 h-full bg-slate-800 dark:bg-slate-900 text-white shadow-lg flex-shrink-0 flex flex-col z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="h-20 flex items-center justify-center border-b border-slate-700 dark:border-slate-800">
        <i className="fa-solid fa-brain text-3xl text-indigo-400"></i>
        <h1 className="text-xl font-bold ml-3">IntelliSchedule</h1>
      </div>
      <ul className="flex-1 px-4 py-6 overflow-y-auto sidebar-scroll">
        {availableNavItems.map(({ view, icon }) => (
          <li key={view} className="mb-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(view);
              }}
              className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                activeView === view
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`${icon} w-6 text-center text-lg`}></i>
              <span className="ml-4 font-medium">{view}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
    {isSidebarOpen && <div onClick={() => dispatch({type: 'TOGGLE_SIDEBAR'})} className="fixed inset-0 bg-black/50 z-10 lg:hidden"></div>}
    </>
  );
};
