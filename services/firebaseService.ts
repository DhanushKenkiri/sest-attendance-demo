import { AttendanceRecord, FirebaseAttendanceLog } from "../types";

const FIREBASE_URL = "https://sest-attendance-default-rtdb.asia-southeast1.firebasedatabase.app/";

export const logAttendance = async (record: AttendanceRecord): Promise<void> => {
    const { studentId } = record;
    // We use a POST request to let Firebase generate a unique key for each record
    const url = `${FIREBASE_URL}/attendance/${studentId}.json`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to log attendance to Firebase: ${errorData.error || response.statusText}`);
    }
};


export const fetchAttendanceLogs = async (): Promise<AttendanceRecord[]> => {
    const url = `${FIREBASE_URL}/attendance.json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch attendance logs from Firebase.');
    }
    const data: FirebaseAttendanceLog | null = await response.json();
    if (!data) {
        return [];
    }
    
    // Firebase returns a nested object. We need to flatten it into a single array.
    const allRecords: AttendanceRecord[] = [];
    Object.values(data).forEach(studentLogs => {
        Object.values(studentLogs).forEach(record => {
            allRecords.push(record);
        });
    });

    // Sort by most recent timestamp first
    return allRecords.sort((a, b) => b.timestamp - a.timestamp);
};
