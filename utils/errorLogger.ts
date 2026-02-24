// Global error logging for runtime errors
// Captures console.log/warn/error and sends to Natively server for AI debugging

// Declare __DEV__ global (React Native global for development mode detection)
declare const __DEV__: boolean;

import { Platform } from "react-native";
import Constants from "expo-constants";
import { setJSExceptionHandler } from 'react-native-exception-handler';

// Simple debouncing to prevent duplicate logs
const recentLogs: { [key: string]: boolean } = {};
const clearLogAfterDelay = (logKey: string) => {
  setTimeout(() => delete recentLogs[logKey], 100);
};

// Messages to mute (noisy warnings that don't help debugging)
const MUTED_MESSAGES = [
  'each child in a list should have a unique "key" prop',
  'Each child in a list should have a unique "key" prop',
];

// Check if a message should be muted
const shouldMuteMessage = (message: string): boolean => {
  return MUTED_MESSAGES.some(muted => message.includes(muted));
};

// Queue for batching logs
let logQueue: Array<{ level: string; message: string; source: string; timestamp: string; platform: string }> = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 500; // Flush every 500ms

// Get a friendly platform name
const getPlatformName = (): string => {
  switch (Platform.OS) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web':
      return 'Web';
    default:
      return Platform.OS;
  }
};

// Cache the log server URL
let cachedLogServerUrl: string | null = null;
let urlChecked = false;

// Get the log server URL based on platform
const getLogServerUrl = (): string | null => {
  if (urlChecked) return cachedLogServerUrl;

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      cachedLogServerUrl = `${window.location.origin}/natively-logs`;
    } else {
      const experienceUrl = (Constants as any).experienceUrl;
      if (experienceUrl) {
        let baseUrl = experienceUrl
          .replace('exp://', 'https://')
          .split('/')[0] + '//' + experienceUrl.replace('exp://', '').split('/')[0];

        if (baseUrl.includes('192.168.') || baseUrl.includes('10.') || baseUrl.includes('localhost')) {
          baseUrl = baseUrl.replace('https://', 'http://');
        }

        cachedLogServerUrl = `${baseUrl}/natively-logs`;
      } else {
        const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
        if (hostUri) {
          const protocol = hostUri.includes('ngrok') || hostUri.includes('.io') ? 'https' : 'http';
          cachedLogServerUrl = `${protocol}://${hostUri.split('/')[0]}/natively-logs`;
        }
      }
    }
  } catch (e) {
    // Silently fail
  }

  urlChecked = true;
  return cachedLogServerUrl;
};

// Track if we've logged fetch errors to avoid spam
let fetchErrorLogged = false;

// Original console methods (captured early)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Flush the log queue to server
const flushLogs = async () => {
  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];
  flushTimeout = null;

  const url = getLogServerUrl();
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logsToSend),
      mode: 'no-cors',          // Allows fire-and-forget even with CORS issues
      keepalive: true           // Ensures send on page unload
    });
  } catch (e) {
    if (!fetchErrorLogged) {
      fetchErrorLogged = true;
      originalConsoleError('[Natively] Fetch error (will not repeat):', e);
    }
  }
};

// Queue a log to be sent
const queueLog = (level: string, message: string, source: string = '') => {
  const logKey = `${level}:${message}`;

  if (recentLogs[logKey]) return;
  recentLogs[logKey] = true;
  clearLogAfterDelay(logKey);

  logQueue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
  });

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL);
  }
};

// ... (keep the rest of your functions: sendErrorToParent, extractSourceLocation, getCallerInfo, stringifyArgs)

export const setupErrorLogging = () => {
  if (!__DEV__) return;

  originalConsoleLog('[Natively] Setting up error logging...');

  console.log = (...args: any[]) => {
    originalConsoleLog.apply(console, args);
    const message = stringifyArgs(args);
    const source = getCallerInfo();
    queueLog('log', message, source);
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    const message = stringifyArgs(args);
    if (shouldMuteMessage(message)) return;
    const source = getCallerInfo();
    queueLog('warn', message, source);
  };

  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const message = stringifyArgs(args);
    if (shouldMuteMessage(message)) return;
    const source = getCallerInfo();
    queueLog('error', message, source);
    sendErrorToParent('error', 'Console Error', message);
  };

  // Global JS error handler
  setJSExceptionHandler((error, isFatal) => {
    const message = `FATAL ERROR: ${error.message || error}`;
    queueLog('error', message, error.stack || '');
  }, true);

  // Web-specific handlers (keep as-is)
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      // ... your existing code
    };

    window.addEventListener('unhandledrejection', (event) => {
      // ... your existing code
    });
  }
};

// Auto-initialize
if (__DEV__) {
  setupErrorLogging();
}
