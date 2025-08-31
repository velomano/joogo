"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = exports.delay = exports.getErrorMessage = exports.isError = exports.slugify = exports.truncate = exports.unique = exports.chunk = exports.validateUrl = exports.validateEmail = exports.validateRequired = exports.csvToJson = exports.parseCsv = exports.parseDate = exports.formatDate = exports.generateId = void 0;
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
// UUID utilities
const generateId = () => (0, uuid_1.v4)();
exports.generateId = generateId;
// Date utilities
const formatDate = (date, formatString = 'yyyy-MM-dd HH:mm:ss') => {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    return (0, date_fns_1.format)(dateObj, formatString);
};
exports.formatDate = formatDate;
const parseDate = (dateString) => (0, date_fns_1.parseISO)(dateString);
exports.parseDate = parseDate;
// CSV utilities
const parseCsv = (csvContent) => {
    const lines = csvContent.trim().split('\n');
    return lines.map(line => {
        // Simple CSV parsing - split by comma and handle quoted fields
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
};
exports.parseCsv = parseCsv;
const csvToJson = (csvContent, headers) => {
    const rows = (0, exports.parseCsv)(csvContent);
    const [headerRow, ...dataRows] = rows;
    // Validate headers
    if (!headerRow.every((header, index) => header === headers[index])) {
        throw new Error('CSV headers do not match expected format');
    }
    return dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            let value = row[index] || '';
            // Try to convert to number if possible
            if (value && !isNaN(Number(value))) {
                value = Number(value);
            }
            obj[header] = value;
        });
        return obj;
    });
};
exports.csvToJson = csvToJson;
// Validation utilities
const validateRequired = (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
        return `${fieldName} is required`;
    }
    return null;
};
exports.validateRequired = validateRequired;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }
    return null;
};
exports.validateEmail = validateEmail;
const validateUrl = (url) => {
    try {
        new URL(url);
        return null;
    }
    catch {
        return 'Invalid URL format';
    }
};
exports.validateUrl = validateUrl;
// Array utilities
const chunk = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
exports.chunk = chunk;
const unique = (array, key) => {
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
exports.unique = unique;
// String utilities
const truncate = (str, length, suffix = '...') => {
    if (str.length <= length)
        return str;
    return str.substring(0, length - suffix.length) + suffix;
};
exports.truncate = truncate;
const slugify = (str) => {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
exports.slugify = slugify;
// Error utilities
const isError = (error) => {
    return error instanceof Error;
};
exports.isError = isError;
const getErrorMessage = (error) => {
    if ((0, exports.isError)(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
};
exports.getErrorMessage = getErrorMessage;
// Async utilities
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = (0, exports.isError)(error) ? error : new Error(String(error));
            if (attempt === maxAttempts) {
                throw lastError;
            }
            await (0, exports.delay)(delayMs * attempt); // Exponential backoff
        }
    }
    throw lastError;
};
exports.retry = retry;
