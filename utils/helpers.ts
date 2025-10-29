
import { Timetable } from './types';

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:*/*;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const parseTimetableCSV = (csvText: string): Timetable => {
  const rows = csvText.trim().split('\n');
  if (rows.length < 2) return {};

  const headers = rows[0].split(',').map(h => h.trim());
  const timetable: Timetable = {};

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i].split(',').map(v => v.trim());
    const day = values[0];
    if (!day) continue;
    timetable[day] = {};
    for (let j = 1; j < headers.length; j++) {
      const timeSlot = headers[j];
      const className = values[j] || null;
      if (timeSlot && className && className.toLowerCase() !== 'lunch' && className.toLowerCase() !== 'x') {
        timetable[day][timeSlot] = className;
      }
    }
  }
  return timetable;
};
