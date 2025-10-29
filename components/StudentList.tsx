import React from 'react';
import { Student } from '../types';

interface StudentListProps {
    students: Student[];
    onDelete: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onDelete }) => {
    if (students.length === 0) {
        return <p className="text-gray-400 text-center py-4">No students added yet.</p>;
    }

    return (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {students.map((student, index) => (
                <div key={student.id} className={`flex items-center justify-between p-2 rounded-lg ${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/20'}`}>
                    <div className="flex items-center gap-3">
                        <img 
                            src={`data:${student.images[0].mimeType};base64,${student.images[0].base64}`} 
                            alt={student.id} 
                            className="w-10 h-10 object-cover rounded-full border-2 border-gray-700"
                        />
                        <span className="font-mono text-sm text-gray-300">{student.id}</span>
                    </div>
                    <button 
                        onClick={() => onDelete(student.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                        aria-label={`Delete student ${student.id}`}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                       </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default StudentList;