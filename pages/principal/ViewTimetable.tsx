import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { TimetableEntry } from '../../context/types';
import { DAYS, TIME_SLOTS } from '../../context/constants';

declare const jspdf: any;

export const ViewTimetable: React.FC = () => {
    const { state } = useContext(AppContext);
    const { publishedTimetable, subjects, faculty, studentGroups, classrooms } = state;
    const [filterType, setFilterType] = useState('group');
    const [filterId, setFilterId] = useState('all');

    if (!publishedTimetable) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md text-center">
                <i className="fa-solid fa-clock text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Timetable Not Published</h2>
                <p className="text-slate-500 dark:text-slate-400 my-2">The master schedule will be available here once published by the administrator.</p>
            </div>
        );
    }

    const filteredTimetable = useMemo(() => {
        if (filterId === 'all') return publishedTimetable;
        if (filterType === 'group') {
            return publishedTimetable.filter(entry => entry.groupId === filterId);
        }
        if (filterType === 'faculty') {
            return publishedTimetable.filter(entry => entry.facultyId === filterId);
        }
        return publishedTimetable;
    }, [publishedTimetable, filterType, filterId]);

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


    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">View Published Timetable</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This is the official master schedule for all departments and faculty.</p>
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
                    <i className="fas fa-download mr-2"></i>Download PDF
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
        </div>
    );
};