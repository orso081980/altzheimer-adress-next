// Core dataset interfaces for consistent data handling across the app
export interface Dataset {
  id: string;
  file_name: string;
  participant_count: number;
  participants: Participant[];
  utterances: Utterance[];
  created_at?: string;
  updated_at?: string;
  metadata?: DatasetMetadata;
}

export interface Participant {
  id: string;
  age: string | number;
  sex: string;
  group: string;
  mmse: string | number;
}

export interface Utterance {
  speaker: string;
  text: string;
  start_time: number;
  end_time: number;
  morphology: {
    raw?: string;
    [key: string]: any;
  };
  grammar: {
    raw?: string;
    [key: string]: any;
  };
  // Optional legacy fields for backward compatibility
  tier?: string;
  value?: string;
  timestamp?: {
    start: number;
    end: number;
  };
}

export interface DatasetMetadata {
  participant_id?: string;
  subject_id?: string;
  task?: string;
  age?: string | number;
  gender?: string;
  language?: string;
  investigator?: string;
  pid?: string;
  ID?: string[];
  AGE?: (string | number)[];
  SEX?: string[];
  Group?: string[];
  MMSE?: (string | number)[];
  [key: string]: any;
}

// API response interfaces
export interface DatasetsResponse {
  datasets: Dataset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DatasetResponse {
  dataset: Dataset;
}