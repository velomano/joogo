import { format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// UUID utilities
export const generateId = (): string => uuidv4();

// Date utilities
export const formatDate = (date: string | Date, formatString = 'yyyy-MM-dd HH:mm:ss'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

export const parseDate = (dateString: string): Date => parseISO(dateString);

// CSV utilities
export const parseCsv = (csvContent: string): string[][] => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    // Simple CSV parsing - split by comma and handle quoted fields
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

export const csvToJson = <T>(csvContent: string, headers: string[]): T[] => {
  const rows = parseCsv(csvContent);
  const [headerRow, ...dataRows] = rows;
  
  // Validate headers
  if (!headerRow.every((header, index) => header === headers[index])) {
    throw new Error('CSV headers do not match expected format');
  }
  
  return dataRows.map(row => {
    const obj: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      let value: string | number = row[index] || '';
      
      // Try to convert to number if possible
      if (value && !isNaN(Number(value))) {
        value = Number(value);
      }
      
      obj[header] = value;
    });
    return obj as T;
  });
};

// Validation utilities
export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

export const validateUrl = (url: string): string | null => {
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return Array.from(new Set(array));
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// String utilities
export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Error utilities
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = isError(error) ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt); // Exponential backoff
    }
  }
  
  throw lastError!;
};
