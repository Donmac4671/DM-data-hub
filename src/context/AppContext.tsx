import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound, playSuccessChime } from '../utils/audio';
import { validateGhanaNetworkPhone } from '../lib/networkValidator';
import {
  registerUserInSupabase,
  loginUserFromSupabase,
  fetchUsersFromSupabase,
  updateProfileInSupabase,
  deleteUserFromSupabase,
  fetchOrdersFromSupabase,
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchWebhooksFromSupabase,
  insertWebhookInSupabase,
  updateWebhookStatusInSupabase,
  fetchClaimsFromSupabase,
  createClaimInSupabase,
  updateClaimInSupabase,
  fetchComplaintsFromSupabase,
  createComplaintInSupabase,
  updateComplaintInSupabase,
  deleteComplaintFromSupabase,
  isSupabaseConfigured,
  fetchPackagesFromSupabase,
  upsertPackageInSupabase,
  deletePackageFromSupabase,
  fetchAnnouncementsFromSupabase,
  upsertAnnouncementInSupabase,
  deleteAnnouncementFromSupabase,
  deleteWebhookFromSupabase,
} from '../lib/supabase';
import {
  DataPackage,
  NetworkStatus,
  Order,
  OrderItem,
  WalletTransaction,
  PaymentClaim,
  PendingTopUpRequest,
  SmsWebhookPayload,
  Complaint,
  Announcement,
  AppNotification,
  UserProfile,
  AuditLog,
  NetworkId,
  Role,
  ClaimStatus,
  OrderStatus
} from '../types';
import {
  INITIAL_NETWORKS,
  INITIAL_PACKAGES,
  INITIAL_ANNOUNCEMENTS,
  MOCK_ADMIN_USER,
  MOCK_CUSTOMER_USER,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserProfile | null; // FIXED: Allow null
  setCurrentUser: (user: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  switchRole: (role: Role) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => void;
  resetEverything: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Networks & Packages
  networks: NetworkStatus[];
  packages: DataPackage[];
  toggleNetworkStatus: (networkId: NetworkId, online: boolean, notice?: string) => void;
  addPackage: (pkg: Omit<DataPackage, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<DataPackage>) => void;
  deletePackage: (id: string) => void;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (packageId: string) => void;
  
  // Cart
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  placeOrder: (recipientPhone: string, paymentMethod: 'wallet' | 'direct_momo', momoTxnId?: string) => { success: boolean; message: string; order?: Order };
  updateOrderStatus: (orderId: string, status: OrderStatus, failureReason?: string) => void;
  reorderOrder: (order: Order) => void;
  claimOrderRefund: (orderId: string) => void;
  
  // Wallet & Top-Up
  walletTransactions: WalletTransaction[];
  pendingTopUpRequests: PendingTopUpRequest[];
  generateTopUpReference: (amount: number, momoNumber: string) => PendingTopUpRequest;
  
  // SMS Webhook Simulator & Auto-Crediting
  webhookLogs: SmsWebhookPayload[];
  processSmsWebhook: (payload: { senderPhone?: string; network?: 'MTN' | 'Telecel' | 'AirtelTigo'; amount?: number; momoTxnId?: string; referenceCode?: string; rawSms?: string }) => { success: boolean; message: string; webhook?: SmsWebhookPayload };
  deleteSmsWebhook: (webhookId: string) => void;
  claimPaymentWithTxnId: (momoTxnId: string) => { success: boolean; message: string; amount?: number };
  
  // Claims
  claims: PaymentClaim[];
  submitPaymentClaim: (claim: { referenceCode?: string; momoTxnId: string; amount: number; momoNumber: string; screenshotUrl?: string }) => void;
  processClaim: (claimId: string, status: ClaimStatus, notes?: string) => void;
  
  // Admin manual wallet actions
  manualAdjustWallet: (userId: string, amount: number, reason: string) => void;
  
  // Users Management
  usersList: UserProfile[];
  setUsersList: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  registerUser: (candidate: UserProfile, password?: string) => Promise<UserProfile>;
  loginUser: (email: string, password?: string) => Promise<UserProfile>;
  loginOrRegisterUser: (user: UserProfile) => void;
  toggleBlockUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  toggleUserRole: (userId: string) => void;
  creditUserWallet: (userId: string, amount: number, reason: string) => void;
  
  // Complaints
  complaints: Complaint[];
  submitComplaint: (subject: string, message: string, orderNumber?: string, momoTxnId?: string, screenshotUrl?: string) => void;
  replyToComplaint: (complaintId: string, message: string) => void;
  updateComplaintStatus: (complaintId: string, status: Complaint['status']) => void;
  deleteComplaint: (complaintId: string) => void;
  
  // Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  toggleAnnouncement: (id: string, active: boolean) => void;
  deleteAnnouncement: (id: string) => void;
  
  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadNotificationsCount: number;
  
  // Audit Logs
  auditLogs: AuditLog[];
  isSupabaseConnected: boolean;
  
  // Universal Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Toast Alert state
  toastMessage: { title: string; desc?: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
  }
  return defaultValue;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dmh_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dmh_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Persistent User & Auth States
  const [usersList, setUsersList] = useState<UserProfile[]>(() =>
    getStorageItem('dmh_users', [MOCK_ADMIN_USER])
  );

  // FIXED: Initialize currentUser as null instead of always having a user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = getStorageItem<UserProfile | null>('dmh_user', null);
    if (saved) return saved;
    return null; // Return null instead of MOCK_ADMIN_USER
  });

  const [activeRole, setActiveRole] = useState<Role>(() =>
    (localStorage.getItem('dmh_role') as Role) || 'customer'
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    getStorageItem('dmh_auth', false)
  );

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('dmh_users', JSON.stringify(usersList));
  }, [usersList]);

  // Initial Supabase fetch if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchPackagesFromSupabase().then(spPkgs => {
        if (spPkgs.length > 0) {
          setPackages(spPkgs);
          localStorage.setItem('dmh_packages', JSON.stringify(spPkgs));
        }
      });

      fetchAnnouncementsFromSupabase().then(spAnns => {
        setAnnouncements(prev => {
          const map = new Map<string, Announcement>();
          prev.forEach(a => map.set(a.id, a));
          spAnns.forEach(a => map.set(a.id, a));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem('dmh_announcements', JSON.stringify(merged));
          return merged;
        });
      });

      fetchUsersFromSupabase().then(spUsers => {
        setUsersList(prev => {
          const map = new Map<string, UserProfile>();
          prev.forEach(u => map.set(u.email.toLowerCase(), u));
          spUsers.forEach(u => map.set(u.email.toLowerCase(), u));
          const list = Array.from(map.values());
          const adminExists = list.some(u => u.role === 'admin' || u.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase());
          const finalUsers = adminExists ? list : [MOCK_ADMIN_USER, ...list];
          localStorage.setItem('dmh_users', JSON.stringify(finalUsers));
          return finalUsers;
        });
      });

      fetchOrdersFromSupabase().then(spOrders => {
        setOrders(prev => {
          const map = new Map<string, Order>();
          prev.forEach(o => map.set(o.id, o));
          spOrders.forEach(o => map.set(o.id, o));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem('dmh_orders', JSON.stringify(merged));
          return merged;
        });
      });

      fetchWebhooksFromSupabase().then(spWhs => {
        setWebhookLogs(prev => {
          const map = new Map<string, SmsWebhookPayload>();
          prev.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
          spWhs.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          localStorage.setItem('dmh_webhooks', JSON.stringify(merged));
          return merged;
        });
      });

      fetchClaimsFromSupabase().then(spClaims => {
        setClaims(prev => {
          const map = new Map<string, PaymentClaim>();
          prev.forEach(c => map.set(c.id, c));
          spClaims.forEach(c => map.set(c.id, c));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem('dmh_claims', JSON.stringify(merged));
          return merged;
        });
      });

      fetchComplaintsFromSupabase().then(spComps => {
        setComplaints(prev => {
          const map = new Map<string, Complaint>();
          prev.forEach(c => map.set(c.id, c));
          spComps.forEach(c => map.set(c.id, c));
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem('dmh_complaints', JSON.stringify(merged));
          return merged;
        });
      });
    }
  }, []);

  // FIXED: Only sync currentUser to localStorage if not null
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dmh_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dmh_user');
    }
  }, [currentUser]);

  // FIXED: Ensure currentUser wallet balance and profile details are ALWAYS in sync with usersList
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const matched = usersList.find(
      u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (matched && matched.isBlocked) {
      // Instantly force logout on blocked account!
      setCurrentUser(null);
      setActiveRole('customer');
      setIsAuthenticated(false);
      localStorage.removeItem('dmh_auth');
      localStorage.removeItem('dmh_user');
      localStorage.setItem('dmh_role', 'customer');
      showToast('Account Suspended', 'This account has been blocked or suspended by the administrator.', 'error');
      return;
    }

    if (
      matched &&
      (matched.walletBalance !== currentUser.walletBalance ||
        (matched.ordersCount ?? 0) !== (currentUser.ordersCount ?? 0) ||
        (matched.totalSpent ?? 0) !== (currentUser.totalSpent ?? 0) ||
        !!matched.isBlocked !== !!currentUser.isBlocked ||
        matched.role !== currentUser.role)
    ) {
      const synced = {
        ...currentUser,
        ...matched,
        ordersCount: matched.ordersCount ?? currentUser.ordersCount ?? 0,
        totalSpent: matched.totalSpent ?? currentUser.totalSpent ?? 0,
        isBlocked: !!matched.isBlocked,
      };
      setCurrentUser(synced);
      localStorage.setItem('dmh_user', JSON.stringify(synced));
    }
  }, [usersList, currentUser]);

  // Real-time cross-tab sync and 3-second auto-polling for orders, topups, webhooks, claims & complaints
  useEffect(() => {
    const handleSync = () => {
      const storedOrdersStr = localStorage.getItem('dmh_orders');
      if (storedOrdersStr) {
        try {
          const storedOrders = JSON.parse(storedOrdersStr);
          setOrders(prev => (prev.length === storedOrders.length && JSON.stringify(prev) === storedOrdersStr ? prev : storedOrders));
        } catch (e) {}
      }

      const storedUsersStr = localStorage.getItem('dmh_users');
      if (storedUsersStr) {
        try {
          const storedUsers = JSON.parse(storedUsersStr);
          setUsersList(prev => (prev.length === storedUsers.length && JSON.stringify(prev) === storedUsersStr ? prev : storedUsers));
        } catch (e) {}
      }

      const storedClaimsStr = localStorage.getItem('dmh_claims');
      if (storedClaimsStr) {
        try {
          const storedClaims = JSON.parse(storedClaimsStr);
          setClaims(prev => (prev.length === storedClaims.length && JSON.stringify(prev) === storedClaimsStr ? prev : storedClaims));
        } catch (e) {}
      }

      const storedComplaintsStr = localStorage.getItem('dmh_complaints');
      if (storedComplaintsStr) {
        try {
          const storedComplaints = JSON.parse(storedComplaintsStr);
          setComplaints(prev => (prev.length === storedComplaints.length && JSON.stringify(prev) === storedComplaintsStr ? prev : storedComplaints));
        } catch (e) {}
      }

      const storedWebhooksStr = localStorage.getItem('dmh_webhooks');
      if (storedWebhooksStr) {
        try {
          const storedWebhooks = JSON.parse(storedWebhooksStr);
          setWebhookLogs(prev => (prev.length === storedWebhooks.length && JSON.stringify(prev) === storedWebhooksStr ? prev : storedWebhooks));
        } catch (e) {}
      }

      const storedNetworksStr = localStorage.getItem('dmh_networks');
      if (storedNetworksStr) {
        try {
          const storedNetworks = JSON.parse(storedNetworksStr);
          setNetworks(prev => (prev.length === storedNetworks.length && JSON.stringify(prev) === storedNetworksStr ? prev : storedNetworks));
        } catch (e) {}
      }

      const storedPackagesStr = localStorage.getItem('dmh_packages');
      if (storedPackagesStr) {
        try {
          const storedPackages = JSON.parse(storedPackagesStr);
          setPackages(prev => (prev.length === storedPackages.length && JSON.stringify(prev) === storedPackagesStr ? prev : storedPackages));
        } catch (e) {}
      }

      const storedAnnsStr = localStorage.getItem('dmh_announcements');
      if (storedAnnsStr) {
        try {
          const storedAnns = JSON.parse(storedAnnsStr);
          setAnnouncements(prev => (prev.length === storedAnns.length && JSON.stringify(prev) === storedAnnsStr ? prev : storedAnns));
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleSync);

    const pollInterval = setInterval(() => {
      handleSync();

      if (isSupabaseConfigured) {
        fetchUsersFromSupabase().then(spUsers => {
          const adminExists = spUsers.some(u => u.role === 'admin' || u.email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase());
          const finalUsers = adminExists ? spUsers : [MOCK_ADMIN_USER, ...spUsers];
          setUsersList(prev => {
            if (prev.length !== finalUsers.length || JSON.stringify(prev) !== JSON.stringify(finalUsers)) {
              localStorage.setItem('dmh_users', JSON.stringify(finalUsers));
              return finalUsers;
            }
            return prev;
          });
        });

        fetchOrdersFromSupabase().then(spOrders => {
          setOrders(prev => {
            const map = new Map<string, Order>();
            prev.forEach(o => map.set(o.id, o));
            spOrders.forEach(o => map.set(o.id, o));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (prev.length !== merged.length || JSON.stringify(prev) !== JSON.stringify(merged)) {
              localStorage.setItem('dmh_orders', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        });

        fetchWebhooksFromSupabase().then(spWhs => {
          setWebhookLogs(prev => {
            const map = new Map<string, SmsWebhookPayload>();
            prev.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
            spWhs.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (prev.length !== merged.length || JSON.stringify(prev) !== JSON.stringify(merged)) {
              localStorage.setItem('dmh_webhooks', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        });

        fetchClaimsFromSupabase().then(spClaims => {
          setClaims(prev => {
            const map = new Map<string, PaymentClaim>();
            prev.forEach(c => map.set(c.id, c));
            spClaims.forEach(c => map.set(c.id, c));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (prev.length !== merged.length || JSON.stringify(prev) !== JSON.stringify(merged)) {
              localStorage.setItem('dmh_claims', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        });

        fetchComplaintsFromSupabase().then(spComps => {
          setComplaints(prev => {
            const map = new Map<string, Complaint>();
            prev.forEach(c => map.set(c.id, c));
            spComps.forEach(c => map.set(c.id, c));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (prev.length !== merged.length || JSON.stringify(prev) !== JSON.stringify(merged)) {
              localStorage.setItem('dmh_complaints', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        });
      }

      fetch('/api/webhook/sms')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.data)) {
            setWebhookLogs(prev => {
              const existingMap = new Map(prev.map(w => [w.momoTxnId.toUpperCase(), w]));
              let hasNew = false;
              data.data.forEach((srvWh: any) => {
                if (!existingMap.has(srvWh.momoTxnId.toUpperCase())) {
                  existingMap.set(srvWh.momoTxnId.toUpperCase(), srvWh);
                  hasNew = true;
                }
              });
              if (hasNew) {
                const updatedList = Array.from(existingMap.values());
                localStorage.setItem('dmh_webhooks', JSON.stringify(updatedList));
                return updatedList;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleSync);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dmh_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('dmh_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setUsersList(users => users.map(u => u.id === updated.id ? updated : u));
      if (isSupabaseConfigured) {
        updateProfileInSupabase(updated.id, updates);
      }
      return updated;
    });
    showToast('Profile Updated', 'Your profile details have been successfully saved.', 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null); // FIXED: Set to null instead of MOCK_ADMIN_USER
    localStorage.removeItem('dmh_auth');
    localStorage.removeItem('dmh_user');
    showToast('Logged Out', 'You have been signed out of your account.', 'info');
  };

  const resetEverything = () => {
    localStorage.clear();
    setOrders([]);
    setWalletTransactions([]);
    setPendingTopUpRequests([]);
    setWebhookLogs([]);
    setClaims([]);
    setCart([]);
    setNotifications([]);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setPackages(INITIAL_PACKAGES);
    setNetworks(INITIAL_NETWORKS);
    setUsersList([MOCK_ADMIN_USER]);
    setCurrentUser(null); // FIXED: Set to null
    setActiveRole('customer');
    setIsAuthenticated(false);
    showToast('System Reset', 'All transactions, orders, and cache reset. Please sign in or register.', 'info');
  };

  const switchRole = (role: Role) => {
    setActiveRole(role);
    if (role === 'admin') {
      const adminInList = usersList.find(u => u.role === 'admin' || u.email === 'donmacdatahub@gmail.com') || MOCK_ADMIN_USER;
      setCurrentUser(adminInList);
      setIsAuthenticated(true);
      showToast('Switched to Admin Role', `Logged in as ${adminInList.email}`, 'info');
    } else {
      const custInList = usersList.find(u => u.role === 'customer' && u.id !== MOCK_ADMIN_USER.id) || MOCK_CUSTOMER_USER;
      setCurrentUser(custInList);
      setIsAuthenticated(true);
      showToast('Switched to Customer View', `Viewing as ${custInList.fullName}`, 'info');
    }
  };

  // Networks & Packages Persistent States
  const [networks, setNetworks] = useState<NetworkStatus[]>(() =>
    getStorageItem('dmh_networks', INITIAL_NETWORKS)
  );

  const [packages, setPackages] = useState<DataPackage[]>(() =>
    getStorageItem('dmh_packages', INITIAL_PACKAGES)
  );

  useEffect(() => {
    localStorage.setItem('dmh_networks', JSON.stringify(networks));
  }, [networks]);

  useEffect(() => {
    localStorage.setItem('dmh_packages', JSON.stringify(packages));
  }, [packages]);

  const toggleNetworkStatus = (networkId: NetworkId, online: boolean, notice?: string) => {
    setNetworks(prev =>
      prev.map(n => (n.id === networkId ? { ...n, online, noticeMessage: notice ?? n.noticeMessage } : n))
    );
    addAuditLog(`TOGGLE_NETWORK_${networkId.toUpperCase()}`, `Changed online status to ${online}. Notice: ${notice || 'None'}`);
    showToast(`Network ${networkId.toUpperCase()} Updated`, online ? 'Marked as ONLINE' : 'Marked as OFFLINE', online ? 'success' : 'error');
  };

  const addPackage = (pkg: Omit<DataPackage, 'id'>) => {
    const newPkg: DataPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
    };
    setPackages(prev => [...prev, newPkg]);
    if (isSupabaseConfigured) {
      upsertPackageInSupabase(newPkg);
    }
    localStorage.setItem('dmh_packages', JSON.stringify([...packages, newPkg]));
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
    addAuditLog('ADD_PACKAGE', `Added new package: ${newPkg.name} - GHS ${newPkg.price}`);
    showToast('Package Created', `${newPkg.name} added successfully.`, 'success');
  };

  const updatePackage = (id: string, updates: Partial<DataPackage>) => {
    setPackages(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const fullPkg = { ...p, ...updates };
          if (isSupabaseConfigured) {
            upsertPackageInSupabase(fullPkg);
          }
          return fullPkg;
        }
        return p;
      });
      localStorage.setItem('dmh_packages', JSON.stringify(updated));
      setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
      return updated;
    });
    addAuditLog('UPDATE_PACKAGE', `Updated package ID: ${id}`);
    showToast('Package Updated', 'Changes saved successfully.', 'success');
  };

  const deletePackage = (id: string) => {
    const filtered = packages.filter(p => p.id !== id);
    setPackages(filtered);
    if (isSupabaseConfigured) {
      deletePackageFromSupabase(id);
    }
    localStorage.setItem('dmh_packages', JSON.stringify(filtered));
    setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
    addAuditLog('DELETE_PACKAGE', `Deleted package ID: ${id}`);
    showToast('Package Deleted', 'Package removed from catalog.', 'info');
  };

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() =>
    getStorageItem('dmh_favorites', ['mtn-1gb', 'at-ishare-1gb'])
  );

  useEffect(() => {
    localStorage.setItem('dmh_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (packageId: string) => {
    setFavorites(prev =>
      prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
    );
  };

  // Cart
  const [cart, setCart] = useState<OrderItem[]>(() =>
    getStorageItem('dmh_cart', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: OrderItem) => {
    const netObj = networks.find(n => n.id === item.network);
    if (netObj && !netObj.online) {
      showToast('Network Offline', `${netObj.name} is currently offline. Purchases are temporarily disabled.`, 'error');
      return;
    }
    setCart(prev => [...prev, item]);
    showToast('Added to Cart', `${item.packageName} added for ${item.recipientPhone}`, 'success');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  // Wallet & Transactions
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() =>
    getStorageItem('dmh_transactions', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_transactions', JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() =>
    getStorageItem('dmh_orders', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_orders', JSON.stringify(orders));
  }, [orders]);

  const placeOrder = (
    recipientPhone: string,
    paymentMethod: 'wallet' | 'direct_momo' = 'wallet',
    momoTxnId?: string
  ): { success: boolean; message: string; order?: Order } => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to place an order.' };
    }
    if (currentUser.isBlocked) {
      return { success: false, message: 'This account has been suspended or blocked by admin. Please contact support.' };
    }
    if (cart.length === 0) {
      return { success: false, message: 'Your cart is empty!' };
    }

    // Validate network prefix and special exception for each cart item, and check if network is offline
    for (const item of cart) {
      const netObj = networks.find(n => n.id === item.network);
      if (netObj && !netObj.online) {
        return {
          success: false,
          message: `${netObj.name} is currently offline. Purchases are temporarily disabled for this network.`,
        };
      }

      const targetPhone = item.recipientPhone || recipientPhone;
      const validation = validateGhanaNetworkPhone(targetPhone, item.network);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errorMessage || `Invalid recipient phone number for ${item.packageName}.`,
        };
      }
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (currentUser.walletBalance < total) {
      return {
        success: false,
        message: `Insufficient wallet balance! Total is GHS ${total.toFixed(2)}, but you have GHS ${currentUser.walletBalance.toFixed(2)}. Please top up your wallet.`,
      };
    }

    // Process wallet deduction
    const newBalance = currentUser.walletBalance - total;
    const updatedUser = {
      ...currentUser,
      walletBalance: newBalance,
      ordersCount: (currentUser.ordersCount || 0) + 1,
      totalSpent: (currentUser.totalSpent || 0) + total,
    };
    setCurrentUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    if (isSupabaseConfigured) {
      updateProfileInSupabase(currentUser.id, {
        walletBalance: newBalance,
        ordersCount: updatedUser.ordersCount,
        totalSpent: updatedUser.totalSpent,
      });
    }

    // Record wallet transaction
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      amount: -total,
      type: 'purchase',
      description: `Order #${'ORD-' + Math.floor(100000 + Math.random() * 900000)} (${cart.length} item/s)`,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    };
    setWalletTransactions(prev => [tx, ...prev]);

    const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      items: [...cart],
      totalAmount: total,
      status: 'pending',
      paymentMethod: 'wallet',
      momoTransactionId: momoTxnId,
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => {
      const next = [newOrder, ...prev];
      localStorage.setItem('dmh_orders', JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
      return next;
    });

    if (isSupabaseConfigured) {
      createOrderInSupabase(newOrder);
    }

    clearCart();

    // Trigger Notification
    addNotification({
      userId: currentUser.id,
      title: '📦 ORDER RECEIVED AND IS BEEN PROCESSED',
      message: `ORDER RECEIVED AND IS BEEN PROCESSED. Your order #${orderNum} for GHS ${total.toFixed(2)} has been placed. Data delivery takes 3 to 30 minutes.`,
      type: 'order',
    });

    addAuditLog('PLACE_ORDER', `Order ${orderNum} placed. Total GHS ${total}. Method: wallet. Status: pending`);
    showToast('Order Placed!', `ORDER RECEIVED AND IS BEEN PROCESSED. Order #${orderNum} submitted successfully. Data delivery takes 3-30 minutes.`, 'info');

    return { success: true, message: 'ORDER RECEIVED AND IS BEEN PROCESSED. Your order has been placed. Data delivery takes 3 to 30 minutes.', order: newOrder };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, failureReason?: string) => {
    setOrders(prev => {
      const next = prev.map(o => (o.id === orderId ? { ...o, status, failureReason, completedAt: status === 'completed' || status === 'delivered' ? new Date().toISOString() : o.completedAt } : o));
      localStorage.setItem('dmh_orders', JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event('storage')), 0);
      return next;
    });

    if (isSupabaseConfigured) {
      updateOrderStatusInSupabase(orderId, status, failureReason);
    }

    addAuditLog('UPDATE_ORDER_STATUS', `Order ${orderId} status set to ${status}`);
    showToast('Order Status Updated', `Order set to ${status.toUpperCase()}`, 'info');
  };

  const reorderOrder = (order: Order) => {
    order.items.forEach(item => addToCart(item));
    showToast('Items Added to Cart', `${order.items.length} item(s) from #${order.orderNumber} reordered.`, 'info');
  };

  const claimOrderRefund = (orderId:
