import React, { useMemo } from 'react';
import { View, Role, DataItem, FacultyMember, Subject, Classroom } from '../types';
import { FACULTY_DATA, SUBJECT_DATA, CLASSROOM_DATA } from '../constants';

interface DataManagementProps {
    view: 'Faculty' | 'Subjects' | 'Classrooms';
    currentUserRole: Role;
}

const DataCard: React.FC<{ item: DataItem, type: DataManagementProps['view'] }> = ({ item, type }) => {
    const renderContent = () => {
        switch (type) {
            case 'Faculty':
                const faculty = item as FacultyMember;
                const availableDays = Object.entries(faculty.availability)
                    .filter(([, slots]) => slots.length > 0)
                    .map(([day]) => day.substring(0,3))
                    .join(', ');
                return <>
                    <p className="text-slate-600">Subject: {faculty.subject}</p>
                    <p className="text-slate-600">Availability: {availableDays}</p>
                </>;
            case 'Subjects':
                const subject = item as Subject;
                return <>
                    <p className="text-slate-600">Code: {subject.code}</p>
                    <p className="text-slate-600">Classes/Week: {subject.classesPerWeek}</p>
                </>;
            case 'Classrooms':
                const classroom = item as Classroom;
                return <>
                    <p className="text-slate-600">Capacity: {classroom.capacity}</p>
                    <p className="text-slate-600">Type: {classroom.type}</p>
                </>;
        }
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <h4 className="font-bold text-lg text-indigo-600">{item.name}</h4>
            <div className="text-sm mt-2 space-y-1">
                {renderContent()}
            </div>
            <div className="mt-4 flex space-x-2">
                <button className="text-sm text-blue-500 hover:underline">Edit</button>
                <button className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
        </div>
    )
}

export const DataManagement: React.FC<DataManagementProps> = ({ view, currentUserRole }) => {
    const { data, title, icon } = useMemo(() => {
        switch (view) {
            case 'Faculty':
                return { data: FACULTY_DATA, title: 'Faculty Members', icon: 'fa-solid fa-chalkboard-user' };
            case 'Subjects':
                return { data: SUBJECT_DATA, title: 'Subjects', icon: 'fa-solid fa-book' };
            case 'Classrooms':
                return { data: CLASSROOM_DATA, title: 'Classrooms & Labs', icon: 'fa-solid fa-school' };
        }
    }, [view]);

    if (currentUserRole !== Role.ADMIN) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <i className="fa-solid fa-lock text-4xl text-amber-500 mb-4"></i>
                <h3 className="text-xl font-bold">Access Denied</h3>
                <p className="text-slate-600">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <i className={`${icon} text-2xl text-indigo-600`}></i>
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                </div>
                <button className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                    <i className="fa-solid fa-plus mr-2"></i>Add New
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.map(item => (
                    <DataCard key={item.id} item={item} type={view} />
                ))}
            </div>
        </div>
    );
};