import { Role, User, TimetableEntry, FacultyMember, Subject, Classroom, View, LeaveRequest } from './types';

export const ROLES: Role[] = [Role.ADMIN, Role.FACULTY, Role.PRINCIPAL];

export const USERS: User[] = [
  { id: 'U1', name: 'Dr. Evelyn Reed', role: Role.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 'U2', name: 'Prof. Alan Grant', role: Role.FACULTY, avatar: 'https://i.pravatar.cc/150?u=faculty' },
  { id: 'U3', name: 'Director Hammond', role: Role.PRINCIPAL, avatar: 'https://i.pravatar.cc/150?u=principal' },
];

export const TIME_SLOTS = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00', '15:00 - 16:00'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
export const DEPARTMENTS = ['CS', 'EC', 'IT', 'MECH'];
export const BATCHES = ['B1', 'B2', 'B3', 'B4'];


export const INITIAL_TIMETABLE: TimetableEntry[] = [
  { id: '1', day: 'Monday', time: '09:00 - 10:00', subject: 'Quantum Physics', faculty: 'Dr. Aris', room: 'C101', batch: 'B1', semester: 3, department: 'CS', color: 'bg-blue-200' },
  { id: '2', day: 'Monday', time: '10:00 - 11:00', subject: 'Data Structures', faculty: 'Prof. Ellis', room: 'Lab 1', batch: 'B2', semester: 3, department: 'CS', color: 'bg-green-200' },
  { id: '3', day: 'Tuesday', time: '11:00 - 12:00', subject: 'Org. Chemistry', faculty: 'Dr. Ian', room: 'C203', batch: 'B1', semester: 1, department: 'IT', color: 'bg-yellow-200' },
  { id: '4', day: 'Wednesday', time: '14:00 - 15:00', subject: 'Adv. Algorithms', faculty: 'Prof. Ellis', room: 'Lab 2', batch: 'B2', semester: 5, department: 'CS', color: 'bg-green-200' },
  { id: '5', day: 'Thursday', time: '09:00 - 10:00', subject: 'Thermodynamics', faculty: 'Dr. Aris', room: 'C101', batch: 'B1', semester: 3, department: 'MECH', color: 'bg-blue-200' },
  { id: '6', day: 'Friday', time: '15:00 - 16:00', subject: 'AI Ethics', faculty: 'Dr. Ian', room: 'C203', batch: 'B2', semester: 7, department: 'CS', color: 'bg-yellow-200' },
  { id: '7', day: 'Tuesday', time: '09:00 - 10:00', subject: 'Compiler Design', faculty: 'Prof. Smith', room: 'C102', batch: 'B3', semester: 5, department: 'CS', color: 'bg-purple-200' },
  { id: '8', day: 'Tuesday', time: '09:00 - 10:00', subject: 'Microbiology', faculty: 'Prof. Smith', room: 'Lab 3', batch: 'B4', semester: 3, department: 'EC', color: 'bg-red-300', isConflict: true },
];

export const FACULTY_DATA: FacultyMember[] = [
  { id: 'F1', name: 'Dr. Aris', subject: 'Physics', availability: { Monday: TIME_SLOTS, Tuesday: TIME_SLOTS, Wednesday: [], Thursday: TIME_SLOTS, Friday: [] } },
  { id: 'F2', name: 'Prof. Ellis', subject: 'Computer Science', availability: { Monday: TIME_SLOTS, Tuesday: [], Wednesday: TIME_SLOTS, Thursday: [], Friday: TIME_SLOTS.slice(0, 4) } },
  { id: 'F3', name: 'Dr. Ian', subject: 'Chemistry', availability: { Monday: TIME_SLOTS, Tuesday: TIME_SLOTS, Wednesday: TIME_SLOTS, Thursday: TIME_SLOTS, Friday: TIME_SLOTS } },
  { id: 'F4', name: 'Prof. Smith', subject: 'Biology', availability: { Monday: [], Tuesday: TIME_SLOTS, Wednesday: [], Thursday: TIME_SLOTS, Friday: [] } },
];

export const SUBJECT_DATA: Subject[] = [
  { id: 'S1', name: 'Quantum Physics', code: 'PHY301', classesPerWeek: 4 },
  { id: 'S2', name: 'Data Structures', code: 'CS201', classesPerWeek: 5 },
  { id: 'S3', name: 'Org. Chemistry', code: 'CHM210', classesPerWeek: 3 },
  { id: 'S4', name: 'AI Ethics', code: 'PHI400', classesPerWeek: 2 },
];

export const CLASSROOM_DATA: Classroom[] = [
  { id: 'C1', name: 'C101', capacity: 60, type: 'Lecture Hall' },
  { id: 'C2', name: 'C203', capacity: 50, type: 'Lecture Hall' },
  { id: 'C3', name: 'Lab 1', capacity: 30, type: 'Lab' },
  { id: 'C4', name: 'Smart Class A', capacity: 45, type: 'Smart Class' },
];

export const LEAVE_REQUESTS_DATA: LeaveRequest[] = [
    { id: 'L1', facultyId: 'F2', facultyName: 'Prof. Ellis', startDate: '2024-08-05', endDate: '2024-08-07', reason: 'Attending conference', status: 'Approved' },
    { id: 'L2', facultyId: 'F4', facultyName: 'Prof. Smith', startDate: '2024-09-10', endDate: '2024-09-10', reason: 'Personal leave', status: 'Pending' },
    { id: 'L3', facultyId: 'F2', facultyName: 'Prof. Ellis', startDate: '2024-09-15', endDate: '2024-09-20', reason: 'Medical leave', status: 'Rejected' },
];


export const NAV_ITEMS: { view: View; icon: string; roles: Role[] }[] = [
    { view: 'Dashboard', icon: 'fa-solid fa-chart-pie', roles: [Role.ADMIN, Role.FACULTY, Role.PRINCIPAL] },
    { view: 'Timetable', icon: 'fa-solid fa-calendar-days', roles: [Role.ADMIN, Role.FACULTY, Role.PRINCIPAL] },
    { view: 'Availability', icon: 'fa-solid fa-user-clock', roles: [Role.FACULTY] },
    { view: 'Leave Requests', icon: 'fa-solid fa-plane-departure', roles: [Role.FACULTY, Role.ADMIN] },
    { view: 'Faculty', icon: 'fa-solid fa-chalkboard-user', roles: [Role.ADMIN] },
    { view: 'Subjects', icon: 'fa-solid fa-book', roles: [Role.ADMIN] },
    { view: 'Classrooms', icon: 'fa-solid fa-school', roles: [Role.ADMIN] },
];