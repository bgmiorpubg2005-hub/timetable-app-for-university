import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Classroom, Subject, StudentGroup } from '../../context/types';
import { Modal } from '../../components/common/Modal';

type DataType = 'classrooms' | 'subjects' | 'studentGroups';

export const CoreDataManagement: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<DataType>('classrooms');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('Are you sure you want to delete this item?')) {
          dispatch({ type: 'DELETE_ITEM', payload: { itemType: activeTab, id } });
          dispatch({ type: 'SHOW_TOAST', payload: { message: 'Item deleted successfully!', type: 'success' } });
      }
  }
  
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data: any = Object.fromEntries(formData.entries());
      
      if (data.capacity) data.capacity = Number(data.capacity);
      if (data.strength) data.strength = Number(data.strength);
      if (data.semester) data.semester = Number(data.semester);
      if (data.classesPerWeek) data.classesPerWeek = Number(data.classesPerWeek);
      
      data.labRequired = data.labRequired === 'on';

      if (editingItem) {
          dispatch({ type: 'UPDATE_ITEM', payload: { itemType: activeTab, data: { ...editingItem, ...data } } });
      } else {
          dispatch({ type: 'ADD_ITEM', payload: { itemType: activeTab, data: { ...data, id: `${activeTab}-${Date.now()}` } } });
      }
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Changes saved successfully!', type: 'success' } });
      handleCloseModal();
  }
  
  const filteredData = useMemo(() => {
    const data = state[activeTab];
    if (!searchTerm) return data;

    const lowercasedFilter = searchTerm.toLowerCase();

    return data.filter((item: any) => {
      switch (activeTab) {
        case 'classrooms':
          return (
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.location.toLowerCase().includes(lowercasedFilter) ||
            item.type.toLowerCase().includes(lowercasedFilter)
          );
        case 'subjects':
          return (
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.code.toLowerCase().includes(lowercasedFilter)
          );
        case 'studentGroups':
          return (
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.department.toLowerCase().includes(lowercasedFilter)
          );
        default:
          return true;
      }
    });
  }, [state, activeTab, searchTerm]);

  const renderFormFields = () => {
    const item = editingItem || {};
    const inputClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500";
    switch (activeTab) {
      case 'classrooms':
        return (
          <>
            <input type="text" name="name" defaultValue={item.name} placeholder="Classroom Name" required className={inputClass} />
            <input type="number" name="capacity" defaultValue={item.capacity} placeholder="Capacity" required className={inputClass} />
            <select name="type" defaultValue={item.type || 'Lecture Hall'} className={inputClass}>
                <option>Lecture Hall</option>
                <option>Smart Class</option>
                <option>Lab</option>
            </select>
            <input type="text" name="location" defaultValue={item.location} placeholder="Location" required className={inputClass} />
          </>
        );
      case 'subjects':
        return (
          <>
            <input type="text" name="name" defaultValue={item.name} placeholder="Subject Name" required className={inputClass} />
            <input type="text" name="code" defaultValue={item.code} placeholder="Subject Code" required className={inputClass} />
            <input type="number" name="classesPerWeek" defaultValue={item.classesPerWeek} placeholder="Classes per Week" required className={inputClass} />
            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><input type="checkbox" name="labRequired" defaultChecked={item.labRequired} /><span>Lab Required</span></label>
          </>
        );
      case 'studentGroups':
        return (
          <>
            <input type="text" name="name" defaultValue={item.name} placeholder="Group Name (e.g., S3-CS1)" required className={inputClass} />
            <input type="number" name="strength" defaultValue={item.strength} placeholder="Strength" required className={inputClass} />
            <input type="text" name="department" defaultValue={item.department} placeholder="Department (e.g., CS)" required className={inputClass} />
            <input type="number" name="semester" defaultValue={item.semester} placeholder="Semester" required className={inputClass} />
          </>
        );
      default:
        return null;
    }
  };

  const renderTable = () => {
    const data = filteredData;
    if (!data || data.length === 0) {
        return <p className="text-slate-500 dark:text-slate-400 text-center py-8">No data matches your search.</p>
    }
    const headers = Object.keys(data[0] || {}).filter(k => k !== 'id');
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                        {headers.map(h => <th key={h} className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 dark:text-slate-300">{h.replace(/([A-Z])/g, ' $1')}</th>)}
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                    {data.map((item: any) => (
                        <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                            {headers.map(h => <td key={`${item.id}-${h}`} className="py-3 px-4">{String(item[h])}</td>)}
                            <td className="py-3 px-4">
                                <button onClick={() => handleOpenModal(item)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  };

  const TABS: { id: DataType, name: string, icon: string }[] = [
      {id: 'classrooms', name: 'Classrooms', icon: 'fa-solid fa-school'},
      {id: 'subjects', name: 'Subjects', icon: 'fa-solid fa-book'},
      {id: 'studentGroups', name: 'Student Groups', icon: 'fa-solid fa-users'}
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Core Data Management</h1>
            <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center sm:w-auto w-full">
                <i className="fa-solid fa-plus mr-2"></i>Add New
            </button>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 text-sm whitespace-nowrap font-medium transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'}`}>
                        <i className={tab.icon}></i>{tab.name}
                    </button>
                ))}
            </nav>
        </div>
        
        <div className="mt-6 mb-4">
             <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${TABS.find(t => t.id === activeTab)?.name}...`}
                className="w-full max-w-md p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
        </div>

        <div>
            {renderTable()}
        </div>
        
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`${editingItem ? 'Edit' : 'Add'} ${TABS.find(t=>t.id === activeTab)?.name}`}>
            <form onSubmit={handleSave} className="space-y-4">
                {renderFormFields()}
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">Save</button>
                </div>
            </form>
        </Modal>
    </div>
  );
};