import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Role, LeaveRequest } from '../types';
import { FACULTY_DATA, CLASSROOM_DATA, SUBJECT_DATA, LEAVE_REQUESTS_DATA } from '../constants';

const classroomUtilization = [
  { name: 'C101', used: 8, total: 10 },
  { name: 'C203', used: 6, total: 10 },
  { name: 'Lab 1', used: 9, total: 10 },
  { name: 'Smart Class A', used: 7, total: 10 },
];

const facultyWorkload = [
  { name: 'High Load', value: 4 },
  { name: 'Medium Load', value: 8 },
  { name: 'Low Load', value: 3 },
];
const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const StatCard: React.FC<{ icon: string; title: string; value: number | string; color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
            <i className={`${icon} text-3xl text-white`}></i>
        </div>
        <div>
            <p className="text-slate-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const PendingRequests: React.FC = () => {
    const pending = LEAVE_REQUESTS_DATA.filter(req => req.status === 'Pending');

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Pending Requests</h3>
            {pending.length > 0 ? (
                <div className="space-y-4">
                    {pending.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-700">{req.facultyName}</p>
                                <p className="text-sm text-slate-500">{req.reason}</p>
                            </div>
                            <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500">No pending requests at the moment.</p>
            )}
        </div>
    )
}

export const Dashboard: React.FC<{ currentUserRole: Role }> = ({ currentUserRole }) => {
  const pendingRequestsCount = LEAVE_REQUESTS_DATA.filter(req => req.status === 'Pending').length;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="fa-solid fa-chalkboard-user" title="Total Faculty" value={FACULTY_DATA.length} color="bg-indigo-500" />
        <StatCard icon="fa-solid fa-school" title="Total Classrooms" value={CLASSROOM_DATA.length} color="bg-sky-500" />
        <StatCard icon="fa-solid fa-book" title="Total Subjects" value={SUBJECT_DATA.length} color="bg-emerald-500" />
        <StatCard icon="fa-solid fa-flag" title="Pending Requests" value={pendingRequestsCount} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Classroom Utilization (Hours/Day)</h3>
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classroomUtilization}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip wrapperClassName="!bg-white !border-slate-200 !rounded-md !shadow-lg" />
                <Legend />
                <Bar dataKey="used" fill="#4f46e5" name="Hours Used" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Faculty Workload Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={facultyWorkload}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {facultyWorkload.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip wrapperClassName="!bg-white !border-slate-200 !rounded-md !shadow-lg" />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

       {(currentUserRole === Role.ADMIN || currentUserRole === Role.PRINCIPAL) && <PendingRequests />}

       {currentUserRole === Role.PRINCIPAL && (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Final Timetable Approval</h3>
            <p className="text-slate-600 mb-4">The final timetable for the upcoming semester is ready for your review.</p>
            <div className="flex space-x-4">
                <button className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                    <i className="fa-solid fa-check mr-2"></i>Approve Timetable
                </button>
                <button className="bg-amber-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                    <i className="fa-solid fa-pen-to-square mr-2"></i>Request Changes
                </button>
            </div>
        </div>
       )}
    </div>
  );
};