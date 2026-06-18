import { useState, useEffect } from 'react';
import { api, setToken, getToken } from './api';

let globalUser: any = null;
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(fn => fn());
}

export function getCurrentUser() {
  return globalUser;
}

export async function login(email: string, password: string) {
  const result = await api.login(email, password);
  setToken(result.token);
  globalUser = result.user;
  notify();
  return result.user;
}

export async function register(email: string, password: string, displayName?: string) {
  const result = await api.register(email, password, displayName);
  setToken(result.token);
  globalUser = result.user;
  notify();
  return result.user;
}

export async function logout() {
  setToken(null);
  globalUser = null;
  notify();
}

export async function initAuth() {
  const token = getToken();
  if (!token) {
    globalUser = null;
    return null;
  }
  try {
    const result = await api.getMe();
    globalUser = result.user;
    return result.user;
  } catch {
    setToken(null);
    globalUser = null;
    return null;
  }
}

export function useAuth() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter(f => f !== fn); };
  }, []);
  return globalUser;
}
