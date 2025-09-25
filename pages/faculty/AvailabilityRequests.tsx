import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { TIME_SLOTS, DAYS } from '../../context/constants';
import { Faculty, LeaveRequest, SwapRequest, TimetableEntry, Role } from '../../context/types';
import { Modal } from '../../components/common/Modal';

export const AvailabilityRequests: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { currentUser, faculty, leaveRequests, publishedTimetable, subjects, studentGroups, swapRequests } = state;
    
    const facultyData = useMemo(() => faculty.find(f => f.id === currentUser?.id), [faculty, currentUser]);
    
    const [availability, setAvailability] = useState(facultyData?.availability || {});
    const [isEditing, setIsEditing] = useState(false);

    const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
    const [isSwapModalOpen, setSwapModalOpen] = useState(false);
    
    const myClasses = useMemo(() => {
      if (!publishedTimetable || !currentUser) return [];
      return publishedTimetable.filter(e => e.facultyId === currentUser.id);
    }, [publishedTimetable, currentUser]);

    const colleagues = useMemo(() => {
        if (!currentUser) return [];
        return faculty.filter(f => f.id !== currentUser.id);
    }, [faculty, currentUser]);


    const toggleAvailability = (day: string, time: string) => {
        setAvailability(prev => {
            const daySlots = prev[day] || [];
            const newSlots = daySlots.includes(time) ? daySlots.filter(slot => slot !== time) : [...daySlots, time];
            return { ...prev, [day]: newSlots };
        });
    };

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setAvailability(facultyData?.availability || {});
        setIsEditing(false);
    };

    const handleSaveChanges = () => {
        if (!facultyData) return;
        const updatedFaculty: Faculty = { ...facultyData, availability };
        dispatch({ type: 'UPDATE_ITEM', payload: { itemType: 'faculty', data: updatedFaculty } });
        setIsEditing(false);
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Availability saved successfully!', type: 'success' } });
    };

    const handleNewLeaveRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const leaveType = formData.get('leaveType') as LeaveRequest['leaveType'];
        const startDate = formData.get('startDate') as string;
        
        const newRequest: LeaveRequest = {
            id: `lr-${Date.now()}`,
            facultyId: currentUser!.id,
            startDate: startDate,
            endDate: leaveType === 'multi-day' ? (formData.get('endDate') as string) : startDate,
            reason: formData.get('reason') as string,
            status: 'Pending',
            leaveType: leaveType,
            halfDaySession: leaveType === 'half-day' ? (formData.get('halfDaySession') as LeaveRequest['halfDaySession']) : undefined,
        };
        dispatch({ type: 'ADD_REQUEST', payload: { requestType: 'leaveRequests', data: newRequest } });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Leave request submitted!', type: 'success' } });
        
        // Notify all Principals
        const principals = state.users.filter(u => u.role === Role.PRINCIPAL);
        principals.forEach(principal => {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    userId: principal.id,
                    message: `A new leave request from ${currentUser!.name} is pending your approval.`
                }
            });
        });
        
        setLeaveModalOpen(false);
    };

    const handleNewSwapRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!publishedTimetable || !currentUser) return;

        const formData = new FormData(e.currentTarget);
        const myClassString = formData.get('myClass') as string;
        const theirFacultyId = formData.get('theirFacultyId') as string;
        const theirClassString = formData.get('theirClass') as string;
        
        const myClass = JSON.parse(myClassString);
        const theirClass = JSON.parse(theirClassString);

        const newRequest: SwapRequest = {
            id: `sr-${Date.now()}`,
            facultyId: currentUser!.id,
            myClass,
            theirFacultyId,
            theirClass,
            reason: formData.get('reason') as string,
            status: 'Pending',
        }
        dispatch({ type: 'ADD_REQUEST', payload: { requestType: 'swapRequests', data: newRequest } });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Swap request submitted!', type: 'success' } });
        
        // Notify the colleague
        dispatch({ 
            type: 'ADD_NOTIFICATION', 
            payload: { 
                userId: theirFacultyId, 
                message: `${currentUser.name} has requested to swap a class with you.` 
            } 
        });

        // Notify all Admins
        const admins = state.users.filter(u => u.role === Role.ADMIN);
        admins.forEach(admin => {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    userId: admin.id,
                    message: `A new class swap request from ${currentUser.name} is pending your review.`
                }
            });
        });

        setSwapModalOpen(false);
    }

    const myLeaveRequests = leaveRequests.filter(r => r.facultyId === currentUser?.id);
    const mySwapRequests = swapRequests.filter(r => r.facultyId === currentUser?.id || r.theirFacultyId === currentUser?.id);

    const getStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
        const colors = { Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', Approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
        return colors[status];
    };
    
    const inputClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500";
    
    const getClassDetails = (entry: TimetableEntry) => {
        const subject = subjects.find(s => s.id === entry.subjectId)?.name || '?';
        const group = studentGroups.find(g => g.id === entry.groupId)?.name || '?';
        return `${subject} for ${group} (${entry.day.substring(0,3)} ${entry.time})`;
    };
    
    const formatLeaveDate = (req: LeaveRequest) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const startDate = new Date(req.startDate + 'T00:00:00').toLocaleDateString('en-US', options);
        if (req.leaveType === 'full-day') return startDate;
        if (req.leaveType === 'half-day') return `${startDate} (${req.halfDaySession === 'first-half' ? 'First Half' : 'Second Half'})`;
        const endDate = new Date(req.endDate + 'T00:00:00').toLocaleDateString('en-US', options);
        return `${startDate} to ${endDate}`;
    };

    const LeaveRequestModalContent = () => {
        const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('full-day');
        
        return (
            <form onSubmit={handleNewLeaveRequest} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                    <select name="leaveType" value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveRequest['leaveType'])} className={inputClass}>
                        <option value="full-day">Full Day</option>
                        <option value="multi-day">Multi-Day</option>
                        <option value="half-day">Half Day</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{leaveType === 'multi-day' ? 'Start Date' : 'Date'}</label>
                        <input type="date" name="startDate" required className={inputClass} />
                    </div>
                    {leaveType === 'multi-day' && (
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                           <input type="date" name="endDate" required className={inputClass} />
                        </div>
                    )}
                    {leaveType === 'half-day' && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Session</label>
                            <select name="halfDaySession" required className={inputClass}>
                                <option value="first-half">First Half</option>
                                <option value="second-half">Second Half</option>
                            </select>
                        </div>
                    )}
                </div>

                <textarea name="reason" rows={3} placeholder="Reason for leave..." required className={inputClass}></textarea>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Submit</button>
                </div>
            </form>
        )
    }

    const SwapRequestModalContent = () => {
        const [selectedColleagueId, setSelectedColleagueId] = useState('');
        const colleagueClasses = useMemo(() => {
            if (!publishedTimetable || !selectedColleagueId) return [];
            return publishedTimetable.filter(e => e.facultyId === selectedColleagueId);
        }, [publishedTimetable, selectedColleagueId]);

        return (
             <form onSubmit={handleNewSwapRequest} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">My Class to Swap</label>
                    <select name="myClass" required className={inputClass + " mt-1"}>
                        <option value="">Select your class</option>
                        {myClasses.map((c, i) => <option key={i} value={JSON.stringify(c)}>{getClassDetails(c)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Swap With</label>
                    <select name="theirFacultyId" required value={selectedColleagueId} onChange={e => setSelectedColleagueId(e.target.value)} className={inputClass + " mt-1"}>
                        <option value="">Select a colleague</option>
                        {colleagues.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                {selectedColleagueId && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Their Class</label>
                        <select name="theirClass" required className={inputClass + " mt-1"}>
                            <option value="">Select colleague's class</option>
                            {colleagueClasses.map((c, i) => <option key={i} value={JSON.stringify(c)}>{getClassDetails(c)}</option>)}
                        </select>
                    </div>
                )}
                <textarea name="reason" rows={3} placeholder="Reason for swap..." required className={inputClass}></textarea>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Submit</button>
                </div>
            </form>
        )
    }

    return (
        <div className="space-y-8">
            {/* Availability */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Weekly Availability</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancel} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors w-full sm:w-auto">
                                    Cancel
                                </button>
                                <button onClick={handleSaveChanges} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors w-full sm:w-auto">
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEdit} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto flex items-center justify-center">
                                <i className="fas fa-edit mr-2"></i>Edit Availability
                            </button>
                        )}
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <div className="grid grid-cols-[auto_repeat(5,1fr)] text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                        <div className="p-2 sticky left-0 bg-white dark:bg-slate-800"></div> {/* Empty corner */}
                        {DAYS.map(day => <div key={day} className="p-2 border-b-2 border-slate-200 dark:border-slate-700 min-w-[100px]">{day}</div>)}
                        
                        {TIME_SLOTS.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 border-r-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs sticky left-0 bg-white dark:bg-slate-800">{time}</div>
                                {DAYS.map(day => {
                                    const isAvailable = availability[day]?.includes(time);
                                    return (
                                        <div key={`${day}-${time}`} className="border-t border-l border-slate-200 dark:border-slate-700 p-1">
                                            <button 
                                                onClick={() => isEditing && toggleAvailability(day, time)}
                                                disabled={!isEditing}
                                                className={`w-full h-12 rounded-md transition-colors ${
                                                    isAvailable ? 'bg-green-400 dark:bg-green-600' : 'bg-slate-100 dark:bg-slate-700'
                                                } ${isEditing ? 'hover:bg-green-500 dark:hover:bg-green-500' : 'cursor-not-allowed'}`}
                                                aria-label={`Toggle availability for ${day} at ${time}`}
                                            >
                                                {isAvailable && <i className="fa-solid fa-check text-white"></i>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Requests */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Requests</h2>
                    <div className='flex gap-2 flex-col sm:flex-row'>
                        <button onClick={() => setSwapModalOpen(true)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto">
                            New Swap Request
                        </button>
                        <button onClick={() => setLeaveModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors w-full sm:w-auto">
                            New Leave Request
                        </button>
                    </div>
                </div>
                
                {/* Leave Requests Table */}
                <h3 className="font-semibold text-lg mb-2 dark:text-slate-200">Leave Requests</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Dates</th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Reason</th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                             {myLeaveRequests.map(req => (
                                <tr key={req.id}>
                                    <td className="py-2 px-3 text-sm text-slate-600 dark:text-slate-300">{formatLeaveDate(req)}</td>
                                    <td className="py-2 px-3 text-sm text-slate-600 dark:text-slate-300">{req.reason}</td>
                                    <td className="py-2 px-3"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                                </tr>
                             ))}
                            {myLeaveRequests.length === 0 && <tr><td colSpan={3} className="text-slate-500 dark:text-slate-400 py-4 px-3 text-sm">No leave requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Swap Requests Table */}
                <h3 className="font-semibold text-lg mb-2 mt-6 dark:text-slate-200">Class Swap Requests</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">My Class</th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Their Class</th>
                                <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                             {mySwapRequests.map(req => {
                                const theirFacultyName = faculty.find(f => f.id === req.theirFacultyId)?.name || '?';
                                return (
                                <tr key={req.id}>
                                    <td className="py-2 px-3 text-sm text-slate-600 dark:text-slate-300">{getClassDetails(req.myClass)}</td>
                                    <td className="py-2 px-3 text-sm text-slate-600 dark:text-slate-300">{getClassDetails(req.theirClass)} (with {theirFacultyName})</td>
                                    <td className="py-2 px-3"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                                </tr>
                             )})}
                            {mySwapRequests.length === 0 && <tr><td colSpan={3} className="text-slate-500 dark:text-slate-400 py-4 px-3 text-sm">No swap requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isLeaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Submit Leave Request">
                <LeaveRequestModalContent />
            </Modal>
            <Modal isOpen={isSwapModalOpen} onClose={() => setSwapModalOpen(false)} title="Submit Class Swap Request">
                <SwapRequestModalContent />
            </Modal>
        </div>
    );
};