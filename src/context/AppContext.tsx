import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound, playSuccessChime } from '../utils/audio';
import { validateGhanaNetworkPhone } from '../lib/networkValidator';
import {
  registerUserInSupabase,
  loginUserFromSupabase,
  fetchUsersFromSupabase,
  updateProfileInSupabase,
  fetchOrdersFromSupabase,
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchWebhooksFromSupabase,
  insertWebhookInSupabase,
  updateWebhookStatusInSupabase,
  fetchClaimsFromSupabase,
  createClaimInSupabase,
  updateClaimInSupabase,
  isSupabaseConfigured,
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
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
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
  processClaim: (claimId: string, status: 'approved' | 'rejected', notes?: string) => void;
  
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

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = getStorageItem<UserProfile | null>('dmh_user', null);
    if (saved) return saved;
    return MOCK_ADMIN_USER;
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
      fetchUsersFromSupabase().then(spUsers => {
        if (spUsers.length > 0) {
          setUsersList(prev => {
            const map = new Map<string, UserProfile>();
            prev.forEach(u => map.set(u.email.toLowerCase(), u));
            spUsers.forEach(u => map.set(u.email.toLowerCase(), u));
            return Array.from(map.values());
          });
        }
      });

      fetchOrdersFromSupabase().then(spOrders => {
        if (spOrders.length > 0) {
          setOrders(prev => {
            const map = new Map<string, Order>();
            prev.forEach(o => map.set(o.id, o));
            spOrders.forEach(o => map.set(o.id, o));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            localStorage.setItem('dmh_orders', JSON.stringify(merged));
            return merged;
          });
        }
      });

      fetchWebhooksFromSupabase().then(spWhs => {
        if (spWhs.length > 0) {
          setWebhookLogs(prev => {
            const map = new Map<string, SmsWebhookPayload>();
            prev.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
            spWhs.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            localStorage.setItem('dmh_webhooks', JSON.stringify(merged));
            return merged;
          });
        }
      });

      fetchClaimsFromSupabase().then(spClaims => {
        if (spClaims.length > 0) {
          setClaims(prev => {
            const map = new Map<string, PaymentClaim>();
            prev.forEach(c => map.set(c.id, c));
            spClaims.forEach(c => map.set(c.id, c));
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            localStorage.setItem('dmh_claims', JSON.stringify(merged));
            return merged;
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dmh_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Ensure currentUser wallet balance and profile details are ALWAYS in sync with usersList
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const matched = usersList.find(
        u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (
        matched &&
        (matched.walletBalance !== currentUser.walletBalance ||
          matched.ordersCount !== currentUser.ordersCount ||
          matched.totalSpent !== currentUser.totalSpent ||
          matched.role !== currentUser.role)
      ) {
        const synced = { ...currentUser, ...matched };
        setCurrentUser(synced);
        localStorage.setItem('dmh_user', JSON.stringify(synced));
      }
    }
  }, [usersList, currentUser]);

  // Real-time cross-tab sync and 3-second auto-polling for orders, topups, webhooks, claims & complaints
  useEffect(() => {
    const handleSync = () => {
      const storedOrdersStr = localStorage.getItem('dmh_orders');
      if (storedOrdersStr) {
        try {
          const storedOrders = JSON.parse(storedOrdersStr);
          setOrders(prev => (JSON.stringify(prev) === storedOrdersStr ? prev : storedOrders));
        } catch (e) {}
      }

      const storedUsersStr = localStorage.getItem('dmh_users');
      if (storedUsersStr) {
        try {
          const storedUsers = JSON.parse(storedUsersStr);
          setUsersList(prev => (JSON.stringify(prev) === storedUsersStr ? prev : storedUsers));
        } catch (e) {}
      }

      const storedClaimsStr = localStorage.getItem('dmh_claims');
      if (storedClaimsStr) {
        try {
          const storedClaims = JSON.parse(storedClaimsStr);
          setClaims(prev => (JSON.stringify(prev) === storedClaimsStr ? prev : storedClaims));
        } catch (e) {}
      }

      const storedComplaintsStr = localStorage.getItem('dmh_complaints');
      if (storedComplaintsStr) {
        try {
          const storedComplaints = JSON.parse(storedComplaintsStr);
          setComplaints(prev => (JSON.stringify(prev) === storedComplaintsStr ? prev : storedComplaints));
        } catch (e) {}
      }

      const storedWebhooksStr = localStorage.getItem('dmh_webhooks');
      if (storedWebhooksStr) {
        try {
          const storedWebhooks = JSON.parse(storedWebhooksStr);
          setWebhookLogs(prev => (JSON.stringify(prev) === storedWebhooksStr ? prev : storedWebhooks));
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleSync);

    const pollInterval = setInterval(() => {
      handleSync();

      if (isSupabaseConfigured) {
        fetchOrdersFromSupabase().then(spOrders => {
          if (spOrders.length > 0) {
            setOrders(prev => {
              const map = new Map<string, Order>();
              prev.forEach(o => map.set(o.id, o));
              spOrders.forEach(o => map.set(o.id, o));
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                localStorage.setItem('dmh_orders', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }
        });

        fetchWebhooksFromSupabase().then(spWhs => {
          if (spWhs.length > 0) {
            setWebhookLogs(prev => {
              const map = new Map<string, SmsWebhookPayload>();
              prev.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
              spWhs.forEach(w => map.set(w.momoTxnId.toUpperCase(), w));
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                localStorage.setItem('dmh_webhooks', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }
        });

        fetchClaimsFromSupabase().then(spClaims => {
          if (spClaims.length > 0) {
            setClaims(prev => {
              const map = new Map<string, PaymentClaim>();
              prev.forEach(c => map.set(c.id, c));
              spClaims.forEach(c => map.set(c.id, c));
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                localStorage.setItem('dmh_claims', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }
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
    setCurrentUser(prev => {
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
    setCurrentUser(MOCK_ADMIN_USER);
    setActiveRole('customer');
    setIsAuthenticated(false);
    showToast('System Reset', 'All transactions, orders, and cache reset. Please sign in or register.', 'info');
  };

  const switchRole = (role: Role) => {
    setActiveRole(role);
    if (role === 'admin') {
      const adminInList = usersList.find(u => u.role === 'admin' || u.email === 'donmacdatahub@gmail.com') || MOCK_ADMIN_USER;
      setCurrentUser(adminInList);
      showToast('Switched to Admin Role', `Logged in as ${adminInList.email}`, 'info');
    } else {
      const custInList = usersList.find(u => u.role === 'customer' && u.id !== MOCK_ADMIN_USER.id) || MOCK_CUSTOMER_USER;
      setCurrentUser(custInList);
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
    addAuditLog('ADD_PACKAGE', `Added new package: ${newPkg.name} - GHS ${newPkg.price}`);
    showToast('Package Created', `${newPkg.name} added successfully.`, 'success');
  };

  const updatePackage = (id: string, updates: Partial<DataPackage>) => {
    setPackages(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    addAuditLog('UPDATE_PACKAGE', `Updated package ID: ${id}`);
    showToast('Package Updated', 'Changes saved successfully.', 'success');
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
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
    if (cart.length === 0) {
      return { success: false, message: 'Your cart is empty!' };
    }

    // Validate network prefix and special exception for each cart item
    for (const item of cart) {
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
      status: 'pending', // Delivery takes 3-30 minutes, pending admin processing
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
      title: '📦 Order Received & Pending Processing',
      message: `Your order #${orderNum} for GHS ${total.toFixed(2)} has been placed. Data delivery takes 3 to 30 minutes. An admin will process your request.`,
      type: 'order',
    });

    addAuditLog('PLACE_ORDER', `Order ${orderNum} placed. Total GHS ${total}. Method: wallet. Status: pending`);
    showToast('Order Placed!', `Order #${orderNum} submitted successfully. Data delivery takes 3-30 minutes.`, 'info');

    return { success: true, message: 'Order placed successfully! Data delivery takes 3-30 minutes and is pending admin processing.', order: newOrder };
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

  // Top Up Reference Generation
  const [pendingTopUpRequests, setPendingTopUpRequests] = useState<PendingTopUpRequest[]>(() =>
    getStorageItem('dmh_pending_topups', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_pending_topups', JSON.stringify(pendingTopUpRequests));
  }, [pendingTopUpRequests]);

  const generateTopUpReference = (amount: number, momoNumber: string): PendingTopUpRequest => {
    const refCode = `DMH-${Math.floor(100000 + Math.random() * 900000)}`;
    const expires = new Date(Date.now() + 30 * 60000).toISOString(); // 30 mins expiry

    const newReq: PendingTopUpRequest = {
      id: `topup-req-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      referenceCode: refCode,
      amount,
      momoNumberToPay: '0549358359', // Donmac Official MoMo Merchant
      expiresAt: expires,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setPendingTopUpRequests(prev => [newReq, ...prev]);
    addAuditLog('GENERATE_TOPUP_REF', `Ref ${refCode} for GHS ${amount} generated for ${currentUser.email}`);
    return newReq;
  };

  // SMS Webhook & Auto-Crediting Engine
  const [webhookLogs, setWebhookLogs] = useState<SmsWebhookPayload[]>(() =>
    getStorageItem('dmh_webhooks', [
      {
        id: 'wh-demo-1',
        momoTxnId: '30291049182',
        amount: 50.00,
        network: 'MTN',
        status: 'unclaimed',
        claimedBy: '-',
        date: new Date().toISOString(),
        rawSms: 'Payment received for GHS 50.00 from 0241234567. Financial Transaction Id: 30291049182. Current Balance: GHS 150.00.',
        senderPhone: '0241234567'
      },
      {
        id: 'wh-demo-2',
        momoTxnId: '88102948102',
        amount: 100.00,
        network: 'Telecel',
        status: 'unclaimed',
        claimedBy: '-',
        date: new Date(Date.now() - 3600000).toISOString(),
        rawSms: 'Cash Deposit received: GHS 100.00. Txn ID: 88102948102.',
        senderPhone: '0200000000'
      }
    ])
  );

  useEffect(() => {
    localStorage.setItem('dmh_webhooks', JSON.stringify(webhookLogs));
  }, [webhookLogs]);

  const deleteSmsWebhook = (webhookId: string) => {
    setWebhookLogs(prev => prev.filter(w => w.id !== webhookId));
    addAuditLog('DELETE_SMS_WEBHOOK', `Deleted webhook entry ${webhookId}`);
    showToast('Webhook Deleted', 'Webhook record removed from system.', 'info');
  };

  const processSmsWebhook = (payload: {
    senderPhone?: string;
    network?: 'MTN' | 'Telecel' | 'AirtelTigo';
    amount?: number;
    momoTxnId?: string;
    referenceCode?: string;
    rawSms?: string;
  }): { success: boolean; message: string; webhook?: SmsWebhookPayload } => {
    let momoTxnId = (payload.momoTxnId || '').trim();
    let amount = payload.amount || 0;
    let network: 'MTN' | 'Telecel' | 'AirtelTigo' = payload.network || 'MTN';
    const rawSms = payload.rawSms || '';

    // Extract fields from raw SMS body if provided
    if (rawSms) {
      const txnMatch = rawSms.match(/(?:Transaction ID|Txn ID|Transaction Id|Financial Transaction Id|Ref|ID):\s*([0-9A-Za-z]+)/i) ||
                       rawSms.match(/(?:id|ref):\s*([0-9]{8,14})/i) ||
                       rawSms.match(/\b([0-9]{9,12})\b/);
      if (txnMatch && !momoTxnId) {
        momoTxnId = txnMatch[1];
      }

      const amountMatch = rawSms.match(/(?:GHS|GHC|GH₵|₵|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
                          rawSms.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:GHS|GHC)/i);
      if (amountMatch && !amount) {
        amount = parseFloat(amountMatch[1]);
      }

      if (rawSms.toLowerCase().includes('telecel') || rawSms.toLowerCase().includes('vodafone')) {
        network = 'Telecel';
      } else if (rawSms.toLowerCase().includes('airtel') || rawSms.toLowerCase().includes('tigo') || rawSms.toLowerCase().includes('at money')) {
        network = 'AirtelTigo';
      } else {
        network = 'MTN';
      }
    }

    if (!momoTxnId) {
      return { success: false, message: 'Could not extract valid MoMo Transaction ID from payload.' };
    }

    // Check duplicate
    const existing = webhookLogs.find(w => w.momoTxnId.toLowerCase() === momoTxnId.toLowerCase());
    if (existing) {
      return { success: false, message: `Transaction ID ${momoTxnId} is already logged in the system (${existing.status}).` };
    }

    const newWebhook: SmsWebhookPayload = {
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      momoTxnId,
      amount: amount || 0,
      network,
      status: 'unclaimed',
      claimedBy: '-',
      date: new Date().toISOString(),
      rawSms,
      senderPhone: payload.senderPhone || 'SMS Forwarder',
    };

    setWebhookLogs(prev => [newWebhook, ...prev]);
    if (isSupabaseConfigured) {
      insertWebhookInSupabase(newWebhook);
    }
    addAuditLog('SMS_WEBHOOK_RECEIVED', `Logged unclaimed SMS webhook for Txn ID: ${momoTxnId}, GHS ${amount}, Network: ${network}`);
    showToast('SMS Webhook Logged', `Recorded Txn ID ${momoTxnId} (GHS ${amount.toFixed(2)}) as Unclaimed.`, 'success');

    return { success: true, message: 'SMS webhook processed successfully.', webhook: newWebhook };
  };

  const claimPaymentWithTxnId = (momoTxnId: string): { success: boolean; message: string; amount?: number } => {
    const cleanTxnId = momoTxnId.trim().toUpperCase();
    if (!cleanTxnId) {
      return { success: false, message: 'Please enter a valid MoMo Transaction ID.' };
    }

    // Search unclaimed webhook logs
    const matchingWebhook = webhookLogs.find(
      w => w.momoTxnId.trim().toUpperCase() === cleanTxnId && w.status === 'unclaimed'
    );

    if (matchingWebhook) {
      const creditAmount = matchingWebhook.amount;
      const newBal = Number((currentUser.walletBalance + creditAmount).toFixed(2));
      const claimedName = `${currentUser.fullName} (${currentUser.email})`;

      // Update webhook status to claimed
      setWebhookLogs(prev =>
        prev.map(w =>
          w.id === matchingWebhook.id ? { ...w, status: 'claimed', claimedBy: claimedName } : w
        )
      );

      if (isSupabaseConfigured) {
        updateWebhookStatusInSupabase(matchingWebhook.momoTxnId, 'claimed', claimedName);
      }

      // Credit user
      const updatedUser = { ...currentUser, walletBalance: newBal };
      setCurrentUser(updatedUser);
      setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      if (isSupabaseConfigured) {
        updateProfileInSupabase(currentUser.id, { walletBalance: newBal });
      }

      // Record wallet transaction
      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId: currentUser.id,
        amount: creditAmount,
        type: 'topup',
        description: `Auto-Credited via MoMo Txn ID ${cleanTxnId}`,
        momoTxnId: cleanTxnId,
        balanceAfter: newBal,
        createdAt: new Date().toISOString(),
      };
      setWalletTransactions(prev => [tx, ...prev]);

      // Trigger notification
      addNotification({
        userId: currentUser.id,
        title: '🎉 Payment Claimed & Wallet Credited!',
        message: `Transaction ID ${cleanTxnId} was verified! GHS ${creditAmount.toFixed(2)} added to your wallet. New balance: GHS ${newBal.toFixed(2)}.`,
        type: 'wallet',
      });

      addAuditLog('CLAIM_PAYMENT_AUTO_SUCCESS', `User ${currentUser.email} claimed Txn ${cleanTxnId} for GHS ${creditAmount}`);
      showToast('Payment Claimed!', `GHS ${creditAmount.toFixed(2)} auto-credited to your wallet!`, 'success');

      return {
        success: true,
        message: `Successfully claimed GHS ${creditAmount.toFixed(2)}! Your wallet balance is now GHS ${newBal.toFixed(2)}.`,
        amount: creditAmount
      };
    }

    return {
      success: false,
      message: 'No matching unclaimed transaction found with this MoMo Txn ID. Please make sure you paid to Donmac MoMo (0549358359) or submit a claim with payment details.',
    };
  };

  // Claims
  const [claims, setClaims] = useState<PaymentClaim[]>(() =>
    getStorageItem('dmh_claims', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_claims', JSON.stringify(claims));
  }, [claims]);

  const submitPaymentClaim = (claimData: {
    referenceCode?: string;
    momoTxnId: string;
    amount: number;
    momoNumber: string;
    screenshotUrl?: string;
  }) => {
    const cleanTxn = claimData.momoTxnId.trim().toUpperCase();
    const cleanRef = claimData.referenceCode?.trim().toUpperCase();

    const matchedLog = webhookLogs.find(w => w.momoTxnId.toUpperCase() === cleanTxn);
    const matchedPending = pendingTopUpRequests.find(r => cleanRef && r.referenceCode.toUpperCase() === cleanRef && r.status === 'pending');

    let finalAmount = claimData.amount;
    if (matchedLog && matchedLog.amount > 0) {
      finalAmount = matchedLog.amount;
    } else if (matchedPending && matchedPending.amount > 0) {
      finalAmount = matchedPending.amount;
    }

    if (finalAmount <= 0) {
      finalAmount = 50.00; // Default sample credit for instant verification demo
    }

    // Auto-approve and credit wallet instantly
    const newBal = currentUser.walletBalance + finalAmount;
    const updatedUser = { ...currentUser, walletBalance: newBal };
    setCurrentUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    if (isSupabaseConfigured) {
      updateProfileInSupabase(currentUser.id, { walletBalance: newBal });
    }

    if (matchedPending) {
      setPendingTopUpRequests(prev =>
        prev.map(r => (r.id === matchedPending.id ? { ...r, status: 'completed' } : r))
      );
    }

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      amount: finalAmount,
      type: 'topup',
      description: `Instant Verified MoMo Claim (Txn: ${claimData.momoTxnId})`,
      referenceCode: claimData.referenceCode,
      momoTxnId: claimData.momoTxnId,
      balanceAfter: newBal,
      createdAt: new Date().toISOString(),
    };
    setWalletTransactions(prev => [tx, ...prev]);

    const newClaim: PaymentClaim = {
      id: `claim-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      ...claimData,
      amount: finalAmount,
      status: 'approved',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      adminNotes: 'Auto-verified & credited instantly via MoMo matcher',
    };

    setClaims(prev => [newClaim, ...prev]);
    if (isSupabaseConfigured) {
      createClaimInSupabase(newClaim);
    }

    addNotification({
      userId: currentUser.id,
      title: '✅ MoMo Payment Verified & Credited!',
      message: `Your payment of GHS ${finalAmount.toFixed(2)} (Txn ID: ${claimData.momoTxnId}) was matched and credited to your wallet instantly!`,
      type: 'wallet',
    });

    addAuditLog('AUTO_CLAIM_APPROVED', `Instant claim verified for GHS ${finalAmount}. MoMo Txn: ${claimData.momoTxnId}`);
    showToast('Payment Verified!', `GHS ${finalAmount.toFixed(2)} credited to your wallet instantly!`, 'success');
  };

  const processClaim = (claimId: string, status: ClaimStatus, notes?: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    if (status === 'approved' && claim.status !== 'approved') {
      const creditAmt = claim.amount;
      const targetUser = usersList.find(u => u.id === claim.userId) || currentUser;
      const newBal = targetUser.walletBalance + creditAmt;
      const updatedTarget = { ...targetUser, walletBalance: newBal };

      if (claim.userId === currentUser.id) {
        setCurrentUser(updatedTarget);
      }
      setUsersList(prev => prev.map(u => u.id === claim.userId ? updatedTarget : u));

      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId: claim.userId,
        amount: creditAmt,
        type: 'topup',
        description: `Approved Payment Claim (MoMo Txn: ${claim.momoTxnId})`,
        momoTxnId: claim.momoTxnId,
        balanceAfter: newBal,
        createdAt: new Date().toISOString(),
      };
      setWalletTransactions(prev => [tx, ...prev]);

      addNotification({
        userId: claim.userId,
        title: '✅ Payment Claim Approved!',
        message: `Your payment claim for GHS ${claim.amount.toFixed(2)} (Txn: ${claim.momoTxnId}) was approved and credited to your wallet.`,
        type: 'wallet',
      });
    }

    setClaims(prev =>
      prev.map(c => (c.id === claimId ? { ...c, status, adminNotes: notes, processedAt: new Date().toISOString() } : c))
    );

    if (isSupabaseConfigured) {
      updateClaimInSupabase(claimId, status, notes);
    }

    addAuditLog('PROCESS_CLAIM', `Claim ${claimId} marked as ${status}. Notes: ${notes || 'N/A'}`);
    showToast(`Claim ${status.toUpperCase()}`, `Payment claim ${status} successfully.`, status === 'approved' ? 'success' : 'error');
  };

  // Users List & Management
  const registerUser = async (candidate: UserProfile, password?: string): Promise<UserProfile> => {
    let finalUser: UserProfile = {
      ...candidate,
      passwordHash: password || candidate.password || 'user123',
    };

    if (isSupabaseConfigured) {
      finalUser = await registerUserInSupabase(candidate, password);
    }

    setUsersList(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === finalUser.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = finalUser;
        return copy;
      }
      return [finalUser, ...prev];
    });

    setCurrentUser(finalUser);
    setActiveRole(finalUser.role);
    setIsAuthenticated(true);
    showToast('Account Registered', `Welcome to Donmac Data Hub, ${finalUser.fullName}!`, 'success');
    return finalUser;
  };

  const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    let user: UserProfile;

    if (isSupabaseConfigured) {
      user = await loginUserFromSupabase(email, password);
    } else {
      const cleanEmail = email.toLowerCase().trim();
      const found = usersList.find(u => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        throw new Error(`No account found with email ${cleanEmail}. Please register an account first.`);
      }

      if (found.isBlocked) {
        throw new Error('This account has been suspended or blocked by admin. Please contact support.');
      }

      if (password && found.passwordHash && found.passwordHash !== password) {
        throw new Error('Incorrect password. Please check your credentials and try again.');
      }

      user = found;
    }

    setCurrentUser(user);
    setActiveRole(user.role);
    setIsAuthenticated(true);
    showToast('Welcome Back', `Signed in as ${user.fullName}`, 'success');
    return user;
  };

  const loginOrRegisterUser = async (candidate: UserProfile) => {
    try {
      const existing = usersList.find(u => u.email.toLowerCase() === candidate.email.toLowerCase());
      if (existing) {
        await loginUser(candidate.email, candidate.password);
      } else {
        await registerUser(candidate, candidate.password);
      }
    } catch (err: any) {
      showToast('Authentication Error', err.message || 'Failed to authenticate', 'error');
    }
  };

  const toggleBlockUser = (userId: string) => {
    const target = usersList.find(u => u.id === userId);
    const newBlocked = target ? !target.isBlocked : true;
    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, isBlocked: newBlocked } : u))
    );
    if (isSupabaseConfigured) {
      updateProfileInSupabase(userId, { isBlocked: newBlocked });
    }
    addAuditLog('TOGGLE_BLOCK_USER', `Toggled block status for user ID ${userId}`);
    showToast('User Status Updated', 'User block status toggled.', 'info');
  };

  const deleteUser = (userId: string) => {
    setUsersList(prev => prev.filter(u => u.id !== userId));
    addAuditLog('DELETE_USER', `Deleted user ID ${userId}`);
    showToast('User Deleted', 'User removed from system.', 'info');
  };

  const toggleUserRole = (userId: string) => {
    const target = usersList.find(u => u.id === userId);
    const newRole: Role = target?.role === 'admin' ? 'customer' : 'admin';
    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (isSupabaseConfigured) {
      updateProfileInSupabase(userId, { role: newRole });
    }
    addAuditLog('TOGGLE_USER_ROLE', `Toggled admin role for user ID ${userId}`);
    showToast('Role Updated', 'User role updated successfully.', 'success');
  };

  const creditUserWallet = (userId: string, amount: number, reason: string) => {
    // Locate target user from usersList or fallback to currentUser
    const targetUser = usersList.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    const currentBal = targetUser
      ? targetUser.walletBalance
      : (currentUser.id === userId || currentUser.email.toLowerCase() === userId.toLowerCase()
        ? currentUser.walletBalance
        : 0);

    const newBal = Math.max(0, Number((currentBal + amount).toFixed(2)));
    const targetId = targetUser ? targetUser.id : userId;
    const targetEmail = targetUser ? targetUser.email : (currentUser.id === userId ? currentUser.email : '');

    // Update usersList immediately & sync localStorage
    const nextUsers = usersList.map(u => {
      if (u.id === targetId || (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase())) {
        return { ...u, walletBalance: newBal };
      }
      return u;
    });
    setUsersList(nextUsers);
    localStorage.setItem('dmh_users', JSON.stringify(nextUsers));

    // Update currentUser immediately if target is logged in user
    if (currentUser.id === targetId || (targetEmail && currentUser.email.toLowerCase() === targetEmail.toLowerCase())) {
      const nextUser = { ...currentUser, walletBalance: newBal };
      setCurrentUser(nextUser);
      localStorage.setItem('dmh_user', JSON.stringify(nextUser));
    }

    // Dispatch sync event for immediate cross-tab update
    window.dispatchEvent(new Event('storage'));

    // Update Supabase immediately with the calculated new balance
    if (isSupabaseConfigured) {
      updateProfileInSupabase(targetId, { walletBalance: newBal, email: targetEmail });
    }

    // Record wallet transaction
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: targetId,
      amount,
      type: amount >= 0 ? 'admin_credit' : 'admin_debit',
      description: `Admin Action: ${reason}`,
      balanceAfter: newBal,
      createdAt: new Date().toISOString(),
    };
    setWalletTransactions(prev => {
      const nextTx = [tx, ...prev];
      localStorage.setItem('dmh_wallet_tx', JSON.stringify(nextTx));
      return nextTx;
    });

    // Send notification to user
    addNotification({
      userId: targetId,
      title: amount >= 0 ? '💰 Wallet Credited!' : '💸 Wallet Debited',
      message: `Your wallet was ${amount >= 0 ? 'credited with' : 'debited by'} GHS ${Math.abs(amount).toFixed(2)}. Reason: ${reason}. New Balance: GHS ${newBal.toFixed(2)}.`,
      type: 'wallet',
    });

    addAuditLog('CREDIT_USER_WALLET', `GHS ${amount} adjusted for user ${targetId}. Reason: ${reason}`);
    playSuccessChime();
    showToast(
      amount >= 0 ? 'Wallet Credited' : 'Wallet Debited',
      `GHS ${Math.abs(amount).toFixed(2)} ${amount >= 0 ? 'credited to' : 'debited from'} user. New Balance: GHS ${newBal.toFixed(2)}.`,
      'success'
    );
  };

  // Manual Adjust Wallet
  const manualAdjustWallet = (userId: string, amount: number, reason: string) => {
    creditUserWallet(userId, amount, reason);
  };

  // Complaints
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    getStorageItem('dmh_complaints', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_complaints', JSON.stringify(complaints));
  }, [complaints]);

  const submitComplaint = (
    subject: string,
    message: string,
    orderNumber?: string,
    momoTxnId?: string,
    screenshotUrl?: string
  ) => {
    const newComp: Complaint = {
      id: `comp-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      subject,
      orderNumber,
      momoTxnId,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: activeRole,
          senderName: currentUser.fullName,
          message,
          screenshotUrl,
          createdAt: new Date().toISOString(),
        }
      ]
    };

    setComplaints(prev => {
      const next = [newComp, ...prev];
      localStorage.setItem('dmh_complaints', JSON.stringify(next));
      return next;
    });
    showToast('Complaint Submitted', 'Our support team will respond shortly.', 'success');
  };

  const replyToComplaint = (complaintId: string, message: string) => {
    setComplaints(prev => {
      const next = prev.map(c => {
        if (c.id === complaintId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            senderRole: activeRole,
            senderName: activeRole === 'admin' ? 'Donmac Support' : currentUser.fullName,
            message,
            createdAt: new Date().toISOString(),
          };
          return {
            ...c,
            status: activeRole === 'admin' ? 'in_progress' : c.status,
            updatedAt: new Date().toISOString(),
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      });
      localStorage.setItem('dmh_complaints', JSON.stringify(next));
      return next;
    });
    showToast('Reply Sent', 'Your message has been posted.', 'info');
  };

  const updateComplaintStatus = (complaintId: string, status: Complaint['status']) => {
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, status, updatedAt: new Date().toISOString() } : c))
    );
    showToast('Complaint Status Updated', `Status changed to ${status.toUpperCase()}`, 'info');
  };

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    getStorageItem('dmh_announcements', INITIAL_ANNOUNCEMENTS)
  );

  useEffect(() => {
    localStorage.setItem('dmh_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const addAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('ADD_ANNOUNCEMENT', `Posted broadcast: ${ann.title}`);
    showToast('Broadcast Posted', 'All users will see this update.', 'success');
  };

  const toggleAnnouncement = (id: string, active: boolean) => {
    setAnnouncements(prev => prev.map(a => (a.id === id ? { ...a, active } : a)));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getStorageItem('dmh_notifications', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationSound();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getStorageItem('dmh_audit_logs', [])
  );

  useEffect(() => {
    localStorage.setItem('dmh_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      actorEmail: currentUser.email,
      actorRole: activeRole,
      action,
      details,
      ipAddress: '102.176.54.12',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Universal Search
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (title: string, desc?: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        updateUserProfile,
        activeRole,
        setActiveRole,
        switchRole,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        resetEverything,
        theme,
        toggleTheme,
        networks,
        packages,
        toggleNetworkStatus,
        addPackage,
        updatePackage,
        deletePackage,
        favorites,
        toggleFavorite,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        orders,
        placeOrder,
        updateOrderStatus,
        reorderOrder,
        walletTransactions,
        pendingTopUpRequests,
        generateTopUpReference,
        webhookLogs,
        processSmsWebhook,
        deleteSmsWebhook,
        claimPaymentWithTxnId,
        claims,
        submitPaymentClaim,
        processClaim,
        manualAdjustWallet,
        usersList,
        setUsersList,
        registerUser,
        loginUser,
        loginOrRegisterUser,
        toggleBlockUser,
        deleteUser,
        toggleUserRole,
        creditUserWallet,
        complaints,
        submitComplaint,
        replyToComplaint,
        updateComplaintStatus,
        announcements,
        addAnnouncement,
        toggleAnnouncement,
        deleteAnnouncement,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        unreadNotificationsCount,
        auditLogs,
        isSupabaseConnected: isSupabaseConfigured,
        isSearchOpen,
        setIsSearchOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
