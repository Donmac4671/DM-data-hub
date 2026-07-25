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

  // Register in Supabase Auth (auth.users)
  try {
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: emailClean,
      password: rawPassword || 'user123',
      options: {
        data: {
          full_name: profile.fullName,
          phone_number: profile.phoneNumber,
          role: profile.role || 'customer'
        }
      }
    });
    if (authErr) {
      console.warn('Supabase Auth signUp warning (will proceed with profiles table):', authErr.message);
    } else if (authData?.user?.id) {
      profile.id = authData.user.id;
    }
  } catch (err) {
    console.warn('Supabase auth.signUp call failed:', err);
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

export async function deleteUserFromSupabase(userIdOrEmail: string): Promise<void> {
  if (!supabase) return;
  try {
    const isEmail = userIdOrEmail.includes('@');
    const column = isEmail ? 'email' : 'id';
    const val = isEmail ? userIdOrEmail.toLowerCase().trim() : userIdOrEmail;
    const { error } = await supabase.from('profiles').delete().eq(column, val);
    if (error) console.error('Error deleting profile in Supabase:', error.message);
  } catch (err) {
    console.error('Error in deleteUserFromSupabase:', err);
  }
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

// ==========================================
// ORDERS SUPABASE INTEGRATION
// ==========================================
export async function fetchOrdersFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching orders from Supabase:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name || 'Customer',
      totalAmount: Number(row.total_amount),
      status: row.status,
      recipientPhone: row.recipient_phone || '',
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      failureReason: row.failure_reason || '',
      paymentMethod: 'wallet',
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
    }));
  } catch (err) {
    console.error('Error in fetchOrdersFromSupabase:', err);
    return [];
  }
}

export async function createOrderInSupabase(order: any): Promise<void> {
  if (!supabase) return;
  try {
    const primaryPhone = order.recipientPhone || (order.items && order.items[0] ? order.items[0].recipientPhone : '');
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      user_email: order.userEmail,
      user_name: order.userName || '',
      total_amount: order.totalAmount,
      status: order.status,
      recipient_phone: primaryPhone,
      items: order.items,
      failure_reason: order.failureReason || '',
      created_at: order.createdAt || new Date().toISOString(),
      completed_at: order.completedAt || null,
    };
    const { error } = await supabase.from('orders').insert([row]);
    if (error) console.error('Error inserting order in Supabase:', error.message);
  } catch (err) {
    console.error('Error in createOrderInSupabase:', err);
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: string, failureReason?: string): Promise<void> {
  if (!supabase) return;
  try {
    const updates: any = {
      status,
      failure_reason: failureReason || '',
    };
    if (status === 'completed' || status === 'delivered') {
      updates.completed_at = new Date().toISOString();
    }
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (error) console.error('Error updating order status in Supabase:', error.message);
  } catch (err) {
    console.error('Error in updateOrderStatusInSupabase:', err);
  }
}

// ==========================================
// SMS WEBHOOKS SUPABASE INTEGRATION
// ==========================================
export async function fetchWebhooksFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sms_webhooks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching SMS webhooks from Supabase:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      id: row.id,
      momoTxnId: row.momo_txn_id,
      amount: Number(row.amount),
      network: row.network,
      status: row.status || 'unclaimed',
      claimedBy: row.claimed_by || '-',
      referenceCode: row.reference_code || '',
      rawSms: row.raw_sms || '',
      senderPhone: row.sender_phone || '',
      date: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error in fetchWebhooksFromSupabase:', err);
    return [];
  }
}

