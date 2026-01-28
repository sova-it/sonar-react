export interface Event {
  _id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  sport?: string;
  category?: string;
  description?: string;
  subevents?: string[];
  coordinator_id?: string;
  participants?: number;
}

export interface Athlete {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  medical_info?: string;
}

export interface Score {
  _id: string;
  athlete_id: string;
  subevent_id: string;
  event_id: string;
  score: string; // "00:14.350" format for track, or distance for field
  rank: string;
  recorded_by: string;
  recorded_at: string;
}

export interface ScoreEntry {
  athlete_id: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
}

export interface RankingEntry {
  score_id: string;
  athlete_id: string;
  athlete_name: string;
  score: string;
  rank: number;
  isTie: boolean;
  timeMs?: number;
}

export type SportContext = 'Track & Field' | 'Distance' | 'Swimming' | 'Tennis';
export type EntryMode = 'individual' | 'bulk' | 'rankings';