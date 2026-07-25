import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to convert DB snake_case row to UserProfile
export function mapRowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || row.fullName || 'User',
    email: row.email,
    passwordHash: row.password_hash || row.passwordHash || '',
    phoneNumber: row.phone_number || row.phoneNumber || '',
    role: row.role || 'customer',
    walletBalance: Number(row.wallet_balance ?? row.walletBalance ?? 0),
    momoNumber: row.momo_number || row.momoNumber || '',
    totalSpent: Number(row.total_spent ?? row.totalSpent ?? 0),
    ordersCount: Number(row.orders_count ?? row.ordersCount ?? 0),
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

// Helper to convert UserProfile to DB snake_case row
export function mapProfileToRow(profile: UserProfile, rawPassword?: string) {
  return {
    full_name: profile.fullName,
    email: profile.email.toLowerCase().trim(),
    phone_number: profile.phoneNumber || profile.phone || '',
    password_hash: rawPassword || profile.passwordHash || profile.password || 'user123',
    role: profile.role || 'customer',
    wallet_balance: profile.walletBalance || 0,
    momo_number: profile.momoNumber || profile.phoneNumber || '',
    total_spent: profile.totalSpent || 0,
    orders_count: profile.ordersCount || 0,
    is_blocked: Boolean(profile.isBlocked),
    updated_at: new Date().toISOString(),
  };
}

// Strict User Registration in Supabase
export async function registerUserInSupabase(profile: UserProfile, rawPassword?: string): Promise<UserProfile> {
  if (!supabase) return profile;

  const emailClean = profile.email.toLowerCase().trim();

  // Check if email already exists in Supabase
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', emailClean)
    .maybeSingle();

  if (existing) {
    throw new Error(`An account with email address ${emailClean} already exists. Please sign in instead.`);
  }

  // Insert new row into profiles table
  const rowToInsert = {
    ...mapProfileToRow(profile, rawPassword),
    created_at: profile.createdAt || new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('profiles')
    .insert([rowToInsert])
    .select()
    .single();

  if (insertErr) {
    console.error('Supabase profile registration error:', insertErr);
    throw new Error(insertErr.message || 'Failed to create user account in Supabase.');
  }

  return mapRowToProfile(inserted);
}

// Strict User Login from Supabase
export async function loginUserFromSupabase(email: string, rawPassword?: string): Promise<UserProfile> {
  if (!supabase) {
    throw new Error('Supabase database is not connected. Please check configuration.');
  }

  const emailClean = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', emailClean)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error during sign in: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No account found registered with email ${emailClean}. Please create an account first.`);
  }

  const user = mapRowToProfile(data);

  if (user.isBlocked) {
    throw new Error('This account has been suspended or blocked by admin. Please contact support.');
  }

  // Verify password if provided
  if (rawPassword && user.passwordHash) {
    if (user.passwordHash !== rawPassword) {
      throw new Error('Incorrect password. Please verify your password and try again.');
    }
  }

  return user;
}

export async function fetchUsersFromSupabase(): Promise<UserProfile[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching users from Supabase:', error.message);
      return [];
    }
    return (data || []).map(mapRowToProfile);
  } catch (err) {
    console.error('Error in fetchUsersFromSupabase:', err);
    return [];
  }
}

export async function updateProfileInSupabase(profileIdOrEmail: string, updates: Partial<UserProfile>): Promise<void> {
  if (!supabase) return;
  try {
    const rowUpdates: any = {};
    if (updates.fullName !== undefined) rowUpdates.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) rowUpdates.phone_number = updates.phoneNumber;
    if (updates.momoNumber !== undefined) rowUpdates.momo_number = updates.momoNumber;
    if (updates.walletBalance !== undefined) rowUpdates.wallet_balance = Number(updates.walletBalance.toFixed(2));
    if (updates.totalSpent !== undefined) rowUpdates.total_spent = Number(updates.totalSpent.toFixed(2));
    if (updates.ordersCount !== undefined) rowUpdates.orders_count = updates.ordersCount;
    if (updates.role !== undefined) rowUpdates.role = updates.role;
    if (updates.isBlocked !== undefined) rowUpdates.is_blocked = updates.isBlocked;
    if (updates.passwordHash !== undefined || updates.password !== undefined) {
      rowUpdates.password_hash = updates.passwordHash || updates.password;
    }
    rowUpdates.updated_at = new Date().toISOString();

    const isEmail = profileIdOrEmail.includes('@');
    if (isEmail) {
      await supabase.from('profiles').update(rowUpdates).eq('email', profileIdOrEmail.toLowerCase().trim());
    } else {
      const { error } = await supabase.from('profiles').update(rowUpdates).eq('id', profileIdOrEmail);
      if (error && updates.email) {
        await supabase.from('profiles').update(rowUpdates).eq('email', updates.email.toLowerCase().trim());
      }
    }
  } catch (err) {
    console.error('Error updating profile in Supabase:', err);
  }
}