export async function insertWebhookInSupabase(wh: any): Promise<void> {
  if (!supabase) return;
  try {
    const row = {
      id: wh.id,
      momo_txn_id: wh.momoTxnId,
      amount: wh.amount,
      network: wh.network,
      status: wh.status || 'unclaimed',
      claimed_by: wh.claimedBy || '-',
      reference_code: wh.referenceCode || '',
      raw_sms: wh.rawSms || '',
      sender_phone: wh.senderPhone || '',
      created_at: wh.date || new Date().toISOString(),
    };
    const { error } = await supabase.from('sms_webhooks').upsert([row], { onConflict: 'momo_txn_id' });
    if (error) console.error('Error inserting webhook in Supabase:', error.message);
  } catch (err) {
    console.error('Error in insertWebhookInSupabase:', err);
  }
}

export async function updateWebhookStatusInSupabase(momoTxnId: string, status: string, claimedBy: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('sms_webhooks').update({ status, claimed_by: claimedBy }).eq('momo_txn_id', momoTxnId);
    if (error) console.error('Error updating webhook status in Supabase:', error.message);
  } catch (err) {
    console.error('Error in updateWebhookStatusInSupabase:', err);
  }
}

// ==========================================
// PAYMENT CLAIMS SUPABASE INTEGRATION
// ==========================================
export async function fetchClaimsFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('payment_claims').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      momoTxnId: row.momo_txn_id,
      momoNumber: row.momo_number,
      amount: Number(row.amount),
      screenshotUrl: row.screenshot_url || '',
      status: row.status,
      adminNotes: row.admin_notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    return [];
  }
}

export async function createClaimInSupabase(claim: any): Promise<void> {
  if (!supabase) return;
  try {
    const row = {
      id: claim.id,
      user_id: claim.userId,
      user_email: claim.userEmail,
      user_name: claim.userName,
      momo_txn_id: claim.momoTxnId,
      momo_number: claim.momoNumber,
      amount: claim.amount,
      screenshot_url: claim.screenshotUrl || '',
      status: claim.status || 'pending',
      admin_notes: claim.adminNotes || '',
      created_at: claim.createdAt || new Date().toISOString(),
    };
    await supabase.from('payment_claims').insert([row]);
  } catch (err) {
    console.error('Error creating claim in Supabase:', err);
  }
}

export async function updateClaimInSupabase(claimId: string, status: string, adminNotes?: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('payment_claims').update({ status, admin_notes: adminNotes || '' }).eq('id', claimId);
  } catch (err) {
    console.error('Error updating claim in Supabase:', err);
  }
}

// ==========================================
// COMPLAINTS SUPABASE INTEGRATION
// ==========================================
export async function fetchComplaintsFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching complaints from Supabase:', error.message);
      return [];
    }
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name || 'Customer',
      subject: row.subject,
      message: row.message,
      orderNumber: row.order_number || undefined,
      momoTxnId: row.momo_txn_id || undefined,
      status: row.status || 'open',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : (row.messages || []),
    }));
  } catch (err) {
    console.error('Error in fetchComplaintsFromSupabase:', err);
    return [];
  }
}

export async function createComplaintInSupabase(c: any): Promise<void> {
  if (!supabase) return;
  try {
    const row = {
      id: c.id,
      user_id: c.userId,
      user_email: c.userEmail,
      user_name: c.userName,
      subject: c.subject,
      message: c.message,
      order_number: c.orderNumber || '',
      momo_txn_id: c.momoTxnId || '',
      status: c.status || 'open',
      messages: c.messages || [],
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: c.updatedAt || new Date().toISOString(),
    };
    const { error } = await supabase.from('complaints').insert([row]);
    if (error) console.error('Error inserting complaint in Supabase:', error.message);
  } catch (err) {
    console.error('Error in createComplaintInSupabase:', err);
  }
}

export async function updateComplaintInSupabase(c: any): Promise<void> {
  if (!supabase) return;
  try {
    const row = {
      status: c.status,
      messages: c.messages,
      updated_at: c.updatedAt || new Date().toISOString(),
    };
    const { error } = await supabase.from('complaints').update(row).eq('id', c.id);
    if (error) console.error('Error updating complaint in Supabase:', error.message);
  } catch (err) {
    console.error('Error in updateComplaintInSupabase:', err);
  }
}

