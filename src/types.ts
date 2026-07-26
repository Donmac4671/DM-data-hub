export type NetworkId = 'mtn' | 'telecel' | 'airteltigo_ishare' | 'airteltigo_bigtime';

export type Role = 'customer' | 'admin';

export type PackageStatus = 'online' | 'offline' | 'hidden';

export interface DataPackage {
  id: string;
  network: NetworkId;
  name: string; // e.g. "1GB Data", "10GB iShare", "50GB Big Time"
  dataAmount: string; // e.g. "1.5 GB", "10 GB"
  validity: string; // e.g. "Non-expiry", "30 Days"
  price: number; // in GHS
  status: PackageStatus;
  sortOrder: number;
  popular?: boolean;
  description?: string;
}

export type OrderStatus = 'failed' | 'waiting' | 'pending' | 'processing' | 'delivered' | 'completed';

export interface OrderItem {
  packageId: string;
  packageName: string;
  network: NetworkId;
  price: number;
  dataAmount: string;
  recipientPhone: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-984321"
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'wallet' | 'direct_momo';
  momoTransactionId?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export type TransactionType = 'topup' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit' | 'referral_bonus';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number; // Positive for credit, negative for debit
  type: TransactionType;
  description: string;
  referenceCode?: string; // DMH-XXXXXX
  momoTxnId?: string;
  balanceAfter: number;
  createdAt: string;
}

export type ClaimStatus = 'pending' | 'claimed' | 'rejected' | 'approved';

export interface PaymentClaim {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  referenceCode?: string;
  momoTxnId: string;
  amount: number;
  momoNumber: string;
  screenshotUrl?: string;
  status: ClaimStatus;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SmsWebhookPayload {
  id: string;
  momoTxnId: string; // Transaction ID
  amount: number; // Amount in GHS
  network: 'MTN' | 'Telecel' | 'AirtelTigo'; // Network
  status: 'unclaimed' | 'claimed'; // Status
  claimedBy: string; // Claimed By (e.g. "Kwame Osei (kwame@gmail.com)" or "-")
  date: string; // Date (ISO string)
  rawSms?: string;
  senderPhone?: string;
  extractedRefCode?: string;
  matchedTopUpId?: string;
}

export interface PendingTopUpRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  referenceCode: string; // DMH-XXXXXX
  amount: number;
  momoNumberToPay: string; // Donmac MoMo number e.g. 0549358359
  expiresAt: string; // ISO String
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ComplaintMessage {
  id: string;
  senderRole: 'customer' | 'admin';
  senderName: string;
  message: string;
  screenshotUrl?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  orderNumber?: string;
  momoTxnId?: string;
  messages: ComplaintMessage[];
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  active: boolean;
  networkFilter?: NetworkId | 'all';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'wallet' | 'announcement' | 'complaint' | 'system';
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  password?: string;
  passwordHash?: string;
  phone?: string;
  phoneNumber?: string;
  momoNumber?: string;
  role: Role;
  walletBalance: number;
  totalSpent?: number;
  ordersCount?: number;
  referralCode?: string;
  referredBy?: string;
  totalReferralEarnings?: number;
  isBlocked?: boolean;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    app: boolean;
  };
  securitySettings?: {
    pinEnabled: boolean;
    twoFactorEnabled: boolean;
  };
  createdAt: string;
}

export interface NetworkStatus {
  id: NetworkId;
  name: string;
  brandColor: string; // Hex color
  accentColor: string;
  logoText: string;
  online: boolean;
  noticeMessage?: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: Role;
  action: string; // e.g. "APPROVED_CLAIM", "PRICE_UPDATE", "SMS_WEBHOOK_CREDIT"
  details: string;
  ipAddress?: string;
  createdAt: string;
}
