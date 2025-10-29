import React, { useState, useEffect, useCallback } from 'react';
import { fetchAttendanceLogs } from '../services/firebaseService';
import { AttendanceRecord } from '../types';
import Card from './Card';
import Spinner from './Spinner';

const AttendanceLog: React.FC = () => {
    const [logs, setLogs] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedLogs = await fetchAttendanceLogs();
            setLogs(fetchedLogs);
        } catch (e: any) {
            setError('Failed to fetch attendance logs.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getLogs();
    }, [getLogs]);

    return (
        <Card title="Live Attendance Log">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={getLogs} 
                    disabled={isLoading}
                    className="flex items-center justify-center text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-900 text-gray-300 font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                    {isLoading ? <><Spinner /> Refreshing...</> : (
                        <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
                        Refresh Logs</>
                    )}
                </button>
            </div>
            {error && <p className="text-red-400">{error}</p>}
            <div className="max-h-[34rem] overflow-y-auto">
                {isLoading && logs.length === 0 ? (
                     <div className="flex items-center justify-center p-8"><Spinner /> <span className="ml-2">Loading Logs...</span></div>
                ) : !isLoading && logs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No attendance records found.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-black z-10">
                            <tr className="border-b-2 border-gray-800">
                                <th className="p-3">Student ID</th>
                                <th className="p-3">Class</th>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={log.timestamp + log.studentId} className={`border-b border-gray-800/50 ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}>
                                    <td className="p-3 font-mono">{log.studentId}</td>
                                    <td className="p-3">{log.class}</td>
                                    <td className="p-3">{new Date(log.timestamp * 1000).toLocaleString()}</td>
                                    <td className="p-3 font-mono text-green-400">{(log.confidence * 100).toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Card>
    );
};

export default AttendanceLog;