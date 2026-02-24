
// Global error logging for runtime errors
// Captures console.log/warn/error and sends to Natively server

declare const __DEV__: boolean;

import { Platform } from "react-native";
import Constants from "expo-constants";
import { setJSExceptionHandler } from 'react-native-exception-handler';

// --- Configuration and State ---
const recentLogs: { [key: string]: boolean } = {};
const clearLogAfterDelay = (key: string) => setTimeout(() => delete recentLogs[key], 100);

const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

const shouldMuteMessage = (msg: string) => MUTED_MESSAGES.some(m => msg.includes(m));

let logQueue: any[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 500; // Milliseconds

let cachedLogServerUrl: string | null = null;
let urlChecked = false;
let fetchErrorLogged = false;

// --- Platform Helpers ---
const getPlatformName = (): string => {
  switch (Platform.OS) {
    case 'ios': return 'iOS';
    case 'android': return 'Android';
    case 'web': return 'Web';
    default: return Platform.OS;
  }
};

const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      cachedLogServerUrl = `${window.location.origin}/natively-logs`;
    } else {
      const expUrl = Constants.experienceUrl;
      if (expUrl) {
        // Attempt to derive base URL from Expo experience URL
        let base = expUrl.replace('exp://', 'https://').split('/')[0] + '//' + expUrl.replace('exp://', '').split('/')[0];
        if (base.includes('192.168.') || base.includes('10.') || base.includes('localhost')) base = base.replace('https://', 'http://');
        cachedLogServerUrl = `${base}/natively-logs`;
      } else {
        // Fallback for other Expo environments
        const host = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.hostUri;
        if (host) {
          const proto = host.includes('ngrok') || host.includes('.io') ? 'https' : 'http';
          cachedLogServerUrl = `${proto}://${host.split('/')[0]}/natively-logs`;
        }
      }
    }
  } catch (e) {
    // Silent fail - use originalError to avoid recursion
  }
  urlChecked = true;
  return cachedLogServerUrl;
};

// --- Core Logging Mechanism ---
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

const flushLogs = async () => {
  if (!logQueue.length) return;
  const toSend = [...logQueue];
  logQueue = [];
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const url = getLogServerUrl();
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
      mode: 'no-cors', // Important for cross-origin requests in web environments
      keepalive: true // Allows the request to outlive the page if it's closing
    });
  } catch (e) {
    if (!fetchErrorLogged) {
      fetchErrorLogged = true;
      originalError('[Natively] Error sending logs:', e);
    }
  }
};

const queueLog = (level: string, message: string, source: string = '') => {
  const key = `${level}:${message}`;
  if (recentLogs[key]) return; // Prevent duplicate logs within a short window
  recentLogs[key] = true;
  clearLogAfterDelay(key);

  logQueue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
    appVersion: Constants.expoConfig?.version,
    buildNumber: Platform.OS === 'ios' ? (Constants.expoConfig?.ios as any)?.buildNumber : (Constants.expoConfig?.android as any)?.versionCode,
  });

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL);
  }
};

// --- Helper Functions (Ensured presence and safety) ---

/**
 * Safely converts arguments to a string, handling objects and circular references.
 * Adds a fallback for non-stringifyable objects.
 * @param args The arguments to stringify.
 * @returns A string representation of the arguments.
 */
const stringifyArgs = (args: any[]): string => {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }
    // Use a WeakSet to detect circular references within the current argument
    const seen = new WeakSet();
    try {
      return JSON.stringify(arg, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]'; // Circular reference found
          }
          seen.add(value);
        }
        return value;
      });
    } catch (e) {
      // Fallback for objects that JSON.stringify cannot handle (e.g., DOM elements, functions, or other complex types)
      return String(arg);
    }
  }).join(' ');
};

/**
 * Extracts file, line, and column from a stack trace line.
 * @param stackLine A single line from an error stack trace.
 * @returns An object with file, line, and column, or null if not found.
 */
const extractSourceLocation = (stackLine: string): { file: string; line: number; column: number } | null => {
  // Regex to match common stack trace formats (e.g., "at filename.js:123:45" or "at Object.<anonymous> (http://.../filename.js:123:45)")
  const match = stackLine.match(/(?:at\s+)?(?:(?:(?:file|http|https):\/\/.*?\/)?([^/]+\.(?:js|ts|jsx|tsx|mjs|cjs))):(\d+):(\d+)/);
  if (match) {
    return {
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
    };
  }
  return null;
};

/**
 * Attempts to get the file, line, and column of the function that called the logging utility.
 * @returns A string in the format "file:line:column" or "unknown:0:0".
 */
