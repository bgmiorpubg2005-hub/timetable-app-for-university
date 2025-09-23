import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { TIME_SLOTS, DAYS } from '../../context/constants';
import { TimetableEntry } from '../../context/types';

declare const jspdf: any;

export const MySchedule: React.FC = () => {
    const { state } = useContext(AppContext);
    const { publishedTimetable, currentUser, subjects, studentGroups, classrooms } = state;

    const mySchedule = useMemo(() => {
        if (!publishedTimetable || !currentUser) return [];
        return publishedTimetable.filter(entry => entry.facultyId === currentUser.id);
    }, [publishedTimetable, currentUser]);

    const getEntryData = (entry: TimetableEntry) => ({
        subject: subjects.find(s => s.id === entry.subjectId)?.name || '?',
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
                const entry = mySchedule.find(e => e.day === day && e.time === time);
                const cellText = entry ? `${getEntryData(entry).subject}\n${getEntryData(entry).group} (${getEntryData(entry).room})` : '';
                row.push(cellText);
            });
            tableBody.push(row);
        });

        doc.text(`My Schedule: ${currentUser?.name}`, 14, 15);
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 20,
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        });
        doc.save(`my_schedule_${currentUser?.name}.pdf`);
    };

    if (!publishedTimetable) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md text-center">
                <i className="fa-solid fa-clock text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Timetable Not Published</h2>
                <p className="text-slate-500 dark:text-slate-400 my-2">Your schedule will be available here once it's published by the administrator.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Schedule</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Displaying your personal classes from the official published timetable.</p>
                </div>
                <button onClick={handleDownloadPdf} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto">
                    <i className="fas fa-download mr-2"></i>Download PDF
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <div className="grid grid-cols-[auto_repeat(5,1fr)] text-center font-semibold text-slate-600 dark:text-slate-300">
                    <div className="p-2 border-r-2 border-b-2 border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50 dark:bg-slate-700 z-10"></div>
                    {DAYS.map(day => <div key={day} className="p-2 border-b-2 border-slate-200 dark:border-slate-700 min-w-[150px]">{day}</div>)}
                    
                    {TIME_SLOTS.map(time => (
                        <React.Fragment key={time}>
                            <div className="p-2 border-r-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs sticky left-0 bg-slate-50 dark:bg-slate-700 z-10">{time}</div>
                            {DAYS.map(day => {
                                const entry = mySchedule.find(e => e.day === day && e.time === time);
                                return (
                                    <div key={`${day}-${time}`} className="border-t border-l border-slate-200 dark:border-slate-700 min-h-[100px] p-1">
                                        {entry && (
                                            <div className="bg-green-100 dark:bg-green-900/60 p-2 rounded text-left text-xs h-full flex flex-col justify-center text-slate-800 dark:text-slate-200">
                                                <p className="font-bold">{getEntryData(entry).subject}</p>
                                                <p className="font-semibold">{getEntryData(entry).group}</p>
                                                <p>{getEntryData(entry).room}</p>
                                            </div>
                                        )}
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