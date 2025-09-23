import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Action, Notification } from './types';
import { USERS, CLASSROOMS, SUBJECTS, STUDENT_GROUPS, FACULTY_DATA, LEAVE_REQUESTS_DATA, SWAP_REQUESTS_DATA, NOTIFICATIONS_DATA } from './constants';

const initialState: AppState = {
  isAuthenticated: false,
  currentUser: null,
  activeView: 'Dashboard',
  isSidebarOpen: window.innerWidth > 768,
  theme: 'light',
  toast: null,
  users: USERS,
  classrooms: CLASSROOMS,
  subjects: SUBJECTS,
  studentGroups: STUDENT_GROUPS,
  faculty: FACULTY_DATA,
  draftTimetable: null,
  publishedTimetable: null,
  isGenerating: false,
  leaveRequests: LEAVE_REQUESTS_DATA,
  swapRequests: SWAP_REQUESTS_DATA,
  notifications: NOTIFICATIONS_DATA,
};

// --- DATABASE SIMULATION: READ ---
// This function acts as our "database read" on application startup.
// It attempts to load the entire application state from the browser's localStorage.
// If state is found, it's used; otherwise, the default initial state is loaded.
const getInitialState = (): AppState => {
  try {
    const storedState = localStorage.getItem('intelliScheduleState');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // Ensure transient state is reset on load for a clean start
      parsedState.isSidebarOpen = window.innerWidth > 768;
      parsedState.isGenerating = false;
      parsedState.toast = null;
      if (!parsedState.theme) {
        parsedState.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (!parsedState.notifications) {
        parsedState.notifications = [];
      }
      return parsedState;
    }
  } catch (error) {
    console.error("Could not parse stored state from 'database' (localStorage):", error);
  }
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return { ...initialState, theme: systemTheme };
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, currentUser: action.payload, activeView: 'Dashboard' };
    case 'LOGOUT':
      // Clear session, but persist all data (timetables, faculty, etc.)
      return {
        ...state,
        isAuthenticated: false,
        currentUser: null,
      };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, isSidebarOpen: window.innerWidth > 768 ? state.isSidebarOpen : false };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'ADD_ITEM':
        return { ...state, [action.payload.itemType]: [...state[action.payload.itemType], action.payload.data] };
    case 'UPDATE_ITEM':
        return { ...state, [action.payload.itemType]: state[action.payload.itemType].map(item => item.id === action.payload.data.id ? action.payload.data : item) };
    case 'DELETE_ITEM':
        return { ...state, [action.payload.itemType]: state[action.payload.itemType].filter(item => item.id !== action.payload.id) };
    case 'SET_GENERATING':
        return { ...state, isGenerating: action.payload };
    case 'SET_DRAFT_TIMETABLE':
        return { ...state, draftTimetable: action.payload, isGenerating: false };
    case 'PUBLISH_TIMETABLE':
        return { ...state, publishedTimetable: state.draftTimetable, draftTimetable: null };
    case 'ADD_REQUEST':
        return { ...state, [action.payload.requestType]: [action.payload.data, ...state[action.payload.requestType]] };
    case 'UPDATE_PUBLISHED_TIMETABLE':
        return { ...state, publishedTimetable: action.payload };
    case 'SHOW_TOAST':
        return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
        return { ...state, toast: null };
    case 'ADD_NOTIFICATION': {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            userId: action.payload.userId,
            message: action.payload.message,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        return { ...state, notifications: [newNotification, ...state.notifications] };
    }
    case 'MARK_NOTIFICATIONS_READ': {
        return {
            ...state,
            notifications: state.notifications.map(n => 
                n.userId === action.payload.userId ? { ...n, isRead: true } : n
            ),
        };
    }
    default:
      return state;
  }
};

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: getInitialState(),
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  // --- DATABASE SIMULATION: WRITE ---
  // Create a stable, stringified version of the state that should be persisted.
  // We exclude transient state like toasts or loading indicators to prevent infinite loops
  // when showing an error toast if saving fails.
  const persistentStateJSON = JSON.stringify({ ...state, toast: null, isGenerating: false });

  // This effect acts as our "database write" on every state change.
  // It automatically saves the entire application state to localStorage whenever
  // a change is made (e.g., adding, editing, deleting data).
  // This ensures data persistence across browser sessions.
  useEffect(() => {
    try {
      localStorage.setItem('intelliScheduleState', persistentStateJSON);
    } catch (error) {
      console.error("Could not save state to 'database' (localStorage):", error);
      // Dispatch a toast notification to inform the user about the save error.
      // This is safe from infinite loops because the effect depends on `persistentStateJSON`,
      // which excludes the `toast` property itself.
      dispatch({ 
          type: 'SHOW_TOAST', 
          payload: { message: 'Error: Could not save recent changes. Storage might be full.', type: 'error' } 
      });
    }
  }, [persistentStateJSON, dispatch]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