const getCallerInfo = (): string => {
  // Use Error.captureStackTrace for better performance and accuracy in V8 environments
  if (typeof Error.captureStackTrace === 'function') {
    const obj = { stack: '' };
    // Exclude getCallerInfo itself from the stack trace
    Error.captureStackTrace(obj, getCallerInfo);
    const stackLines = obj.stack.split('\n');

    // Iterate through stack lines to find the first one not originating from this errorLogger file
    for (let i = 1; i < stackLines.length; i++) { // Start from 1 to skip the 'Error' line
      const line = stackLines[i].trim();
      if (line.includes('errorLogger.ts') || line.includes('errorLogger.js')) {
        continue; // Skip lines from the error logger itself
      }
      const location = extractSourceLocation(line);
      if (location) {
        return `${location.file}:${location.line}:${location.column}`;
      }
    }
  } else {
    // Fallback for environments without captureStackTrace (e.g., some web contexts, older JS engines)
    try {
      throw new Error();
    } catch (e: any) {
      const stackLines = e.stack?.split('\n');
      // Heuristic: skip initial lines that are likely internal to the error creation/logging
      if (stackLines && stackLines.length > 3) {
        for (let i = 3; i < stackLines.length; i++) {
          const line = stackLines[i].trim();
          if (line.includes('errorLogger.ts') || line.includes('errorLogger.js')) {
            continue;
          }
          const location = extractSourceLocation(line);
          if (location) {
            return `${location.file}:${location.line}:${location.column}`;
          }
        }
      }
    }
  }
  return 'unknown:0:0';
};

/**
 * Sends a specific type of error to the logging system, often used for critical or structured errors.
 * In a Natively context, this might communicate with a parent process or a dedicated endpoint.
 * For this implementation, it formats the error and queues it via `queueLog`.
 * @param level The log level (e.g., 'error', 'warn').
 * @param type A specific type/category for the error (e.g., 'Console Error', 'JS Runtime Error').
 * @param payload The error details or object.
 */
const sendErrorToParent = (level: string, type: string, payload: any) => {
  const message = `[${type}] ${stringifyArgs([payload])}`;
  queueLog(level, message, getCallerInfo());
};

// --- Setup Error Logging ---
export const setupErrorLogging = () => {
  if (!__DEV__) return; // Only run in development environments

  originalLog('[Natively] Setting up error logging...');

  // Override console methods
  console.log = (...args: any[]) => {
    originalLog.apply(console, args); // Call original console.log first to prevent recursion
    const msg = stringifyArgs(args);
    const src = getCallerInfo();
    queueLog('log', msg, src);
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args); // Call original console.warn first
    const msg = stringifyArgs(args);
    if (shouldMuteMessage(msg)) return; // Mute specific warnings
    const src = getCallerInfo();
    queueLog('warn', msg, src);
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args); // Call original console.error first
    const msg = stringifyArgs(args);
    if (shouldMuteMessage(msg)) return; // Mute specific errors
    const src = getCallerInfo();
    queueLog('error', msg, src);
    sendErrorToParent('error', 'Console Error', msg); // Send specific console errors
  };

  // Handle uncaught JavaScript exceptions (React Native specific)
  setJSExceptionHandler((err, fatal) => {
    const msg = `FATAL ERROR: ${err.message || err}`;
    queueLog('error', msg, err.stack || '');
    // For fatal errors, you might want to send immediately or show a user-friendly screen
    // sendErrorToParent('fatal', 'JS Fatal Error', { message: msg, stack: err.stack, fatal });
  }, true); // `true` means it's a fatal handler

  // Handle global unhandled errors and promise rejections (Web specific)
  if (typeof window !== 'undefined') {
    window.onerror = (msg, src, line, col, err) => {
      const file = src ? src.split('/').pop() : 'unknown';
      const errMsg = `RUNTIME ERROR: ${msg} at ${file}:${line}:${col}`;
      queueLog('error', errMsg, `${file}:${line}:${col}`);
      sendErrorToParent('error', 'JS Runtime Error', { msg, src: `${file}:${line}:${col}`, err: err?.stack || err });
      return false; // Prevent default browser error handling
    };

    window.addEventListener('unhandledrejection', (e) => {
      const msg = `UNHANDLED PROMISE REJECTION: ${e.reason}`;
      queueLog('error', msg, '');
      sendErrorToParent('error', 'Unhandled Rejection', { reason: e.reason });
    });
  }
};

// Initialize error logging if in development mode
if (__DEV__) {
  setupErrorLogging();
}
