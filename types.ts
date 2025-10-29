export interface StudentImage {
  name: string;
  base64: string;
  mimeType: string;
}

export interface Student {
  id: string;
  images: StudentImage[];
}

export type Timetable = Record<string, Record<string, string>>;

export interface AttendanceRecord {
  studentId: string;
  class: string;
  status: "Present" | "Absent";
  confidence: number;
  timestamp: number;
}

export interface FirebaseAttendanceLog {
  [studentId: string]: {
    [recordId: string]: AttendanceRecord;
  };
}


export interface RecognitionResult {
  recognized: boolean;
  studentId?: string;
  confidence?: number;
  timestamp?: number;
  message: string;
  className?: string;
}
