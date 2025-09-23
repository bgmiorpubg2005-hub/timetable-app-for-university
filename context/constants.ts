import { Role, User, Classroom, Subject, StudentGroup, Faculty, LeaveRequest, SwapRequest, Notification } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Dr. Evelyn Reed', email: 'admin@intellischedule.ai', role: Role.ADMIN },
  { id: 'u2', name: 'Prof. Alan Grant', email: 'faculty@intellischedule.ai', role: Role.FACULTY },
  { id: 'u3', name: 'Director Hammond', email: 'principal@intellischedule.ai', role: Role.PRINCIPAL },
  { id: 'u4', name: 'Prof. Ian Malcolm', email: 'faculty2@intellischedule.ai', role: Role.FACULTY },
];

export const CLASSROOMS: Classroom[] = [
  { id: 'c1', name: 'C101', capacity: 60, type: 'Lecture Hall', location: 'Block A' },
  { id: 'c2', name: 'C203', capacity: 50, type: 'Smart Class', location: 'Block B' },
  { id: 'c3', name: 'Lab 1 (CS)', capacity: 40, type: 'Lab', location: 'Block C' },
  { id: 'c4', name: 'Lab 2 (EC)', capacity: 40, type: 'Lab', location: 'Block C' },
];

export const SUBJECTS: Subject[] = [
  { id: 's1', name: 'Quantum Physics', code: 'PHY301', classesPerWeek: 4, labRequired: false },
  { id: 's2', name: 'Data Structures', code: 'CS201', classesPerWeek: 5, labRequired: true },
  { id: 's3', name: 'Organic Chemistry', code: 'CHM210', classesPerWeek: 3, labRequired: true },
  { id: 's4', name: 'AI Ethics', code: 'PHI400', classesPerWeek: 2, labRequired: false },
  { id: 's5', name: 'Microprocessors', code: 'EC202', classesPerWeek: 4, labRequired: true },
];

export const STUDENT_GROUPS: StudentGroup[] = [
  { id: 'g1', name: 'S3-CS1', strength: 55, department: 'CS', semester: 3 },
  { id: 'g2', name: 'S5-CS1', strength: 50, department: 'CS', semester: 5 },
  { id: 'g3', name: 'S3-EC1', strength: 45, department: 'EC', semester: 3 },
];

export const TIME_SLOTS = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00', '15:00 - 16:00'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const FACULTY_DATA: Faculty[] = [
  { 
    id: 'u2', 
    name: 'Prof. Alan Grant', 
    email: 'faculty@intellischedule.ai', 
    expertise: ['s2', 's4'], 
    assignments: [
      { subjectId: 's2', groupId: 'g1' },
      { subjectId: 's4', groupId: 'g2' },
    ],
    availability: {
      Monday: TIME_SLOTS,
      Tuesday: TIME_SLOTS,
      Wednesday: TIME_SLOTS,
      Thursday: TIME_SLOTS,
      Friday: TIME_SLOTS,
    }
  },
  { 
    id: 'u4', 
    name: 'Prof. Ian Malcolm', 
    email: 'faculty2@intellischedule.ai',
    expertise: ['s1', 's5'],
    assignments: [
      { subjectId: 's1', groupId: 'g2' },
      { subjectId: 's5', groupId: 'g3' },
    ],
    availability: {
      Monday: TIME_SLOTS,
      Tuesday: [],
      Wednesday: TIME_SLOTS,
      Thursday: [],
      Friday: TIME_SLOTS.slice(0, 3),
    }
  },
];

export const LEAVE_REQUESTS_DATA: LeaveRequest[] = [
    { id: 'lr1', facultyId: 'u2', startDate: '2024-10-10', endDate: '2024-10-11', reason: 'Conference', status: 'Approved', leaveType: 'multi-day' },
    { id: 'lr2', facultyId: 'u4', startDate: '2024-11-05', endDate: '2024-11-05', reason: 'Personal', status: 'Pending', leaveType: 'full-day' },
];

export const SWAP_REQUESTS_DATA: SwapRequest[] = [];

export const NOTIFICATIONS_DATA: Notification[] = [];
