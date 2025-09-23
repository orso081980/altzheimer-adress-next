// Dataset validation schemas
export interface DatasetValidationRules {
  file_name: { required: boolean; minLength?: number; maxLength?: number };
  UTF8: { required: boolean };
  PID: { required: boolean };
  Begin: { required: boolean; pattern?: RegExp };
  Languages: { required: boolean; allowedValues?: string[] };
  Participants: { required: boolean };
  ID: { required: boolean };
  Media: { required: boolean };
  End: { required: boolean; pattern?: RegExp };
  utterances: { required: boolean };
}

export const DATASET_VALIDATION: DatasetValidationRules = {
  file_name: { required: true, minLength: 1, maxLength: 255 },
  UTF8: { required: false },
  PID: { required: false },
  Begin: { required: false, pattern: /^\d+$/ },
  Languages: { required: false, allowedValues: ['eng', 'spa', 'fra', 'deu', 'ita', 'por'] },
  Participants: { required: false },
  ID: { required: false },
  Media: { required: false },
  End: { required: false, pattern: /^\d+$/ },
  utterances: { required: false }
};

// User validation schemas
export interface UserValidationRules {
  email: { required: boolean; pattern?: RegExp };
  password: { required: boolean; minLength?: number };
  name: { required: boolean; minLength?: number; maxLength?: number };
  role: { required: boolean; allowedValues?: string[] };
}

export const USER_VALIDATION: UserValidationRules = {
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, minLength: 8 },
  name: { required: true, minLength: 2, maxLength: 100 },
  role: { required: true, allowedValues: ['admin', 'researcher'] }
};

export interface ValidationError {
  field: string;
  message: string;
}

export function validateDataset(data: Record<string, unknown>, isUpdate = false): ValidationError[] {
  const errors: ValidationError[] = [];

  Object.entries(DATASET_VALIDATION).forEach(([field, rules]) => {
    const value = data[field];
    
    // Check required fields (only for creation, not updates)
    if (!isUpdate && rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      return;
    }

    // Skip validation if field is not provided in update
    if (isUpdate && (value === undefined || value === null)) {
      return;
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters long` });
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must not exceed ${rules.maxLength} characters` });
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({ field, message: `${field} has invalid format` });
    }

    // Allowed values validation
    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      errors.push({ field, message: `${field} must be one of: ${rules.allowedValues.join(', ')}` });
    }
  });

  // Special validation for utterances array
  if (data.utterances && Array.isArray(data.utterances)) {
    data.utterances.forEach((utterance: Record<string, unknown>, index: number) => {
      if (!utterance.text || typeof utterance.text !== 'string') {
        errors.push({ field: `utterances[${index}].text`, message: 'Utterance text is required and must be a string' });
      }
      if (!utterance.speaker || typeof utterance.speaker !== 'string') {
        errors.push({ field: `utterances[${index}].speaker`, message: 'Utterance speaker is required and must be a string' });
      }
    });
  }

  return errors;
}

export function validateUser(data: Record<string, unknown>, isUpdate = false): ValidationError[] {
  const errors: ValidationError[] = [];

  Object.entries(USER_VALIDATION).forEach(([field, rules]) => {
    const value = data[field];
    
    // Check required fields (only for creation, not updates)
    if (!isUpdate && rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      return;
    }

    // Skip validation if field is not provided in update
    if (isUpdate && (value === undefined || value === null)) {
      return;
    }

    // String length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters long` });
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must not exceed ${rules.maxLength} characters` });
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({ field, message: `${field} has invalid format` });
    }

    // Allowed values validation
    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      errors.push({ field, message: `${field} must be one of: ${rules.allowedValues.join(', ')}` });
    }
  });

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join('; ');
}