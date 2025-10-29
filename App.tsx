import React, { useState, useCallback } from 'react';
import { Student, Timetable, StudentImage, AttendanceRecord, RecognitionResult } from './types';
import { fileToBase64, parseTimetableCSV } from './utils/helpers';
import { recognizeStudent } from './services/geminiService';
import { logAttendance } from './services/firebaseService';

import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import LiveKiosk from './components/LiveKiosk';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [timetable, setTimetable] = useState<Timetable>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [view, setView] = useState<'admin' | 'kiosk'>('admin');

  const handleAddStudent = async (studentId: string, files: FileList) => {
    if (!studentId || !files || files.length === 0) {
      setError("Student ID and at least one image are required.");
      return false;
    }
    if (students.some(s => s.id === studentId)) {
        setError("A student with this ID already exists.");
        return false;
    }
    setError(null);
    setIsLoading(true);

    const imagePromises = Array.from(files).map(async (file: File) => ({
      name: file.name,
      base64: await fileToBase64(file),
      mimeType: file.type,
    }));

    try {
        const newImages = await Promise.all(imagePromises);
        setStudents(prev => [...prev, { id: studentId, images: newImages }]);
        setIsLoading(false);
        return true;
    } catch (e) {
        setError("Failed to process images.");
        setIsLoading(false);
        return false;
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };


  const handleTimetableUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
        const text = await file.text();
        const parsed = parseTimetableCSV(text);
        if (Object.keys(parsed).length === 0) {
            setError("Failed to parse timetable. Please check the CSV format.");
        } else {
            setTimetable(parsed);
        }
    } catch (e) {
        setError("Error reading the timetable file.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const getCurrentClass = useCallback(() => {
    const now = new Date();
    const day = now.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() + now.getMinutes() / 60;
    
    const daySchedule = timetable[day];
    if (!daySchedule) return null;

    for (const timeSlot in daySchedule) {
        const [start, end] = timeSlot.split('-').map(t => {
            const [h, m] = t.split(':').map(Number);
            return h + m / 60;
        });
        if (currentTime >= start && currentTime < end) {
            return daySchedule[timeSlot];
        }
    }
    return null;
  }, [timetable]);

  const handleRecognition = useCallback(async (liveImage: StudentImage): Promise<RecognitionResult | null> => {
    if (!liveImage) {
        return null;
    }
    setError(null);

    try {
        const match = await recognizeStudent(liveImage, students);
        
        if (match) {
            const className = getCurrentClass();
            if (className) {
                const record: AttendanceRecord = {
                    studentId: match.studentId,
                    class: className,
                    status: 'Present',
                    confidence: match.confidence,
                    timestamp: Math.floor(Date.now() / 1000),
                };
                await logAttendance(record);
                return {
                    recognized: true,
                    studentId: record.studentId,
                    confidence: record.confidence,
                    timestamp: record.timestamp,
                    message: "Attendance marked successfully!",
                    className: record.class,
                };
            } else {
                 return { recognized: true, studentId: match.studentId, confidence: match.confidence, message: "Student recognized, but no class is scheduled right now." };
            }
        } else {
            return { recognized: false, message: "No matching student found." };
        }
    } catch (e: any) {
        console.error("Recognition process failed:", e);
        setError(`An error occurred: ${e.message}`);
        return { recognized: false, message: `An error occurred: ${e.message}` };
    }
  }, [students, getCurrentClass]);


  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      <Header />
       <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-end mb-6">
            <button 
                onClick={() => {
                    setError(null);
                    setView(prev => (prev === 'admin' ? 'kiosk' : 'admin'));
                }} 
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm"
            >
                {view === 'admin' ? "Go to Live Kiosk" : "Go to Admin Dashboard"}
            </button>
        </div>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6" onClick={() => setError(null)}>{error}</div>}

        {view === 'admin' ? (
            <AdminDashboard 
                students={students}
                timetable={timetable}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onTimetableUpload={handleTimetableUpload}
                isLoading={isLoading}
            />
        ) : (
            <LiveKiosk
                handleRecognition={handleRecognition}
                getCurrentClass={getCurrentClass}
            />
        )}
      </div>
    </div>
  );
};

export default App;