// Shared utilities for dataset processing and transformation
import { Dataset, Utterance } from '@/types/dataset';

export interface UtteranceDocument {
  speaker?: string;
  text?: string;
  morphology?: string;
  grammar?: string;
  timestamp?: string;
}

export interface RawDataset {
  _id: { toString(): string };
  file_name?: string;
  metadata?: {
    ID?: string[];
    PID?: string;
  };
  utterances?: UtteranceDocument[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Parse participant information from metadata ID field
 * Extracts age, sex, group from PAR|... format
 */
export function parseParticipantInfo(metadata: { ID?: string[] }): {
  id: string;
  age: string;
  sex: string;
  group: string;
  mmse: string;
} {
  // Find participant info in ID array
  const participantInfo = metadata?.ID?.find((id: string) => id.includes('PAR')) || '';
  const participantParts = participantInfo.split('|');
  
  const id = participantParts[2] || 'PAR';
  const age = participantParts[3] ? participantParts[3].replace(';', '') : 'Unknown';
  const sex = participantParts[4] || 'Unknown';
  const group = participantParts[5] || 'Unknown';
  
  return {
    id,
    age,
    sex,
    group,
    mmse: 'Unknown'
  };
}

/**
 * Transform utterance data from database format to API format
 */
export function transformUtterance(utterance: UtteranceDocument): Utterance {
  let start_time = 0;
  let end_time = 0;
  
  if (utterance.timestamp && typeof utterance.timestamp === 'string') {
    const [startMs, endMs] = utterance.timestamp.split('_').map(Number);
    start_time = Math.round(startMs / 1000 * 100) / 100;
    end_time = Math.round(endMs / 1000 * 100) / 100;
  }
  
  return {
    speaker: utterance.speaker || 'Unknown',
    text: utterance.text || '',
    start_time,
    end_time,
    morphology: { raw: utterance.morphology || '' },
    grammar: { raw: utterance.grammar || '' },
    // Legacy fields for backward compatibility
    tier: utterance.speaker || 'Unknown',
    value: utterance.text || '',
    timestamp: start_time || end_time ? {
      start: start_time,
      end: end_time
    } : undefined
  };
}

/**
 * Transform raw dataset from database to API response format
 */
export function transformDataset(rawDataset: RawDataset): Dataset {
  const participant = parseParticipantInfo(rawDataset.metadata || {});
  
  return {
    id: rawDataset._id.toString(),
    file_name: rawDataset.metadata?.PID || rawDataset.file_name || `Dataset_${rawDataset._id}`,
    participant_count: rawDataset.metadata?.ID ? rawDataset.metadata.ID.length : 0,
    participants: [participant],
    utterances: Array.isArray(rawDataset.utterances) 
      ? rawDataset.utterances.map(transformUtterance)
      : [],
    created_at: rawDataset.created_at,
    updated_at: rawDataset.updated_at,
    metadata: rawDataset.metadata
  };
}