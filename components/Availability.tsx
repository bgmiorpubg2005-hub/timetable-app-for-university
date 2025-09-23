import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { TIME_SLOTS, DAYS, FACULTY_DATA } from '../constants';

interface AvailabilityProps {
    faculty: User;
}

export const Availability: React.FC<AvailabilityProps> = ({ faculty }) => {
    const facultyMemberData = useMemo(() => FACULTY_DATA.find(f => f.name === faculty.name), [faculty.name]);
    
    const [availability, setAvailability] = useState(facultyMemberData?.availability || {});
    const [saved, setSaved] = useState(false);

    const toggleAvailability = (day: string, time: string) => {
        setSaved(false);
        setAvailability(prev => {
            const daySlots = prev[day] || [];
            const newSlots = daySlots.includes(time)
                ? daySlots.filter(slot => slot !== time)
                : [...daySlots, time];
            return { ...prev, [day]: newSlots };
        });
    };

    const handleSaveChanges = () => {
        // In a real app, this would be an API call
        console.log("Saving availability:", availability);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!facultyMemberData) {
        return <div>Faculty member not found.</div>
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">My Availability</h2>
                <button 
                    onClick={handleSaveChanges}
                    className={`font-bold py-2 px-4 rounded-lg transition-colors flex items-center ${
                        saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    {saved ? <><i className="fa-solid fa-check mr-2"></i> Saved!</> : <><i className="fa-solid fa-save mr-2"></i>Save Changes</>}
                </button>
            </div>
            <p className="text-slate-600 mb-6">Select the time slots you are available to teach. Changes are not saved until you click the "Save Changes" button.</p>

            <div className="grid grid-cols-6 text-center text-sm font-medium text-slate-600">
                <div className="p-2"></div> {/* Empty corner */}
                {DAYS.map(day => <div key={day} className="p-2 border-b-2 border-slate-200">{day}</div>)}
                
                {TIME_SLOTS.map(time => (
                    <React.Fragment key={time}>
                        <div className="p-2 border-r-2 border-slate-200 flex items-center justify-center text-xs">{time}</div>
                        {DAYS.map(day => {
                            const isAvailable = availability[day]?.includes(time);
                            return (
                                <div key={`${day}-${time}`} className="border-t border-l border-slate-200 p-1">
                                    <button 
                                        onClick={() => toggleAvailability(day, time)}
                                        className={`w-full h-12 rounded-md transition-colors ${
                                            isAvailable ? 'bg-green-400 hover:bg-green-500' : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
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
    );
};