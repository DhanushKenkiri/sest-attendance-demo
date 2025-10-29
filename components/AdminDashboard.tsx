import React, { useState } from 'react';
import { Student, Timetable } from '../types';
import Card from './Card';
import Spinner from './Spinner';
import StudentList from './StudentList';
import AttendanceLog from './AttendanceLog';

interface AdminDashboardProps {
    students: Student[];
    timetable: Timetable;
    onAddStudent: (studentId: string, files: FileList) => Promise<boolean>;
    onDeleteStudent: (studentId: string) => void;
    onTimetableUpload: (file: File) => void;
    isLoading: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ students, timetable, onAddStudent, onDeleteStudent, onTimetableUpload, isLoading }) => {
    const [newStudentId, setNewStudentId] = useState('');
    const [newStudentFiles, setNewStudentFiles] = useState<FileList | null>(null);
    const [timetableFile, setTimetableFile] = useState<File | null>(null);

    const handleAddStudentClick = async () => {
        if (newStudentFiles) {
            const success = await onAddStudent(newStudentId, newStudentFiles);
            if (success) {
                setNewStudentId('');
                setNewStudentFiles(null);
                const input = document.getElementById('student-images-input') as HTMLInputElement;
                if(input) input.value = '';
            }
        }
    };

    const handleTimetableUploadClick = () => {
        if (timetableFile) {
            onTimetableUpload(timetableFile);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-cyan-300">Admin Dashboard</h2>
                <p className="text-slate-400">Manage student data, timetables, and view attendance records.</p>
            </div>

            <Card title="Enroll New Student">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="md:col-span-1">
                         <label htmlFor="student-id" className="block text-sm font-medium text-slate-300 mb-1">Student ID</label>
                        <input
                            id="student-id"
                            type="text"
                            placeholder="e.g., 24etim16"
                            value={newStudentId}
                            onChange={(e) => setNewStudentId(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        />
                    </div>
                     <div className="md:col-span-1">
                        <label htmlFor="student-images-input" className="block text-sm font-medium text-slate-300 mb-1">Upload Student Images (3+ recommended)</label>
                        <input id="student-images-input" type="file" multiple accept="image/*"
                            onChange={(e) => e.target.files && setNewStudentFiles(e.target.files)}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-900 hover:file:bg-cyan-600"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button onClick={handleAddStudentClick} disabled={isLoading || !newStudentId || !newStudentFiles} className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                            {isLoading ? <><Spinner /> Adding...</> : (
                                <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                Add Student</>
                            )}
                        </button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                     <Card title="Student Database">
                        <StudentList students={students} onDelete={onDeleteStudent} />
                    </Card>
                </div>
                <div className="space-y-8 lg:col-span-1">
                    <Card title="Timetable Management">
                        <p className="text-sm text-slate-400 mb-2">Upload the class schedule in .csv format.</p>
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <label htmlFor="timetable-input" className="block text-sm font-medium text-slate-300 mb-1">Select Timetable CSV</label>
                                <input id="timetable-input" type="file" accept=".csv"
                                    onChange={(e) => e.target.files && setTimetableFile(e.target.files[0])}
                                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-900 hover:file:bg-cyan-600"
                                />
                            </div>
                            <button onClick={handleTimetableUploadClick} disabled={isLoading || !timetableFile} className="flex-shrink-0 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                                {isLoading ? <Spinner /> : 'Upload'}
                            </button>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-300 mt-6 mb-2">Current Schedule</h3>
                        {Object.keys(timetable).length > 0 ? (
                            <div className="overflow-x-auto text-xs max-h-60 border border-slate-700 rounded-md">
                               <table className="w-full text-left">
                                   <tbody>
                                       {Object.entries(timetable).map(([day, schedule]) => (
                                           <tr key={day} className="border-b border-slate-700 last:border-b-0">
                                               <td className="p-2 font-semibold align-top bg-slate-700/30 w-1/4">{day}</td>
                                               <td className="p-2">
                                                   {Object.entries(schedule).map(([time, course]) => (
                                                        <div key={time} className="text-slate-300"><strong className="text-slate-400">{time}:</strong> {course}</div>
                                                   ))}
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                            </div>
                        ) : <p className="text-slate-400">Timetable not uploaded.</p>}
                    </Card>
                </div>
            </div>

             <div className="pt-8">
                <AttendanceLog />
            </div>
        </div>
    );
};

export default AdminDashboard;