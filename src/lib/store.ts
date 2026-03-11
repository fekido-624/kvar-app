"use client";

import { User } from './types';

const STORAGE_KEY = 'accesspilot_users';

const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@accesspilot.com',
  username: 'admin',
  password: 'Password123!',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [DEFAULT_ADMIN];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const findUserByUsername = (username: string): User | undefined => {
  return getStoredUsers().find(u => u.username === username);
};

export const addUser = (user: User) => {
  const users = getStoredUsers();
  saveUsers([...users, user]);
};

export const updateUser = (updatedUser: User) => {
  const users = getStoredUsers();
  saveUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
};

export const deleteUser = (userId: string) => {
  const users = getStoredUsers();
  saveUsers(users.filter(u => u.id !== userId));
};