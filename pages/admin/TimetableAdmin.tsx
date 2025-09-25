import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { generateTimetableWithGemini } from '../../services/geminiService';
import { TIME_SLOTS, DAYS } from '../../context/constants';
import { TimetableEntry, Role } from '../../context/types';
import { Modal } from '../../components/common/Modal';

declare const jspdf: any;

export const TimetableAdmin: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { draftTimetable, publishedTimetable, subjects, faculty, studentGroups, classrooms } = state;
    const [filterType, setFilterType] = useState('group');
    const [filterId, setFilterId] = useState('all');

    // State for generation modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generationProfile, setGenerationProfile] = useState<'balanced' | 'speed' | 'accuracy'>('balanced');
    const [additionalConstraints, setAdditionalConstraints] = useState('');
    
    // State for publish confirmation modal
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    const timetableToDisplay = publishedTimetable || draftTimetable;

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleGenerate = async () => {
        setIsModalOpen(false);
        dispatch({ type: 'SET_GENERATING', payload: true });
        try {
            // The service now calls our secure serverless function
            const result = await generateTimetableWithGemini(state, generationProfile, additionalConstraints);
            dispatch({ type: 'SET_DRAFT_TIMETABLE', payload: result });
        } catch (error) {
            dispatch({ type: 'SHOW_TOAST', payload: { message: (error as Error).message, type: 'error' } });
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    };

    const handleConfirmPublish = () => {
        dispatch({ type: 'PUBLISH_TIMETABLE' });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Timetable published successfully!', type: 'success' } });

        // Notify all non-admin users
        state.users.forEach(user => {
            if (user.role !== Role.ADMIN) {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        userId: user.id,
                        message: 'A new timetable has been published by the administrator.'
                    }
                });
            }
        });

        setConfirmModalOpen(false);
    };
    
    const handleSaveDraft = () => {
        // The state is saved automatically. This button just provides explicit user feedback.
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Draft saved successfully!', type: 'success' } });
    };

    const filteredTimetable = useMemo(() => {
        if (!timetableToDisplay || filterId === 'all') return timetableToDisplay;
        if (filterType === 'group') {
            return timetableToDisplay.filter(entry => entry.groupId === filterId);
        }
        if (filterType === 'faculty') {
            return timetableToDisplay.filter(entry => entry.facultyId === filterId);
        }
        return timetableToDisplay;
    }, [timetableToDisplay, filterType, filterId]);

    const getEntryData = (entry: TimetableEntry) => ({
        subject: subjects.find(s => s.id === entry.subjectId)?.name || '?',
        faculty: faculty.find(f => f.id === entry.facultyId)?.name || '?',
        group: studentGroups.find(g => g.id === entry.groupId)?.name || '?',
        room: classrooms.find(r => r.id === entry.roomId)?.name || '?',
    });

    const handleDownloadPdf = () => {
        const doc = new jspdf.jsPDF();
        const tableBody = [];
        const tableHead = [['Time', ...DAYS]];

        TIME_SLOTS.forEach(time => {
            const row = [time];
            DAYS.forEach(day => {
                const entries = filteredTimetable?.filter(e => e.day === day && e.time === time) || [];
                const cellText = entries.map(e => {
                    const data = getEntryData(e);
                    return `${data.subject}\n${data.faculty}\n${data.group} (${data.room})`;
                }).join('\n\n');
                row.push(cellText);
            });
            tableBody.push(row);
        });

        const filterName = filterId !== 'all' 
            ? (filterType === 'group' ? studentGroups.find(g=>g.id === filterId)?.name : faculty.find(f=>f.id === filterId)?.name)
            : 'Master Timetable';

        doc.text(`Timetable: ${filterName}`, 14, 15);
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 20,
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        });
        doc.save(`timetable_${filterName}.pdf`);
    };
    
    const inputSelectClasses = "p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500";
    
    const renderGenerationModal = () => (
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Timetable Settings">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Generation Profile</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-slate-700 has-[:checked]:border-indigo-500">
                <input type="radio" name="profile" value="speed" checked={generationProfile === 'speed'} onChange={() => setGenerationProfile('speed')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="ml-3 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">Speed-focused</span>
                  <span className="block text-slate-500 dark:text-slate-400">Fastest generation, good quality.</span>
                </span>
              </label>
              <label className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-slate-700 has-[:checked]:border-indigo-500">
                <input type="radio" name="profile" value="balanced" checked={generationProfile === 'balanced'} onChange={() => setGenerationProfile('balanced')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                 <span className="ml-3 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">Balanced (Recommended)</span>
                  <span className="block text-slate-500 dark:text-slate-400">Good balance of speed and accuracy.</span>
                </span>
              </label>
              <label className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-slate-700 has-[:checked]:border-indigo-500">
                <input type="radio" name="profile" value="accuracy" checked={generationProfile === 'accuracy'} onChange={() => setGenerationProfile('accuracy')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                 <span className="ml-3 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">Accuracy-focused</span>
                  <span className="block text-slate-500 dark:text-slate-400">Slower generation, best for complex schedules.</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="constraints" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Additional Constraints</label>
            <textarea
              id="constraints"
              value={additionalConstraints}
              onChange={(e) => setAdditionalConstraints(e.target.value)}
              rows={3}
              className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., No classes for S5-CS1 after 3 PM on Fridays."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                Cancel
            </button>
            <button onClick={handleGenerate} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Generate
            </button>
          </div>
        </div>
      </Modal>
    );

    if (!draftTimetable && !publishedTimetable) {
        return (
            <>
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md text-center">
                <i className="fa-solid fa-calendar-times text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Timetable Generated</h2>
                <p className="text-slate-500 dark:text-slate-400 my-2">Click the button below to generate a new timetable using AI.</p>
                <button onClick={handleOpenModal} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-lg mt-4">
                    <i className="fa-solid fa-robot mr-2"></i>Generate Timetable
                </button>
            </div>
            {renderGenerationModal()}
            </>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Timetable</h2>
                    {publishedTimetable ? 
                        <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-sm font-medium px-4 py-1 rounded-full">Published</span> :
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-sm font-medium px-4 py-1 rounded-full">Draft</span>
                    }
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {draftTimetable && (
                        <button onClick={handleSaveDraft} className="bg-slate-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors flex items-center">
                            <i className="fa-solid fa-save mr-2"></i>Save Draft
                        </button>
                    )}
                    <button onClick={handleOpenModal} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors flex items-center">
                       <i className="fa-solid fa-arrows-rotate mr-2"></i>Regenerate
                    </button>
                    {draftTimetable && (
                    <button onClick={() => setConfirmModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center">
                        <i className="fa-solid fa-paper-plane mr-2"></i>Publish
                    </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterId('all'); }} className={inputSelectClasses}>
                    <option value="group">Student Group</option>
                    <option value="faculty">Faculty</option>
                </select>
                <select value={filterId} onChange={e => setFilterId(e.target.value)} className={`${inputSelectClasses} flex-grow`}>
                    <option value="all">All</option>
                    {(filterType === 'group' ? studentGroups : faculty).map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                <button onClick={handleDownloadPdf} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    <i className="fas fa-download mr-2"></i>PDF
                </button>
            </div>
            
            {/* Grid */}
            <div className="overflow-x-auto">
                <div className="grid grid-cols-[auto_repeat(5,1fr)] text-center font-semibold text-slate-600 dark:text-slate-300">
                    <div className="p-2 border-r-2 border-b-2 border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50 dark:bg-slate-700 z-10"></div>
                    {DAYS.map(day => <div key={day} className="p-2 border-b-2 border-slate-200 dark:border-slate-700 min-w-[150px]">{day}</div>)}
                    
                    {TIME_SLOTS.map(time => (
                        <React.Fragment key={time}>
                            <div className="p-2 border-r-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs sticky left-0 bg-slate-50 dark:bg-slate-700 z-10">{time}</div>
                            {DAYS.map(day => {
                                const entries = filteredTimetable?.filter(e => e.day === day && e.time === time) || [];
                                return (
                                    <div key={`${day}-${time}`} className="border-t border-l border-slate-200 dark:border-slate-700 min-h-[100px] p-1 space-y-1">
                                        {entries.map((entry, i) => {
                                            const data = getEntryData(entry);
                                            return (
                                                <div key={i} className="bg-indigo-100 dark:bg-indigo-900/60 p-2 rounded text-left text-xs text-slate-800 dark:text-slate-200">
                                                    <p className="font-bold">{data.subject}</p>
                                                    <p>{data.faculty}</p>
                                                    <p className="font-semibold">{data.group} ({data.room})</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {renderGenerationModal()}
            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Publication">
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">Are you sure you want to publish this draft?</p>
                    <div className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/50 p-3 rounded-lg">
                        {publishedTimetable
                            ? 'This will replace the currently active timetable for all users.'
                            : 'This will make the timetable visible to all faculty and the principal.'
                        }
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                         <button onClick={() => setConfirmModalOpen(false)} className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConfirmPublish} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Confirm & Publish
                        </button>
                    </div>
                </div>
           </Modal>
        </div>
    );
};