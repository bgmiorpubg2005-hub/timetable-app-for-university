export enum Role {
  ADMIN = 'Administrator',
  FACULTY = 'Faculty',
  PRINCIPAL = 'Principal',
}

export type View = 
  | 'Dashboard'
  // Admin
  | 'Core Data Management'
  | 'Faculty Management'
  | 'Timetable'
  // Faculty
  | 'My Schedule'
  | 'Availability & Requests'
  // Principal
  | 'View Timetable'
  | 'Approvals';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: 'Lab' | 'Smart Class' | 'Lecture Hall';
  location: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classesPerWeek: number;
  labRequired: boolean;
}

export interface StudentGroup {
  id: string;
  name: string;
  strength: number;
  department: string;
  semester: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  expertise: string[]; // array of subject IDs
  assignments: { subjectId: string; groupId: string }[];
  availability: { [day: string]: string[] };
}

export interface TimetableEntry {
  day: string; // e.g., 'Monday'
  time: string; // e.g., '09:00 - 10:00'
  groupId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
}

export interface Request {
  id: string;
  facultyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface LeaveRequest extends Request {
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'full-day' | 'multi-day' | 'half-day';
  halfDaySession?: 'first-half' | 'second-half';
}

export interface SwapRequest extends Request {
  myClass: TimetableEntry;
  theirClass: TimetableEntry;
  theirFacultyId: string;
  reason: string;
}

export interface ToastPayload {
    message: string;
    type: 'success' | 'error';
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string
}

// App State
export interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  activeView: View;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  toast: ToastPayload | null;
  
  // Data
  users: User[];
  classrooms: Classroom[];
  subjects: Subject[];
  studentGroups: StudentGroup[];
  faculty: Faculty[];
  
  // Timetable
  draftTimetable: TimetableEntry[] | null;
  publishedTimetable: TimetableEntry[] | null;
  isGenerating: boolean;

  // Requests
  leaveRequests: LeaveRequest[];
  swapRequests: SwapRequest[];

  // Notifications
  notifications: Notification[];
}


// Reducer Actions
export type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_ACTIVE_VIEW'; payload: View }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_ITEM'; payload: { itemType: 'classrooms' | 'subjects' | 'studentGroups' | 'faculty' | 'users'; data: any } }
  | { type: 'UPDATE_ITEM'; payload: { itemType: 'classrooms' | 'subjects' | 'studentGroups' | 'faculty' | 'leaveRequests' | 'swapRequests' | 'users'; data: any } }
  | { type: 'DELETE_ITEM'; payload: { itemType: 'classrooms' | 'subjects' | 'studentGroups' | 'faculty' | 'users'; id: string } }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_DRAFT_TIMETABLE'; payload: TimetableEntry[] }
  | { type: 'PUBLISH_TIMETABLE' }
  | { type: 'ADD_REQUEST'; payload: { requestType: 'leaveRequests' | 'swapRequests'; data: any } }
  | { type: 'UPDATE_PUBLISHED_TIMETABLE'; payload: TimetableEntry[] }
  | { type: 'SHOW_TOAST'; payload: ToastPayload }
  | { type: 'HIDE_TOAST' }
  | { type: 'ADD_NOTIFICATION'; payload: { userId: string; message: string; } }
  | { type: 'MARK_NOTIFICATIONS_READ'; payload: { userId: string } };
