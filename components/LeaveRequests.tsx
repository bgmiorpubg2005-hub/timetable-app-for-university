import React, { useState, useMemo } from 'react';
import { Role, LeaveRequest as LeaveRequestType } from '../types';
import { LEAVE_REQUESTS_DATA, USERS } from '../constants';
import { Modal } from './Modal';

interface LeaveRequestsProps {
    currentUserRole: Role;
}

const getStatusBadge = (status: LeaveRequestType['status']) => {
    switch(status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-amber-100 text-amber-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
    }
}

export const LeaveRequests: React.FC<LeaveRequestsProps> = ({ currentUserRole }) => {
    const [requests, setRequests] = useState<LeaveRequestType[]>(LEAVE_REQUESTS_DATA);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const facultyUser = USERS.find(u => u.role === Role.FACULTY);

    const filteredRequests = useMemo(() => {
        if (currentUserRole === Role.ADMIN || currentUserRole === Role.PRINCIPAL) {
            return requests;
        }
        return requests.filter(req => req.facultyId === facultyUser?.id);
    }, [currentUserRole, requests, facultyUser]);
    
    const handleStatusChange = (id: string, status: LeaveRequestType['status']) => {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    };

    const handleNewRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newRequest: LeaveRequestType = {
            id: `L${requests.length + 1}`,
            facultyId: facultyUser?.id || 'F_UNKNOWN',
            facultyName: facultyUser?.name || 'Unknown Faculty',
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            reason: formData.get('reason') as string,
            status: 'Pending',
        };
        setRequests(prev => [newRequest, ...prev]);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Leave Requests</h2>
                {currentUserRole === Role.FACULTY && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                        <i className="fa-solid fa-plus mr-2"></i>New Request
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {currentUserRole !== Role.FACULTY && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Faculty</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            {currentUserRole !== Role.FACULTY && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredRequests.map(req => (
                            <tr key={req.id}>
                                {currentUserRole !== Role.FACULTY && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{req.facultyName}</td>}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>
                                        {req.status}
                                    </span>
                                </td>
                                {currentUserRole !== Role.FACULTY && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {req.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleStatusChange(req.id, 'Approved')} className="text-green-600 hover:text-green-900">Approve</button>
                                                <button onClick={() => handleStatusChange(req.id, 'Rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                            </>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Leave Request">
                <form onSubmit={handleNewRequest} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                            <input type="date" name="startDate" id="startDate" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                            <input type="date" name="endDate" id="endDate" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Reason</label>
                        <textarea name="reason" id="reason" rows={3} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></textarea>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Submit Request</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};