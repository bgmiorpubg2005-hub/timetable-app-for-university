import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Role, View } from '../context/types';

export const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { currentUser } = state;

    const navigateTo = (view: View) => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
    };

    const renderAdminDashboard = () => (
        <>
            <Card 
                title="Core Data Management" 
                description="Manage classrooms, subjects, and student groups."
                icon="fa-solid fa-database"
                onClick={() => navigateTo('Core Data Management')}
            />
            <Card 
                title="Faculty Management" 
                description="Assign subjects and classes to faculty members."
                icon="fa-solid fa-users-gear"
                onClick={() => navigateTo('Faculty Management')}
            />
            <Card 
                title="Timetable" 
                description="Generate, review, and publish the master timetable."
                icon="fa-solid fa-calendar-days"
                onClick={() => navigateTo('Timetable')}
            />
        </>
    );

    const renderFacultyDashboard = () => (
        <>
            <Card 
                title="My Schedule" 
                description="View your personal weekly teaching schedule."
                icon="fa-solid fa-calendar-user"
                onClick={() => navigateTo('My Schedule')}
            />
            <Card 
                title="Availability & Requests" 
                description="Update your availability and manage leave/swap requests."
                icon="fa-solid fa-clock-rotate-left"
                onClick={() => navigateTo('Availability & Requests')}
            />
        </>
    );
    
    const renderPrincipalDashboard = () => (
        <>
            <Card 
                title="View Timetable" 
                description="Oversee the final published schedule for all staff."
                icon="fa-solid fa-calendar-check"
                onClick={() => navigateTo('View Timetable')}
            />
            <Card 
                title="Approvals" 
                description="Review and approve/reject faculty requests."
                icon="fa-solid fa-stamp"
                onClick={() => navigateTo('Approvals')}
            />
        </>
    );

    const renderContent = () => {
        switch (currentUser?.role) {
            case Role.ADMIN:
                return renderAdminDashboard();
            case Role.FACULTY:
                return renderFacultyDashboard();
            case Role.PRINCIPAL:
                return renderPrincipalDashboard();
            default:
                return <p>Welcome!</p>;
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome, {currentUser?.name}!</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Select an option below to get started.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderContent()}
            </div>
        </div>
    );
};