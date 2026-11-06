/**
 * Tamil Calendar Type Definitions for Mandhragiri Jothidam
 * Strongly typed models for verified Tamil date, month, year, and Muhurtham metadata.
 */

export type TamilMonthName =
  | 'சித்திரை'
  | 'வைகாசி'
  | 'ஆனி'
  | 'ஆடி'
  | 'ஆவணி'
  | 'புரட்டாசி'
  | 'ஐப்பசி'
  | 'கார்த்திகை'
  | 'மார்கழி'
  | 'தை'
  | 'மாசி'
  | 'பங்குனி';

export type TamilWeekdayName =
  | 'ஞாயிறு'
  | 'திங்கள்'
  | 'செவ்வாய்'
  | 'புதன்'
  | 'வியாழன்'
  | 'வெள்ளி'
  | 'சனி';

export interface TamilDateInfo {
  gregorianDate: string; // YYYY-MM-DD
  tamilMonth: TamilMonthName;
  tamilMonthIndex: number; // 1 to 12
  tamilDay: number;
  tamilYearName: string; // e.g. "சுபகிருது"
  tamilWeekday: TamilWeekdayName;
  tamilWeekdayFull: string; // e.g. "திங்கட்கிழமை"
  isMuhurtham: boolean;
  muhurthamType?: 'marriage' | 'general' | 'grahapravesam';
  muhurthamTitle?: string; // e.g. "சுப முகூர்த்த நாள்"
  tithi?: string;
  nakshatra?: string;
  isVerified: boolean;
}

export interface MuhurthamDay {
  date: string; // YYYY-MM-DD
  isMuhurtham: boolean;
  title?: string;
  type?: string;
  source?: string;
}
