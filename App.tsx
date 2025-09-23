import React, { useContext, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CoreDataManagement } from './pages/admin/CoreDataManagement';
import { FacultyManagement } from './pages/admin/FacultyManagement';
import { TimetableAdmin } from './pages/admin/TimetableAdmin';
import { MySchedule } from './pages/faculty/MySchedule';
import { AvailabilityRequests } from './pages/faculty/AvailabilityRequests';
import { ViewTimetable } from './pages/principal/ViewTimetable';
import { Approvals } from './pages/principal/Approvals';

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
      {renderContent()}
    </Layout>
  );
};

export default App;