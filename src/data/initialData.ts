import { DataPackage, NetworkStatus, UserProfile, Announcement } from '../types';

export const INITIAL_NETWORKS: NetworkStatus[] = [
  {
    id: 'mtn',
    name: 'MTN Ghana',
    brandColor: '#FFCC00',
    accentColor: '#1E1E1E',
    logoText: 'MTN',
    online: true,
    noticeMessage: 'Fast instant delivery available 24/7',
  },
  {
    id: 'telecel',
    name: 'Telecel Ghana',
    brandColor: '#E2001A',
    accentColor: '#FFFFFF',
    logoText: 'Telecel',
    online: true,
    noticeMessage: 'Instant automated processing',
  },
  {
    id: 'airteltigo_ishare',
    name: 'AirtelTigo iShare',
    brandColor: '#0055A5',
    accentColor: '#E2001A',
    logoText: 'AT iShare',
    online: true,
    noticeMessage: 'Special high-speed data transfer bundle',
  },
  {
    id: 'airteltigo_bigtime',
    name: 'AirtelTigo Big Time',
    brandColor: '#002B66',
    accentColor: '#FFD700',
    logoText: 'AT BigTime',
    online: true,
    noticeMessage: 'Unlimited non-expiry data package',
  },
];

export const INITIAL_PACKAGES: DataPackage[] = [
  // MTN Ghana (90 Days)
  { id: 'mtn-1gb', network: 'mtn', name: 'MTN 1GB Data', dataAmount: '1 GB', validity: '90 Days', price: 4.50, status: 'online', sortOrder: 1, popular: true },
  { id: 'mtn-2gb', network: 'mtn', name: 'MTN 2GB Data', dataAmount: '2 GB', validity: '90 Days', price: 8.80, status: 'online', sortOrder: 2 },
  { id: 'mtn-3gb', network: 'mtn', name: 'MTN 3GB Data', dataAmount: '3 GB', validity: '90 Days', price: 12.90, status: 'online', sortOrder: 3 },
  { id: 'mtn-4gb', network: 'mtn', name: 'MTN 4GB Data', dataAmount: '4 GB', validity: '90 Days', price: 17.20, status: 'online', sortOrder: 4 },
  { id: 'mtn-5gb', network: 'mtn', name: 'MTN 5GB Data', dataAmount: '5 GB', validity: '90 Days', price: 21.50, status: 'online', sortOrder: 5, popular: true },
  { id: 'mtn-6gb', network: 'mtn', name: 'MTN 6GB Data', dataAmount: '6 GB', validity: '90 Days', price: 25.80, status: 'online', sortOrder: 6 },
  { id: 'mtn-7gb', network: 'mtn', name: 'MTN 7GB Data', dataAmount: '7 GB', validity: '90 Days', price: 30.10, status: 'online', sortOrder: 7 },
  { id: 'mtn-8gb', network: 'mtn', name: 'MTN 8GB Data', dataAmount: '8 GB', validity: '90 Days', price: 34.40, status: 'online', sortOrder: 8 },
  { id: 'mtn-10gb', network: 'mtn', name: 'MTN 10GB Data', dataAmount: '10 GB', validity: '90 Days', price: 42.00, status: 'online', sortOrder: 9, popular: true },
  { id: 'mtn-15gb', network: 'mtn', name: 'MTN 15GB Data', dataAmount: '15 GB', validity: '90 Days', price: 64.00, status: 'online', sortOrder: 10 },
  { id: 'mtn-20gb', network: 'mtn', name: 'MTN 20GB Data', dataAmount: '20 GB', validity: '90 Days', price: 83.00, status: 'online', sortOrder: 11 },
  { id: 'mtn-25gb', network: 'mtn', name: 'MTN 25GB Data', dataAmount: '25 GB', validity: '90 Days', price: 104.00, status: 'online', sortOrder: 12 },
  { id: 'mtn-30gb', network: 'mtn', name: 'MTN 30GB Data', dataAmount: '30 GB', validity: '90 Days', price: 124.50, status: 'online', sortOrder: 13 },
  { id: 'mtn-40gb', network: 'mtn', name: 'MTN 40GB Data', dataAmount: '40 GB', validity: '90 Days', price: 164.00, status: 'online', sortOrder: 14 },
  { id: 'mtn-50gb', network: 'mtn', name: 'MTN 50GB Data', dataAmount: '50 GB', validity: '90 Days', price: 205.00, status: 'online', sortOrder: 15 },

  // Telecel Ghana (60 Days)
  { id: 'tel-5gb', network: 'telecel', name: 'Telecel 5GB Data', dataAmount: '5 GB', validity: '60 Days', price: 22.00, status: 'online', sortOrder: 1, popular: true },
  { id: 'tel-10gb', network: 'telecel', name: 'Telecel 10GB Data', dataAmount: '10 GB', validity: '60 Days', price: 41.00, status: 'online', sortOrder: 2, popular: true },
  { id: 'tel-15gb', network: 'telecel', name: 'Telecel 15GB Data', dataAmount: '15 GB', validity: '60 Days', price: 60.00, status: 'online', sortOrder: 3 },
  { id: 'tel-20gb', network: 'telecel', name: 'Telecel 20GB Data', dataAmount: '20 GB', validity: '60 Days', price: 80.00, status: 'online', sortOrder: 4 },
  { id: 'tel-25gb', network: 'telecel', name: 'Telecel 25GB Data', dataAmount: '25 GB', validity: '60 Days', price: 98.00, status: 'online', sortOrder: 5 },
  { id: 'tel-30gb', network: 'telecel', name: 'Telecel 30GB Data', dataAmount: '30 GB', validity: '60 Days', price: 118.00, status: 'online', sortOrder: 6 },
  { id: 'tel-40gb', network: 'telecel', name: 'Telecel 40GB Data', dataAmount: '40 GB', validity: '60 Days', price: 158.00, status: 'online', sortOrder: 7 },
  { id: 'tel-50gb', network: 'telecel', name: 'Telecel 50GB Data', dataAmount: '50 GB', validity: '60 Days', price: 189.00, status: 'online', sortOrder: 8 },

  // AirtelTigo iShare (60 Days)
  { id: 'at-ishare-1gb', network: 'airteltigo_ishare', name: 'AT iShare 1GB', dataAmount: '1 GB', validity: '60 Days', price: 4.00, status: 'online', sortOrder: 1, popular: true },
  { id: 'at-ishare-2gb', network: 'airteltigo_ishare', name: 'AT iShare 2GB', dataAmount: '2 GB', validity: '60 Days', price: 8.00, status: 'online', sortOrder: 2 },
  { id: 'at-ishare-3gb', network: 'airteltigo_ishare', name: 'AT iShare 3GB', dataAmount: '3 GB', validity: '60 Days', price: 12.10, status: 'online', sortOrder: 3 },
  { id: 'at-ishare-4gb', network: 'airteltigo_ishare', name: 'AT iShare 4GB', dataAmount: '4 GB', validity: '60 Days', price: 16.10, status: 'online', sortOrder: 4 },
  { id: 'at-ishare-5gb', network: 'airteltigo_ishare', name: 'AT iShare 5GB', dataAmount: '5 GB', validity: '60 Days', price: 20.10, status: 'online', sortOrder: 5, popular: true },
  { id: 'at-ishare-6gb', network: 'airteltigo_ishare', name: 'AT iShare 6GB', dataAmount: '6 GB', validity: '60 Days', price: 24.10, status: 'online', sortOrder: 6 },
  { id: 'at-ishare-7gb', network: 'airteltigo_ishare', name: 'AT iShare 7GB', dataAmount: '7 GB', validity: '60 Days', price: 28.10, status: 'online', sortOrder: 7 },
  { id: 'at-ishare-8gb', network: 'airteltigo_ishare', name: 'AT iShare 8GB', dataAmount: '8 GB', validity: '60 Days', price: 32.10, status: 'online', sortOrder: 8 },
  { id: 'at-ishare-10gb', network: 'airteltigo_ishare', name: 'AT iShare 10GB', dataAmount: '10 GB', validity: '60 Days', price: 40.00, status: 'online', sortOrder: 9, popular: true },
  { id: 'at-ishare-12gb', network: 'airteltigo_ishare', name: 'AT iShare 12GB', dataAmount: '12 GB', validity: '60 Days', price: 48.10, status: 'online', sortOrder: 10 },
  { id: 'at-ishare-15gb', network: 'airteltigo_ishare', name: 'AT iShare 15GB', dataAmount: '15 GB', validity: '60 Days', price: 60.20, status: 'online', sortOrder: 11 },
  { id: 'at-ishare-20gb', network: 'airteltigo_ishare', name: 'AT iShare 20GB', dataAmount: '20 GB', validity: '60 Days', price: 80.30, status: 'online', sortOrder: 12 },
  { id: 'at-ishare-25gb', network: 'airteltigo_ishare', name: 'AT iShare 25GB', dataAmount: '25 GB', validity: '60 Days', price: 100.30, status: 'online', sortOrder: 13 },
  { id: 'at-ishare-30gb', network: 'airteltigo_ishare', name: 'AT iShare 30GB', dataAmount: '30 GB', validity: '60 Days', price: 120.40, status: 'online', sortOrder: 14 },

  // AirtelTigo Big Time (Non-Expiry)
  { id: 'at-bt-15gb', network: 'airteltigo_bigtime', name: 'AT Big Time 15GB', dataAmount: '15 GB', validity: 'Non-Expiry', price: 57.00, status: 'online', sortOrder: 1 },
  { id: 'at-bt-20gb', network: 'airteltigo_bigtime', name: 'AT Big Time 20GB', dataAmount: '20 GB', validity: 'Non-Expiry', price: 63.00, status: 'online', sortOrder: 2 },
  { id: 'at-bt-30gb', network: 'airteltigo_bigtime', name: 'AT Big Time 30GB', dataAmount: '30 GB', validity: 'Non-Expiry', price: 74.00, status: 'online', sortOrder: 3 },
  { id: 'at-bt-40gb', network: 'airteltigo_bigtime', name: 'AT Big Time 40GB', dataAmount: '40 GB', validity: 'Non-Expiry', price: 85.00, status: 'online', sortOrder: 4 },
  { id: 'at-bt-50gb', network: 'airteltigo_bigtime', name: 'AT Big Time 50GB', dataAmount: '50 GB', validity: 'Non-Expiry', price: 94.00, status: 'online', sortOrder: 5, popular: true },
  { id: 'at-bt-60gb', network: 'airteltigo_bigtime', name: 'AT Big Time 60GB', dataAmount: '60 GB', validity: 'Non-Expiry', price: 105.00, status: 'online', sortOrder: 6 },
  { id: 'at-bt-70gb', network: 'airteltigo_bigtime', name: 'AT Big Time 70GB', dataAmount: '70 GB', validity: 'Non-Expiry', price: 137.00, status: 'online', sortOrder: 7 },
  { id: 'at-bt-80gb', network: 'airteltigo_bigtime', name: 'AT Big Time 80GB', dataAmount: '80 GB', validity: 'Non-Expiry', price: 151.00, status: 'online', sortOrder: 8 },
  { id: 'at-bt-90gb', network: 'airteltigo_bigtime', name: 'AT Big Time 90GB', dataAmount: '90 GB', validity: 'Non-Expiry', price: 162.00, status: 'online', sortOrder: 9 },
  { id: 'at-bt-100gb', network: 'airteltigo_bigtime', name: 'AT Big Time 100GB', dataAmount: '100 GB', validity: 'Non-Expiry', price: 176.00, status: 'online', sortOrder: 10, popular: true },
  { id: 'at-bt-130gb', network: 'airteltigo_bigtime', name: 'AT Big Time 130GB', dataAmount: '130 GB', validity: 'Non-Expiry', price: 220.00, status: 'online', sortOrder: 11 },
  { id: 'at-bt-140gb', network: 'airteltigo_bigtime', name: 'AT Big Time 140GB', dataAmount: '140 GB', validity: 'Non-Expiry', price: 245.00, status: 'online', sortOrder: 12 },
  { id: 'at-bt-150gb', network: 'airteltigo_bigtime', name: 'AT Big Time 150GB', dataAmount: '150 GB', validity: 'Non-Expiry', price: 273.00, status: 'online', sortOrder: 13 },
  { id: 'at-bt-200gb', network: 'airteltigo_bigtime', name: 'AT Big Time 200GB', dataAmount: '200 GB', validity: 'Non-Expiry', price: 367.00, status: 'online', sortOrder: 14 },
];

export const MOCK_CUSTOMER_USER: UserProfile = {
  id: 'usr-cust-1',
  fullName: 'Ghana Customer',
  email: 'customer@donmacdata.com',
  phoneNumber: '0240000000',
  role: 'customer',
  walletBalance: 150.00,
  momoNumber: '0240000000',
  totalSpent: 0.00,
  ordersCount: 0,
  createdAt: new Date().toISOString(),
};

export const MOCK_ADMIN_USER: UserProfile = {
  id: 'usr-admin-1',
  fullName: 'Donmac Master Admin',
  email: 'donmacdatahub@gmail.com',
  phoneNumber: '0549358359',
  role: 'admin',
  walletBalance: 9999.00,
  momoNumber: '0549358359',
  totalSpent: 0,
  ordersCount: 0,
  createdAt: new Date().toISOString(),
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
