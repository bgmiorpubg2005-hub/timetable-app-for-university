// FIX: Add useContext to hook into the application's context.
import React, { useState, useMemo, useContext } from 'react';
import { Role, TimetableEntry } from '../types';
import { TIME_SLOTS, DAYS, INITIAL_TIMETABLE, SEMESTERS, DEPARTMENTS, BATCHES, FACULTY_DATA } from '../constants';
// FIX: Removed import for non-existent resolveConflictWithGemini
import { generateTimetableWithGemini } from '../services/geminiService';
import { Modal } from './Modal';
// FIX: Import AppContext to access global state like subjects, faculty, etc.
import { AppContext } from '../context/AppContext';

const TimetableCell: React.FC<{ entries: TimetableEntry[]; onConflictClick: (entry: TimetableEntry) => void }> = ({ entries, onConflictClick }) => {
    if (entries.length === 0) return <div className="border-t border-l border-slate-200 min-h-[80px]"></div>;

    // In case of multiple entries in the same slot (e.g., faculty view), stack them.
    return (
        <div className="border-t border-l border-slate-200 space-y-1 p-1 overflow-y-auto">
            {entries.map(entry => {
                const conflictClasses = entry.isConflict ? 'animate-pulse border-red-500 ring-2 ring-red-500' : 'border-slate-200';
                return (
                    <div key={entry.id} className={`p-2 ${conflictClasses} ${entry.color} rounded-md text-slate-800 flex flex-col justify-between text-left`}>
                        <div>
                            <p className="font-bold text-sm">{entry.subject}</p>
                            <p className="text-xs">{entry.faculty}</p>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                             <p className="text-xs font-medium">{entry.room}</p>
                             <p className="text-xs font-semibold">{`S${entry.semester}-${entry.batch}`}</p>
                            {entry.isConflict && (
                                <button onClick={() => onConflictClick(entry)} className="text-red-600 hover:text-red-800">
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const FilterControl: React.FC<{ label: string; value: string; options: {value: string; label: string}[]; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; }> = ({ label, value, options, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600">{label}</label>
        <select value={value} onChange={onChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="all">All</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);


export const TimetableGrid: React.FC<{ currentUserRole: Role }> = ({ currentUserRole }) => {
    // FIX: Get state from AppContext to be used in AI service calls and data mapping.
    const { state } = useContext(AppContext);
    const [timetable, setTimetable] = useState<TimetableEntry[]>(INITIAL_TIMETABLE);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerationModalOpen, setGenerationModalOpen] = useState(false);
    const [isConflictModalOpen, setConflictModalOpen] = useState(false);
    // FIX: Added state for generation profile to pass to the AI service.
    const [generationProfile, setGenerationProfile] = useState<'balanced' | 'speed' | 'accuracy'>('balanced');
    const [constraints, setConstraints] = useState("- Max 1 lab session per day for any batch.\n- Prof. Ellis is unavailable on Fridays.\n- All CS classes must be in a Lab or Smart Class.");
    const [selectedConflict, setSelectedConflict] = useState<TimetableEntry | null>(null);
    const [conflictResolution, setConflictResolution] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({ semester: 'all', department: 'all', batch: 'all', faculty: 'all' });

    const handleFilterChange = (filterName: keyof typeof filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setFilters(prev => ({
            ...prev,
            // If faculty is selected, reset others. If other is selected, reset faculty.
            ...(filterName === 'faculty' && value !== 'all' ? { semester: 'all', department: 'all', batch: 'all', faculty: value } : {}),
            ...(filterName !== 'faculty' && value !== 'all' ? { ...prev, faculty: 'all', [filterName]: value } : {}),
            ...(value === 'all' ? { ...prev, [filterName]: 'all' } : {})
        }));
    };
    
    const filteredTimetable = useMemo(() => {
        return timetable.filter(entry => {
            if (filters.faculty !== 'all') {
                return entry.faculty === filters.faculty;
            }
            const semesterMatch = filters.semester === 'all' || entry.semester === parseInt(filters.semester, 10);
            const departmentMatch = filters.department === 'all' || entry.department === filters.department;
            const batchMatch = filters.batch === 'all' || entry.batch === filters.batch;
            return semesterMatch && departmentMatch && batchMatch;
        });
    }, [timetable, filters]);

    // FIX: Update handleGenerate to use the new service signature and map results to the component's state type.
    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            // FIX: Pass all three required arguments to the service function.
            const result = await generateTimetableWithGemini(state, generationProfile, constraints);
            const colors = ['bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200'];
            
            const newTimetableEntries: TimetableEntry[] = result.map((item, index) => {
                const subject = state.subjects.find(s => s.id === item.subjectId);
                const faculty = state.faculty.find(f => f.id === item.facultyId);
                const room = state.classrooms.find(c => c.id === item.roomId);
                const group = state.studentGroups.find(g => g.id === item.groupId);
                
                // Heuristic to get batch from group name like 'S3-CS1' -> 'CS1'
                const batchName = group?.name.substring(group.name.indexOf('-') + 1) || 'B?';

                return {
                    id: `${Date.now()}-${index}`,
                    day: item.day,
                    time: item.time,
                    subject: subject?.name || 'Unknown Subject',
                    faculty: faculty?.name || 'Unknown Faculty',
                    room: room?.name || 'Unknown Room',
                    batch: batchName,
                    semester: group?.semester || 0,
                    department: group?.department || 'Unknown Dept',
                    color: colors[index % colors.length],
                };
            });
            
            setTimetable(newTimetableEntries);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsGenerating(false);
            setGenerationModalOpen(false);
        }
    };
    
    const handleConflictClick = async (entry: TimetableEntry) => {
        setSelectedConflict(entry);
        setConflictModalOpen(true);
        // FIX: The resolveConflictWithGemini function doesn't exist in the service.
        // Provide a placeholder message until the feature is implemented.
        setConflictResolution('AI-powered conflict resolution is a planned feature. For now, please manually adjust the schedule.');
        // const resolution = await resolveConflictWithGemini(entry);
        // setConflictResolution(resolution);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Weekly Timetable</h2>
                {currentUserRole === Role.ADMIN && (
                    <button onClick={() => setGenerationModalOpen(true)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                        <i className="fa-solid fa-robot mr-2"></i>Generate with AI
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-slate-50">
                <FilterControl label="Semester" value={filters.semester} onChange={handleFilterChange('semester')} options={SEMESTERS.map(s => ({ value: String(s), label: `Semester ${s}` }))} />
                <FilterControl label="Department" value={filters.department} onChange={handleFilterChange('department')} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                <FilterControl label="Batch" value={filters.batch} onChange={handleFilterChange('batch')} options={BATCHES.map(b => ({ value: b, label: b }))} />
                <FilterControl label="Faculty (Merged View)" value={filters.faculty} onChange={handleFilterChange('faculty')} options={FACULTY_DATA.map(f => ({ value: f.name, label: f.name }))} />
            </div>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

            <div className="grid grid-cols-[auto_repeat(5,1fr)] grid-rows-[auto_repeat(6,minmax(0,1fr))] text-center font-semibold text-slate-600">
                <div className="p-2 border-r-2 border-b-2 border-slate-300"></div>
                {DAYS.map(day => <div key={day} className="p-2 border-b-2 border-slate-300">{day}</div>)}
                
                {TIME_SLOTS.map(time => (
                    <React.Fragment key={time}>
                        <div className="p-2 border-r-2 border-slate-300 flex items-center justify-center text-xs">{time}</div>
                        {DAYS.map(day => {
                            const entries = filteredTimetable.filter(e => e.day === day && e.time === time);
                            return <TimetableCell key={`${day}-${time}`} entries={entries} onConflictClick={handleConflictClick} />;
                        })}
                    </React.Fragment>
                ))}
            </div>

            <Modal isOpen={isGenerationModalOpen} onClose={() => setGenerationModalOpen(false)} title="Generate Timetable with AI">
                 <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Generation Profile</label>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 rounded-lg bg-slate-50 border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                                <input type="radio" name="profile" value="speed" checked={generationProfile === 'speed'} onChange={() => setGenerationProfile('speed')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                <span className="ml-3 text-sm">
                                <span className="font-medium text-slate-800">Speed-focused</span>
                                <span className="block text-slate-500">Fastest generation, good quality.</span>
                                </span>
                            </label>
                            <label className="flex items-center p-3 rounded-lg bg-slate-50 border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                                <input type="radio" name="profile" value="balanced" checked={generationProfile === 'balanced'} onChange={() => setGenerationProfile('balanced')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                <span className="ml-3 text-sm">
                                <span className="font-medium text-slate-800">Balanced (Recommended)</span>
                                <span className="block text-slate-500">Good balance of speed and accuracy.</span>
                                </span>
                            </label>
                            <label className="flex items-center p-3 rounded-lg bg-slate-50 border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500">
                                <input type="radio" name="profile" value="accuracy" checked={generationProfile === 'accuracy'} onChange={() => setGenerationProfile('accuracy')} className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                <span className="ml-3 text-sm">
                                <span className="font-medium text-slate-800">Accuracy-focused</span>
                                <span className="block text-slate-500">Slower generation, best for complex schedules.</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="constraints" className="block text-sm font-bold text-slate-700">Additional Constraints</label>
                        <textarea
                            id="constraints"
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            rows={5}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="e.g., No classes for S5-CS1 after 3 PM on Fridays."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isConflictModalOpen} onClose={() => setConflictModalOpen(false)} title="Resolve Scheduling Conflict">
                {selectedConflict && (
                     <div>
                        <p className="font-semibold text-slate-800 mb-2">Conflict Details:</p>
                        <p className="text-slate-600 mb-4">{`Professor ${selectedConflict.faculty} is double-booked on ${selectedConflict.day} at ${selectedConflict.time}.`}</p>
                        <p className="font-semibold text-slate-800 mb-2">AI-Powered Suggestions:</p>
                        <div className="bg-slate-100 p-4 rounded-md whitespace-pre-wrap text-slate-700">
                            {conflictResolution}
                        </div>
                     </div>
                )}
            </Modal>

        </div>
    );
};
