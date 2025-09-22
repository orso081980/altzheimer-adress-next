export interface Utterance {
  tier: string;
  value: string;
  timestamp?: {
    start: number;
    end: number;
  };
}

import { ObjectId } from 'mongodb';

export interface Dataset {
  _id?: ObjectId | string;
  filename: string;
  metadata: {
    participant_id: string;
    task: string;
    age?: number;
    gender?: string;
    education?: number;
    mmse?: number;
    date?: string;
    [key: string]: any;
  };
  utterances: Utterance[];
  created_at?: Date;
  updated_at?: Date;
}