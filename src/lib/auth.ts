import { pb } from './pocketbase';
import type { RecordModel } from 'pocketbase';

export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

export function currentUser(): RecordModel | null {
  return pb.authStore.record;
}

export async function login(email: string, password: string): Promise<void> {
  await pb.collection('users').authWithPassword(email.trim(), password);
}

export function logout(): void {
  pb.authStore.clear();
}
