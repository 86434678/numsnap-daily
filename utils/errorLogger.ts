
import { Platform } from "react-native";
import Constants from "expo-constants";

// Declare __DEV__ global (React Native global for development mode detection)
declare const __DEV__: boolean;

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
let logQueue: { level: string; message: string; source: string; timestamp: string; platform: string }[] = [];
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
      // For web, use the current origin
      cachedLogServerUrl = `${window.location.origin}/natively-logs`;
    } else {
      // For native, try to get the Expo dev server URL
      // experienceUrl format: exp://xxx.ngrok.io/... or exp://192.168.1.1:8081/...
      const experienceUrl = (Constants as any).experienceUrl;
      if (experienceUrl) {
        // Convert exp:// to https:// (for tunnels) or http:// (for local)
        let baseUrl = experienceUrl
          .replace('exp://', 'https://')
          .split('/')[0] + '//' + experienceUrl.replace('exp://', '').split('/')[0];

        // If it looks like a local IP, use http
        if (baseUrl.includes('192.168.') || baseUrl.includes('10.') || baseUrl.includes('localhost')) {
          baseUrl = baseUrl.replace('https://', 'http://');
        }

        cachedLogServerUrl = `${baseUrl}/natively-logs`;
      } else {
        // Fallback: try to use manifestI'll fix all the lint errors now!

<write file="app/(tabs)/_layout.ios.tsx">
import React, { useState, useEffect, useCallback } from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { authenticatedGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const { user } = useAuth();

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    try {
      const response = await authenticatedGet('/api/admin/check');
      setIsAdmin(response.isAdmin || false);
    } catch (error) {
      console.log('Not an admin user');
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [user, checkAdminStatus]);

  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label style={{ fontSize: 12, fontWeight: '600' }}>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label style={{ fontSize: 12, fontWeight: '600' }}>Profile</Label>
      </NativeTabs.Trigger>
      {isAdmin && (
        <NativeTabs.Trigger key="admin" name="admin">
          <Icon sf={{ default: 'shield', selected: 'shield.fill' }} />
          <Label style={{ fontSize: 12, fontWeight: '600' }}>Admin</Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
