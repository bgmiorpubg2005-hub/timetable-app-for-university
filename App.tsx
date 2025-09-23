import React, { useContext, useEffect, Suspense, lazy } from 'react';
import { AppContext } from './context/AppContext';
import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const CoreDataManagement = lazy(() => import('./pages/admin/CoreDataManagement').then(module => ({ default: module.CoreDataManagement })));
const FacultyManagement = lazy(() => import('./pages/admin/FacultyManagement').then(module => ({ default: module.FacultyManagement })));
const TimetableAdmin = lazy(() => import('./pages/admin/TimetableAdmin').then(module => ({ default: module.TimetableAdmin })));
const MySchedule = lazy(() => import('./pages/faculty/MySchedule').then(module => ({ default: module.MySchedule })));
const AvailabilityRequests = lazy(() => import('./pages/faculty/AvailabilityRequests').then(module => ({ default: module.AvailabilityRequests })));
const ViewTimetable = lazy(() => import('./pages/principal/ViewTimetable').then(module => ({ default: module.ViewTimetable })));
const Approvals = lazy(() => import('./pages/principal/Approvals').then(module => ({ default: module.Approvals })));

const PageLoader: React.FC = () => (
  <div className="flex justify-center items-center w-full h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
  </div>
);

const App: React.FC = () => {
  const { state } = useContext(AppContext);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  if (!state.isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (state.activeView) {
      case 'Dashboard':
        return <Dashboard />;
      // Admin
      case 'Core Data Management':
        return <CoreDataManagement />;
      case 'Faculty Management':
        return <FacultyManagement />;
      case 'Timetable':
        return <TimetableAdmin />;
      // Faculty
      case 'My Schedule':
        return <MySchedule />;
      case 'Availability & Requests':
        return <AvailabilityRequests />;
      // Principal
      case 'View Timetable':
        return <ViewTimetable />;
      case 'Approvals':
        return <Approvals />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export default App;
