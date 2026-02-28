
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
