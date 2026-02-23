
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { authenticatedGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
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
  };

  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  // Add admin tab if user is admin
  if (isAdmin) {
    tabs.push({
      name: 'admin',
      route: '/(tabs)/admin',
      icon: 'shield',
      label: 'Admin',
    });
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="profile" name="profile" />
        {isAdmin && <Stack.Screen key="admin" name="admin" />}
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
