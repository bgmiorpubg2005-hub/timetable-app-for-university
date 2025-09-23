import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { LeaveRequest, SwapRequest, TimetableEntry, Role } from '../../context/types';

export const Approvals: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { leaveRequests, swapRequests, faculty, subjects, studentGroups, publishedTimetable, currentUser } = state;
    const [activeTab, setActiveTab] = useState('leave');
    const [leaveStatusTab, setLeaveStatusTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [swapStatusTab, setSwapStatusTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [searchTerm, setSearchTerm] = useState('');

    const userRole = currentUser?.role;

    const handleLeaveStatusChange = (request: LeaveRequest, status: 'Approved' | 'Rejected') => {
        if (userRole !== Role.PRINCIPAL) return; // Safety check
        const updatedRequest = { ...request, status };
        dispatch({ type: 'UPDATE_ITEM', payload: { itemType: 'leaveRequests', data: updatedRequest } });

        // Notify the faculty member
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                userId: request.facultyId,
                message: `Your leave request for ${new Date(request.startDate).toLocaleDateString()} has been ${status.toLowerCase()}.`
            }
        });
        dispatch({ type: 'SHOW_TOAST', payload: { message: `Request ${status.toLowerCase()}`, type: 'success' } });
    };

    const handleSwapStatusChange = (request: SwapRequest, status: 'Approved' | 'Rejected') => {
        if (userRole !== Role.ADMIN) return; // Safety check
        
        const updatedRequest = { ...request, status };
        dispatch({ type: 'UPDATE_ITEM', payload: { itemType: 'swapRequests', data: updatedRequest } });
        
        // If approved, update the actual timetable
        if (status === 'Approved' && publishedTimetable) {
            const newTimetable = publishedTimetable.map(entry => {
                if (JSON.stringify(entry) === JSON.stringify(request.myClass)) {
                    return { ...entry, facultyId: request.theirFacultyId };
                }
                if (JSON.stringify(entry) === JSON.stringify(request.theirClass)) {
                    return { ...entry, facultyId: request.facultyId };
                }
                return entry;
            });
            dispatch({ type: 'UPDATE_PUBLISHED_TIMETABLE', payload: newTimetable });
        }

        // Notify both faculty members involved
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                userId: request.facultyId,
                message: `Your class swap request with ${faculty.find(f => f.id === request.theirFacultyId)?.name} has been ${status.toLowerCase()}.`
            }
        });
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                userId: request.theirFacultyId,
                message: `The class swap request from ${faculty.find(f => f.id === request.facultyId)?.name} has been ${status.toLowerCase()}.`
            }
        });
         dispatch({ type: 'SHOW_TOAST', payload: { message: `Request ${status.toLowerCase()}`, type: 'success' } });
    };

    const getFacultyName = (id: string) => faculty.find(f => f.id === id)?.name || 'Unknown';

    const filteredLeaveRequests = useMemo(() => {
        let requests = leaveRequests.filter(r => r.status === leaveStatusTab);
        if (searchTerm) {
            requests = requests.filter(r => getFacultyName(r.facultyId).toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return requests;
    }, [leaveRequests, leaveStatusTab, searchTerm, getFacultyName]);
    
    const filteredSwapRequests = useMemo(() => {
        let requests = swapRequests.filter(r => r.status === swapStatusTab);
        if (searchTerm) {
            requests = requests.filter(r => 
                getFacultyName(r.facultyId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getFacultyName(r.theirFacultyId).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return requests;
    }, [swapRequests, swapStatusTab, searchTerm, getFacultyName]);

    const getClassDetails = (entry: TimetableEntry) => {
        const subject = subjects.find(s => s.id === entry.subjectId)?.name || '?';
        const group = studentGroups.find(g => g.id === entry.groupId)?.name || '?';
        return `${subject} for ${group} (${entry.day.substring(0, 3)} ${entry.time})`;
    };
    
    const formatLeaveDate = (req: LeaveRequest) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const startDate = new Date(req.startDate + 'T00:00:00').toLocaleDateString('en-US', options);
        if (req.leaveType === 'full-day') return startDate;
        if (req.leaveType === 'half-day') return `${startDate} (${req.halfDaySession === 'first-half' ? 'First Half' : 'Second Half'})`;
        const endDate = new Date(req.endDate + 'T00:00:00').toLocaleDateString('en-US', options);
        return `${startDate} to ${endDate}`;
    };
    
    const renderLeaveRequests = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Faculty</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Dates</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Reason</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredLeaveRequests.map(req => (
                        <tr key={req.id}>
                            <td className="py-3 px-3 text-sm text-slate-700 dark:text-slate-300">{getFacultyName(req.facultyId)}</td>
                            <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{formatLeaveDate(req)}</td>
                            <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{req.reason}</td>
                            <td className="py-3 px-3 space-x-2">
                                {leaveStatusTab === 'Pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleLeaveStatusChange(req, 'Approved')} 
                                            disabled={userRole !== Role.PRINCIPAL}
                                            className="font-semibold text-green-600 hover:text-green-800 disabled:text-slate-400 disabled:cursor-not-allowed">Approve</button>
                                        <button 
                                            onClick={() => handleLeaveStatusChange(req, 'Rejected')}
                                            disabled={userRole !== Role.PRINCIPAL}
                                            className="font-semibold text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed">Reject</button>
                                    </>
                                )}
                                {userRole === Role.ADMIN && leaveStatusTab === 'Pending' && <span className="text-xs text-slate-500 italic">View Only</span>}
                            </td>
                        </tr>
                    ))}
                    {filteredLeaveRequests.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-slate-500">No requests found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
    
    const renderSwapRequests = () => (
         <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Request From</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Their Class</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Request To</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Their Class</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Reason</th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredSwapRequests.map(req => (
                        <tr key={req.id}>
                            <td className="py-3 px-3 text-sm text-slate-700 dark:text-slate-300">{getFacultyName(req.facultyId)}</td>
                            <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{getClassDetails(req.myClass)}</td>
                            <td className="py-3 px-3 text-sm text-slate-700 dark:text-slate-300">{getFacultyName(req.theirFacultyId)}</td>
                            <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{getClassDetails(req.theirClass)}</td>
                            <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{req.reason}</td>
                             <td className="py-3 px-3 space-x-2">
                                {swapStatusTab === 'Pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleSwapStatusChange(req, 'Approved')}
                                            disabled={userRole !== Role.ADMIN}
                                            className="font-semibold text-green-600 hover:text-green-800 disabled:text-slate-400 disabled:cursor-not-allowed">Approve</button>
                                        <button 
                                            onClick={() => handleSwapStatusChange(req, 'Rejected')}
                                            disabled={userRole !== Role.ADMIN}
                                            className="font-semibold text-red-600 hover:text-red-800 disabled:text-slate-400 disabled:cursor-not-allowed">Reject</button>
                                    </>
                                )}
                                {userRole === Role.PRINCIPAL && swapStatusTab === 'Pending' && <span className="text-xs text-slate-500 italic">View Only</span>}
                            </td>
                        </tr>
                    ))}
                    {filteredSwapRequests.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-500">No requests found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Approvals</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review and manage faculty requests.</p>
            </div>
            
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => { setActiveTab('leave'); setSearchTerm(''); }} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'leave' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}>Leave Requests</button>
                    <button onClick={() => { setActiveTab('swap'); setSearchTerm(''); }} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'swap' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}>Swap Requests</button>
                </nav>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                    {(['Pending', 'Approved', 'Rejected'] as const).map((status) => (
                        <button 
                            key={status} 
                            onClick={() => activeTab === 'leave' ? setLeaveStatusTab(status) : setSwapStatusTab(status)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                (activeTab === 'leave' && leaveStatusTab === status) || (activeTab === 'swap' && swapStatusTab === status)
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-slate-100 shadow'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                 <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by faculty name..."
                    className="w-full sm:w-auto max-w-xs p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>

            {activeTab === 'leave' ? renderLeaveRequests() : renderSwapRequests()}
        </div>
    );
};
