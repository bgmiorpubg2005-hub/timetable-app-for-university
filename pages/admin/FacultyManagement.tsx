import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Faculty, Role, User, Subject, StudentGroup } from '../../context/types';
import { Modal } from '../../components/common/Modal';
import { TIME_SLOTS, DAYS } from '../../context/constants';

// --- Reusable Editor Modal Component ---
const FacultyEditorModal: React.FC<{
    faculty: Faculty | null,
    onClose: () => void,
    onSave: (faculty: Faculty) => void,
    subjects: Subject[],
    studentGroups: StudentGroup[]
}> = ({ faculty, onClose, onSave, subjects, studentGroups }) => {
    if (!faculty) return null;

    const [currentFaculty, setCurrentFaculty] = useState<Faculty>(faculty);
    const [activeTab, setActiveTab] = useState('info');
    const [subjectSearch, setSubjectSearch] = useState('');

    useEffect(() => {
        setCurrentFaculty(faculty);
    }, [faculty]);
    
    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentFaculty({ ...currentFaculty, [e.target.name]: e.target.value });
    };

    const handleAddExpertise = (subjectId: string) => {
        if (currentFaculty.expertise.includes(subjectId)) return;
        setCurrentFaculty({ ...currentFaculty, expertise: [...currentFaculty.expertise, subjectId] });
    };
    
    const handleRemoveExpertise = (subjectId: string) => {
        setCurrentFaculty({ ...currentFaculty, expertise: currentFaculty.expertise.filter(id => id !== subjectId) });
    };

    const handleAddAssignment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const subjectId = formData.get('subjectId') as string;
        const groupId = formData.get('groupId') as string;

        if (!subjectId || !groupId || currentFaculty.assignments.some(a => a.subjectId === subjectId && a.groupId === groupId)) return;

        setCurrentFaculty({ ...currentFaculty, assignments: [...currentFaculty.assignments, { subjectId, groupId }] });
        e.currentTarget.reset();
    };
    
    const handleRemoveAssignment = (index: number) => {
        const updatedAssignments = [...currentFaculty.assignments];
        updatedAssignments.splice(index, 1);
        setCurrentFaculty({ ...currentFaculty, assignments: updatedAssignments });
    };

    const isNew = !faculty.id;
    const inputClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500";
    
    const TABS = [{id: 'info', name: 'Basic Info'}, {id: 'expertise', name: 'Expertise'}, {id: 'assignments', name: 'Assignments'}];

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Add New Faculty' : `Edit ${faculty.name}`}>
            <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6">
                        {TABS.map(tab => (
                             <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600'}`}>{tab.name}</button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                            <input type="text" name="name" value={currentFaculty.name} onChange={handleInfoChange} className={`${inputClass} mt-1`} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input type="email" name="email" value={currentFaculty.email} onChange={handleInfoChange} className={`${inputClass} mt-1`} required />
                        </div>
                    </div>
                )}
                
                {activeTab === 'expertise' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                            <h4 className="font-semibold text-sm mb-2 dark:text-slate-300">Assigned ({currentFaculty.expertise.length})</h4>
                            <div className="space-y-2 min-h-[150px] max-h-[200px] overflow-y-auto">
                                {currentFaculty.expertise.map(id => (
                                    <div key={id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded-md text-sm">
                                        <span>{subjects.find(s => s.id === id)?.name}</span>
                                        <button onClick={() => handleRemoveExpertise(id)} className="text-red-500 hover:text-red-700 text-xs font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                             <input type="text" placeholder="Search available subjects..." value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} className={`${inputClass} mb-2 text-sm`} />
                            <div className="space-y-2 min-h-[150px] max-h-[200px] overflow-y-auto">
                               {subjects.filter(s => !currentFaculty.expertise.includes(s.id) && s.name.toLowerCase().includes(subjectSearch.toLowerCase())).map(s => (
                                    <div key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded-md text-sm">
                                        <span>{s.name}</span>
                                        <button onClick={() => handleAddExpertise(s.id)} className="text-green-500 hover:text-green-700 text-xs font-bold">+</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="pt-2">
                        <ul className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                            {currentFaculty.assignments.map((a, i) => (
                                <li key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-sm">
                                    <span>Teaches <strong>{subjects.find(s=>s.id === a.subjectId)?.name}</strong> to <strong>{studentGroups.find(g=>g.id === a.groupId)?.name}</strong></span>
                                    <button onClick={() => handleRemoveAssignment(i)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddAssignment} className="flex flex-col sm:flex-row gap-2">
                            <select name="subjectId" required className={`${inputClass} flex-1`}>
                                <option value="">Select Subject</option>
                                {subjects.filter(s => currentFaculty.expertise.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select name="groupId" required className={`${inputClass} flex-1`}>
                                <option value="">Select Group</option>
                                {studentGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">Add</button>
                        </form>
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button onClick={() => onSave(currentFaculty)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Save Changes</button>
                </div>
            </div>
        </Modal>
    )
}


// --- Main Faculty Management Component ---
export const FacultyManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { faculty, subjects, studentGroups, users } = state;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddNew = () => {
        setEditingFaculty({
            id: '', name: '', email: '', expertise: [], assignments: [],
            availability: { Monday: TIME_SLOTS, Tuesday: TIME_SLOTS, Wednesday: TIME_SLOTS, Thursday: TIME_SLOTS, Friday: TIME_SLOTS },
        });
        setIsModalOpen(true);
    };

    const handleEdit = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFaculty(null);
    };

    const handleDelete = (facultyId: string) => {
        if (window.confirm('Are you sure? This will delete the faculty member and their user account.')) {
            dispatch({ type: 'DELETE_ITEM', payload: { itemType: 'faculty', id: facultyId } });
            dispatch({ type: 'DELETE_ITEM', payload: { itemType: 'users', id: facultyId } });
            dispatch({ type: 'SHOW_TOAST', payload: { message: 'Faculty deleted.', type: 'success' } });
        }
    };
    
    const handleSave = (facultyData: Faculty) => {
        const isNew = !facultyData.id;
        if (isNew) {
            const newId = `u${Date.now()}`;
            const newUser: User = { id: newId, name: facultyData.name, email: facultyData.email, role: Role.FACULTY };
            const newFaculty: Faculty = { ...facultyData, id: newId };
            dispatch({ type: 'ADD_ITEM', payload: { itemType: 'users', data: newUser } });
            dispatch({ type: 'ADD_ITEM', payload: { itemType: 'faculty', data: newFaculty } });
            dispatch({ type: 'SHOW_TOAST', payload: { message: 'Faculty member added!', type: 'success' } });
        } else {
            const user = users.find(u => u.id === facultyData.id);
            if (user && (user.name !== facultyData.name || user.email !== facultyData.email)) {
                dispatch({ type: 'UPDATE_ITEM', payload: { itemType: 'users', data: { ...user, name: facultyData.name, email: facultyData.email } } });
            }
            dispatch({ type: 'UPDATE_ITEM', payload: { itemType: 'faculty', data: facultyData } });
            dispatch({ type: 'SHOW_TOAST', payload: { message: 'Faculty details updated!', type: 'success' } });
        }
        handleCloseModal();
    };

    const filteredFaculty = useMemo(() => {
        return faculty.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [faculty, searchTerm]);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Faculty Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add, edit, and manage faculty members and their assignments.</p>
                </div>
                <button onClick={handleAddNew} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center sm:w-auto w-full">
                    <i className="fa-solid fa-plus mr-2"></i>Add New Faculty
                </button>
            </div>
            
            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFaculty.map(f => (
                    <div key={f.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{f.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{f.email}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Expertise ({f.expertise.length})</h4>
                                <div className="flex flex-wrap gap-1 mt-1 min-h-[24px]">
                                    {f.expertise.length > 0 ? f.expertise.slice(0, 3).map(subId => (
                                        <span key={subId} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-2 py-1 rounded-full">
                                            {subjects.find(s => s.id === subId)?.name || 'Unknown'}
                                        </span>
                                    )) : <p className="text-xs text-slate-500 dark:text-slate-400">None assigned</p>}
                                    {f.expertise.length > 3 && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">+{f.expertise.length - 3} more</span>}
                                </div>
                            </div>
                            <div className="mt-3">
                                 <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Assignments ({f.assignments.length})</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{f.assignments.length > 0 ? `${f.assignments.length} class(es) assigned` : 'None assigned'}.</p>
                            </div>
                        </div>
                         <div className="mt-4 flex space-x-2 pt-3 border-t border-slate-200 dark:border-slate-600">
                            <button onClick={() => handleEdit(f)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(f.id)} className="text-sm text-red-500 dark:text-red-400 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

             {isModalOpen && editingFaculty && (
                <FacultyEditorModal 
                    faculty={editingFaculty} 
                    onClose={handleCloseModal} 
                    onSave={handleSave}
                    subjects={subjects}
                    studentGroups={studentGroups}
                />
            )}
        </div>
    );
};
