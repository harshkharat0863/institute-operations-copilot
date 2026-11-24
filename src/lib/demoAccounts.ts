import { UserRole } from '../types';

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  trainer_id?: string;
  avatar: string;
}

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  owner: {
    id: 'usr_owner_1',
    name: 'Vikramaditya Mehta',
    email: 'owner@institute.org',
    password: 'password123',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  counselor: {
    id: 'usr_counselor_1',
    name: 'Anjali Sharma',
    email: 'counselor@institute.org',
    password: 'password123',
    role: 'counselor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  },
  trainer: {
    id: 'usr_trainer_1',
    name: 'Priya Sundaram',
    email: 'priya.trainer@institute.org',
    password: 'password123',
    role: 'trainer',
    trainer_id: 'tr_1',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  accounts: {
    id: 'usr_accounts_1',
    name: 'Suresh Iyer',
    email: 'accounts@institute.org',
    password: 'password123',
    role: 'accounts',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
};
