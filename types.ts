export enum Role {
  ADMIN = 'Administrator',
  FACULTY = 'Faculty',
  PRINCIPAL = 'Principal',
}

export type View = 'Dashboard' | 'Timetable' | 'Faculty' | 'Subjects' | 'Classrooms' | 'Settings' | 'Availability' | 'Leave Requests';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  batch: string;
  semester: number;
  department: string;
  color: string;
  isConflict?: boolean;
}

export interface FacultyMember {
  id:string;
  name: string;
  subject: string;
  availability: { [day: string]: string[] };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classesPerWeek: number;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: 'Lab' | 'Lecture Hall' | 'Smart Class';
}

export interface LeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export type DataItem = FacultyMember | Subject | Classroom;