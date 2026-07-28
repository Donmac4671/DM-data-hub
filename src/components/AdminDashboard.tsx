import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkId, DataPackage, ClaimStatus, OrderStatus, UserProfile } from '../types';
import { renderStatusBadge } from '../utils/statusHelper';
import { OrderFilterBar, OrderFiltersState, filterOrders } from './OrderFilterBar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  ShieldAlert,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Users,
  Wifi,
  Radio,
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Download,
  Zap,
  Clock,
  Search,
  MessageSquare,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Send,
  Headphones,
  FileCheck,
  RefreshCcw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    claims,
    processClaim,
    webhookLogs,
    packages,
    addPackage,
    updatePackage,
    deletePackage,
    networks,
    toggleNetworkStatus,
    announcements,
    addAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    auditLogs,
    manualAdjustWallet,
    updateOrderStatus,
    complaints,
    replyToComplaint,
    deleteComplaint,
    usersList,
    toggleBlockUser,
    deleteUser,
    toggleUserRole,
    creditUserWallet,
    deleteSmsWebhook,
    processSmsWebhook,
    refreshWebhookLogs,
    showToast,
    isSupabaseConnected,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'analytics' | 'orders' | 'claims' | 'packages' | 'networks' | 'users' | 'webhooks' | 'announcements' | 'complaints' | 'audit'
  >(() => (localStorage.getItem('dmh_admin_tab') as any) || 'analytics');

  // Add this after the activeAdminTab state
useEffect(() => {
  if (activeAdminTab === 'webhooks') {
    // Refresh webhook logs every 5 seconds when on webhooks tab
    const interval = setInterval(() => {
      refreshWebhookLogs();
    }, 5000);

    // Also refresh immediately when tab is opened
    refreshWebhookLogs();

    return () => clearInterval(interval);
  }
}, [activeAdminTab, refreshWebhookLogs]);

  useEffect(() => {
    localStorage.setItem('dmh_admin_tab', activeAdminTab);
  }, [activeAdminTab]);

  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      tabsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsContainerRef.current) {
      if (e.deltaY !== 0) {
        tabsContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [adminOrderFilters, setAdminOrderFilters] = useState<OrderFiltersState>({
    searchQuery: '',
    statusFilter: 'all',
    networkFilter: 'all',
    startDate: '',
    endDate: '',
  });

  const filteredAdminOrders = filterOrders(orders, adminOrderFilters);

  // Analytics Calculations
  const userCount = usersList.length;
  const totalWalletBalance = usersList.reduce((sum, u) => sum + u.walletBalance, 0);
  const totalTopUpsCount = webhookLogs.filter(w => w.status === 'processed').length + claims.filter(c => c.status === 'approved' || c.status === 'claimed').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'waiting').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats: Record<string, { Revenue: number; Orders: number }> = {
    Mon: { Revenue: 0, Orders: 0 },
    Tue: { Revenue: 0, Orders: 0 },
    Wed: { Revenue: 0, Orders: 0 },
    Thu: { Revenue: 0, Orders: 0 },
    Fri: { Revenue: 0, Orders: 0 },
    Sat: { Revenue: 0, Orders: 0 },
    Sun: { Revenue: 0, Orders: 0 },
  };

  orders.forEach(o => {
    try {
      const d = new Date(o.createdAt);
      if (!isNaN(d.getTime())) {
        const dayName = daysOfWeek[d.getDay()];
        if (dayStats[dayName]) {
          dayStats[dayName].Revenue += o.totalAmount || 0;
          dayStats[dayName].Orders += 1;
        }
      }
    } catch (e) {}
  });

  const chartData = [
    { name: 'Mon', Revenue: Number(dayStats.Mon.Revenue.toFixed(2)), Orders: dayStats.Mon.Orders },
    { name: 'Tue', Revenue: Number(dayStats.Tue.Revenue.toFixed(2)), Orders: dayStats.Tue.Orders },
    { name: 'Wed', Revenue: Number(dayStats.Wed.Revenue.toFixed(2)), Orders: dayStats.Wed.Orders },
    { name: 'Thu', Revenue: Number(dayStats.Thu.Revenue.toFixed(2)), Orders: dayStats.Thu.Orders },
    { name: 'Fri', Revenue: Number(dayStats.Fri.Revenue.toFixed(2)), Orders: dayStats.Fri.Orders },
    { name: 'Sat', Revenue: Number(dayStats.Sat.Revenue.toFixed(2)), Orders: dayStats.Sat.Orders },
    { name: 'Sun', Revenue: Number(dayStats.Sun.Revenue.toFixed(2)), Orders: dayStats.Sun.Orders },
  ];

  // Package Form State
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgNetwork, setPkgNetwork] = useState<NetworkId>('mtn');
  const [pkgData, setPkgData] = useState('1 GB');
  const [pkgPrice, setPkgPrice] = useState<number>(10);
  const [pkgValidity, setPkgValidity] = useState('Non-Expiry');

  // Credit Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<UserProfile | null>(null);
  const [creditAmountInput, setCreditAmountInput] = useState<number>(20);
  const [creditReasonInput, setCreditReasonInput] = useState('Admin Promo Credit');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'urgent' | 'success'>('info');

  // SMS Webhook Simulator State
  const [showSmsSimulator, setShowSmsSimulator] = useState(false);
  const [simTxnId, setSimTxnId] = useState('');
  const [simAmount, setSimAmount] = useState('');
  const [simReferenceCode, setSimReferenceCode] = useState('');
  const [simNetwork, setSimNetwork] = useState<'MTN' | 'Telecel' | 'AirtelTigo'>('MTN');
  const [simRawSms, setSimRawSms] = useState('');

  // Complaint Reply State
  const [replyTextMap, setReplyTextMap] = useState<{ [key: string]: string }>({});

  const openAddPackage = () => {
    setEditingPkgId(null);
    setPkgName('');
    setPkgNetwork('mtn');
    setPkgData('1 GB');
    setPkgPrice(10);
    setPkgValidity('Non-Expiry');
    setShowPkgModal(true);
  };

  const openEditPackage = (pkg: DataPackage) => {
    setEditingPkgId(pkg.id);
    setPkgName(pkg.name);
    setPkgNetwork(pkg.network);
    setPkgData(pkg.dataAmount);
    setPkgPrice(pkg.price);
    setPkgValidity(pkg.validity);
    setShowPkgModal(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkgId) {
      updatePackage(editingPkgId, {
        name: pkgName,
        network: pkgNetwork,
        dataAmount: pkgData,
        price: pkgPrice,
        validity: pkgValidity,
      });
    } else {
      addPackage({
        name: pkgName,
        network: pkgNetwork,
        dataAmount: pkgData,
        price: pkgPrice,
        validity: pkgValidity,
        status: 'online',
        sortOrder: packages.length + 1,
      });
    }
    setShowPkgModal(false);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement({
      title: annTitle,
      content: annContent,
      type: annType,
      active: true,
    });
    setAnnTitle('');
    setAnnContent('');
  };

  const handleSendComplaintReply = (complaintId: string) => {
    const text = replyTextMap[complaintId];
    if (!text || !text.trim()) return;
    replyToComplaint(complaintId, text.trim());
    setReplyTextMap(prev => ({ ...prev, [complaintId]: '' }));
  };

  const exportOrdersCSV = () => {
    const generatedAt = new Date().toLocaleString('en-GB', { timeZone: 'GMT' });
    const reportDate = new Date().toISOString().split('T')[0];

    let content = `=================================================================================\n`;
    content += `DONMAC DATA HUB GHANA - DETAILED EXECUTIVE ORDERS REPORT\n`;
    content += `Generated Date: ${generatedAt} GMT\n`;
    content += `Filter Scope: ${adminOrderFilters.startDate || reportDate} to ${adminOrderFilters.endDate || reportDate}\n`;
    content += `Total Orders Exported: ${filteredAdminOrders.length}\n`;
    content += `Total Order Revenue: GHS ${filteredAdminOrders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)}\n`;
    content += `=================================================================================\n\n`;

    content += `"Order Number","Customer Name","Customer Email","Recipient Phone","Network","Data Package","Amount (GHS)","Status","Failure Reason","Date & Time"\n`;

    filteredAdminOrders.forEach(ord => {
      ord.items.forEach(item => {
        const formattedDate = new Date(ord.createdAt).toLocaleString('en-GB', { timeZone: 'GMT' });
        const cleanName = `"${(ord.userName || 'Customer').replace(/"/g, '""')}"`;
        const cleanEmail = `"${ord.userEmail.replace(/"/g, '""')}"`;
        const cleanPkg = `"${item.packageName.replace(/"/g, '""')}"`;
        const cleanReason = `"${(ord.failureReason || '').replace(/"/g, '""')}"`;

        content += `"${ord.orderNumber}",${cleanName},${cleanEmail},"${item.recipientPhone}","${item.network.toUpperCase()}",${cleanPkg},"${item.price.toFixed(2)}","${ord.status.toUpperCase()}",${cleanReason},"${formattedDate}"\n`;
      });
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Donmac_Orders_Report_${reportDate}.csv`;
    a.click();
    showToast('Report Generated', 'Professional CSV orders report downloaded successfully.', 'success');
  };

  const exportDailyReportCSV = () => {
    const generatedAt = new Date().toLocaleString('en-GB', { timeZone: 'GMT' });
    const todayStr = new Date().toISOString().split('T')[0];

    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'waiting');
    const failedOrders = orders.filter(o => o.status === 'failed');

    let content = `=================================================================================\n`;
    content += `DONMAC DATA HUB GHANA - DAILY SYSTEM & FINANCIAL SUMMARY REPORT\n`;
    content += `Report Date: ${todayStr}\n`;
    content += `Generated Time: ${generatedAt} GMT\n`;
    content += `=================================================================================\n\n`;

    content += `--- EXECUTIVE FINANCIAL METRICS ---\n`;
    content += `Total Registered Users: ${userCount}\n`;
    content += `Total System Revenue: GHS ${totalRevenue.toFixed(2)}\n`;
    content += `Total User Wallet Balances: GHS ${totalWalletBalance.toFixed(2)}\n`;
    content += `Total Orders Processed: ${orders.length}\n`;
    content += `  - Completed/Delivered Orders: ${completedOrders.length}\n`;
    content += `  - Pending/Processing Orders: ${pendingOrders.length}\n`;
    content += `  - Failed Orders: ${failedOrders.length}\n`;
    content += `Total Verified Top-Ups: ${webhookLogs.length}\n\n`;

    content += `--- NETWORK BREAKDOWN ---\n`;
    const mtnCount = orders.filter(o => o.items.some(i => i.network === 'mtn')).length;
    const telecelCount = orders.filter(o => o.items.some(i => i.network === 'telecel')).length;
    const atCount = orders.filter(o => o.items.some(i => i.network.includes('airteltigo') || i.network === 'at')).length;

    content += `MTN Ghana Orders: ${mtnCount}\n`;
    content += `Telecel Ghana Orders: ${telecelCount}\n`;
    content += `AT / AirtelTigo Ghana Orders: ${atCount}\n\n`;

    content += `"Metric","Value","Notes"\n`;
    content += `"Total Users","${userCount}","Active customer accounts"\n`;
    content += `"Total Revenue (GHS)","${totalRevenue.toFixed(2)}","Gross transaction volume"\n`;
    content += `"Wallet Balance Pool (GHS)","${totalWalletBalance.toFixed(2)}","Outstanding customer liabilities"\n`;
    content += `"Total Orders","${orders.length}","All order statuses"\n`;
    content += `"Completed Orders","${completedOrders.length}","Successfully dispatched"\n`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Donmac_Daily_Executive_Report_${todayStr}.csv`;
    a.click();
    showToast('Daily Summary Exported', 'Professional daily report downloaded successfully.', 'success');
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    return renderStatusBadge(status);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Admin Top Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-full border border-rose-500">
              ADMINISTRATOR CONTROL PANEL
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isSupabaseConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isSupabaseConnected ? 'Supabase Connected' : 'Supabase Disconnected / Local Mode'}
            </span>
          </div>
          <h2 className="text-2xl font-black mt-2">donmacdatahub@gmail.com</h2>
          <p className="text-xs text-slate-400 mt-1">
            System control center, user claims approval, package catalog, announcements, and complaints.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportDailyReportCSV}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Daily Report</span>
          </button>
          <button
            onClick={exportOrdersCSV}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs with Windows Scroll Buttons and Smooth Mouse Wheel Navigation */}
      <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm space-x-1">
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors shadow-sm bg-slate-50 dark:bg-slate-800/50"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={tabsContainerRef}
          onWheel={handleTabsWheel}
          className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1 px-1 text-xs font-bold w-full scroll-smooth select-none cursor-grab active:cursor-grabbing"
        >
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'users', label: `Users (${usersList.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'claims', label: `Claims (${claims.filter(c => c.status === 'pending').length})` },
            { id: 'packages', label: 'Package Catalog' },
            { id: 'announcements', label: 'Announcements' },
            { id: 'complaints', label: `Complaints (${complaints.filter(c => c.status === 'open' || c.status === 'in_progress').length})` },
            { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
            { id: 'networks', label: 'Networks Mode' },
            { id: 'webhooks', label: `SMS Webhooks & Claims (${webhookLogs.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all uppercase tracking-wider text-[11px] font-black shrink-0 ${
                activeAdminTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors shadow-sm bg-slate-50 dark:bg-slate-800/50"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">Total Users</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{userCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">User Wallet Total</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₵ {totalWalletBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">Total Top-Ups</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{totalTopUpsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">Total Revenue</span>
              <p className="text-2xl font-black text-rose-600 mt-1">₵ {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">Pending Orders</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{pendingOrdersCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-black uppercase">Delivered Orders</span>
              <p className="text-2xl font-black text-emerald-500 mt-1">{deliveredOrdersCount}</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">Revenue & Order Trends</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="Revenue" fill="#e11d48" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS TAB */}
      {activeAdminTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">User Account Management</h3>
              <p className="text-xs text-slate-500">View users, credit/debit balances, block/unblock, toggle roles, or delete users.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black text-[10px] tracking-wider">
                  <th className="py-3 px-2">User Details</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Wallet Balance</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email} • {u.phoneNumber}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₵ {u.walletBalance.toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      {u.isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-600 border border-rose-500/30 uppercase">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedUserForCredit(u);
                          setShowCreditModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] rounded uppercase tracking-wider"
                      >
                        Credit/Debit
                      </button>

                      <button
                        onClick={() => toggleUserRole(u.id)}
                        className="px-2.5 py-1 bg-blue-600 text-white font-black text-[10px] rounded uppercase tracking-wider"
                      >
                        Role
                      </button>

                      <button
                        onClick={() => toggleBlockUser(u.id)}
                        className={`px-2.5 py-1 font-black text-[10px] rounded uppercase tracking-wider ${
                          u.isBlocked ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>

                      <button
                        onClick={() => deleteUser(u.id)}
                        className="px-2 py-1 bg-rose-600/20 text-rose-600 hover:bg-rose-600 hover:text-white font-black text-[10px] rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">All Customer Orders</h3>
              <p className="text-xs text-slate-500">Filter orders by phone, status, network, or date range.</p>
            </div>
            <button
              onClick={exportOrdersCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 transition-colors shrink-0"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filter Bar */}
          <OrderFilterBar
            filters={adminOrderFilters}
            onFilterChange={updated => setAdminOrderFilters(prev => ({ ...prev, ...updated }))}
            onReset={() =>
              setAdminOrderFilters({
                searchQuery: '',
                statusFilter: 'all',
                networkFilter: 'all',
                startDate: '',
                endDate: '',
              })
            }
            totalResultsCount={filteredAdminOrders.length}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black text-[10px]">
                  <th className="py-3 px-2">Order #</th>
                  <th className="py-3 px-2">User Email</th>
                  <th className="py-3 px-2">Items & Recipient</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAdminOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold uppercase text-xs">
                      No matching orders found
                    </td>
                  </tr>
                ) : (
                  filteredAdminOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-2 font-black font-mono">{o.orderNumber}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300 font-bold">{o.userEmail}</td>
                      <td className="py-3 px-2">
                        {o.items.map(i => `${i.packageName} (${i.recipientPhone})`).join(', ')}
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900 dark:text-white">₵ {o.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-2">
                        {getOrderStatusBadge(o.status)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <select
                          value={o.status}
                          onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold rounded uppercase focus:outline-none cursor-pointer"
                        >
                          <option value="waiting">Waiting (Grey)</option>
                          <option value="pending">Pending (Yellow)</option>
                          <option value="processing">Processing (Blue)</option>
                          <option value="delivered">Delivered (Green)</option>
                          <option value="failed">Failed (Red)</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFIED TRANSACTION IDS / CLAIMS */}
      {activeAdminTab === 'claims' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Verified Transaction IDs & Claims</h3>
          <p className="text-xs text-slate-500">All payment claims and webhook auto-extracted payment records.</p>

          <div className="space-y-3">
            {claims.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    User: {c.userName} ({c.userEmail})
                  </p>
                  <p className="font-mono text-amber-500 font-bold mt-0.5">MoMo Txn ID: {c.momoTxnId}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Sender Phone: {c.momoNumber} • Amount: <strong>GHS {c.amount.toFixed(2)}</strong>
                  </p>
                </div>

                {c.status === 'pending' ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => processClaim(c.id, 'claimed', 'Verified by Admin')}
                      className="px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-wider"
                    >
                      Claim & Auto-Credit
                    </button>
                    <button
                      onClick={() => processClaim(c.id, 'rejected', 'Invalid Transaction ID')}
                      className="px-4 py-2 bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="font-black uppercase text-xs px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {c.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PACKAGE MANAGEMENT */}
      {activeAdminTab === 'packages' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Package Catalog Management</h3>
            <button
              onClick={openAddPackage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(p => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm uppercase">{p.name}</span>
                  <button
                    onClick={() => {
                      const nextStatus = p.status === 'online' ? 'offline' : p.status === 'offline' ? 'hidden' : 'online';
                      updatePackage(p.id, { status: nextStatus });
                    }}
                    className={`text-[10px] font-black px-2.5 py-1 rounded flex items-center space-x-1 uppercase tracking-wider ${
                      p.status === 'hidden' ? 'bg-rose-500/20 text-rose-500' : p.status === 'offline' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                    }`}
                  >
                    {p.status === 'hidden' ? <EyeOff className="w-3 h-3" /> : p.status === 'offline' ? <Zap className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{p.status.toUpperCase()}</span>
                  </button>
                </div>
                <p className="text-xs font-mono font-black text-slate-900 dark:text-white">₵ {p.price.toFixed(2)}</p>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openEditPackage(p)}
                    className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deletePackage(p.id)}
                    className="p-1.5 bg-rose-500/20 text-rose-500 rounded-lg text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS TAB */}
      {activeAdminTab === 'announcements' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Broadcast Announcements</h3>

          <form onSubmit={handleCreateAnnouncement} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase">Publish New Announcement Banner</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Announcement Title"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border text-xs font-bold rounded-xl"
                />
              </div>
              <div>
                <select
                  value={annType}
                  onChange={e => setAnnType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border text-xs font-bold rounded-xl"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="urgent">Urgent (Red)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>
            </div>
            <textarea
              required
              rows={2}
              placeholder="Content message..."
              value={annContent}
              onChange={e => setAnnContent(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-900 border text-xs rounded-xl"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider"
            >
              Publish Broadcast
            </button>
          </form>

          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{ann.title}</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                      {ann.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ann.content}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAnnouncement(ann.id, !ann.active)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded ${
                      ann.active ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                    }`}
                  >
                    {ann.active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-1.5 bg-rose-500/20 text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: COMPLAINTS TAB */}
      {activeAdminTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Support Complaints & Tickets</h3>
          <div className="space-y-4">
            {complaints.map(comp => (
              <div key={comp.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white">{comp.subject}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-600">
                    {comp.status}
                  </span>
                </div>
                <p className="text-slate-500">From: <strong>{comp.userName}</strong> ({comp.userEmail})</p>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {comp.messages.map(m => (
                    <div key={m.id} className={`p-3 rounded-xl ${m.senderRole === 'admin' ? 'bg-blue-600/10 text-blue-900 dark:text-blue-100 ml-4' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <p className="font-bold text-[10px] text-slate-500">{m.senderName}:</p>
                      <p className="mt-0.5">{m.message}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type reply to customer..."
                      value={replyTextMap[comp.id] || ''}
                      onChange={e => setReplyTextMap({ ...replyTextMap, [comp.id]: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border text-xs rounded-xl"
                    />
                    <button
                      onClick={() => handleSendComplaintReply(comp.id)}
                      className="px-4 py-2 bg-blue-600 text-white font-black text-xs rounded-xl uppercase tracking-wider flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <select
                      value={comp.status}
                      onChange={e => updateComplaintStatus(comp.id, e.target.value as any)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-black rounded-lg uppercase tracking-wider"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed / End Chat</option>
                    </select>

                    <button
                      onClick={() => deleteComplaint(comp.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Delete Complaint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT LOGS */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Audit Logs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Recent system actions and administrative events across the platform.</p>
            </div>
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{auditLogs.length} events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-2">When</th>
                  <th className="py-3 px-2">Actor</th>
                  <th className="py-3 px-2">Action</th>
                  <th className="py-3 px-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-2 text-[11px] text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-2 text-[11px] text-slate-700 dark:text-slate-300">{log.actorEmail || log.actorRole}</td>
                    <td className="py-3 px-2 text-[11px] uppercase font-black">{log.action.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-2 text-[11px] text-slate-500 dark:text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: NETWORKS MODE */}
      {activeAdminTab === 'networks' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">Network Availability Control</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {networks.map(net => (
              <div key={net.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm uppercase">{net.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{net.noticeMessage || 'Normal Operations'}</p>
                </div>
                <button
                  onClick={() => toggleNetworkStatus(net.id, !net.online)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
                    net.online ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {net.online ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SMS WEBHOOKS & AUTO-CREDITING */}
{activeAdminTab === 'webhooks' && (
  <div className="space-y-6">
    {/* Header & SMS Forwarder Integration Bar */}
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Webhook Engine
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              SMS Forwarder Ready
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mt-1">
            SMS Payment Webhooks & Auto-Crediting Logs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time table displaying incoming payment webhooks forwarded from SMS apps (MTN MoMo, Telecel Cash, AT Money).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSmsSimulator(!showSmsSimulator)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate Inbound SMS</span>
          </button>
          <button
            onClick={() => {
              refreshWebhookLogs();
              showToast('Webhook Logs Refreshed', 'Fetching latest webhook status from Supabase.', 'success');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-slate-800/20 transition-all flex items-center space-x-2 self-start md:self-auto shrink-0"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Webhook URL Endpoint Box */}
      <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>📱 SMS Forwarder Endpoint URLs:</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            HTTP POST / GET Supported
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-slate-400">Current App Environment URL:</div>
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
            <span className="truncate select-all">{window.location.origin}/api/webhook/sms</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/webhook/sms`);
                showToast('App Webhook URL Copied!', 'Paste into SMS Forwarder app.', 'success');
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase rounded-lg shrink-0 transition-transform active:scale-95"
            >
              Copy App URL
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-slate-400">Vercel Production Domain Endpoint:</div>
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
            <span className="truncate select-all">https://dm-data-hub.vercel.app/api/webhook/sms</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://dm-data-hub.vercel.app/api/webhook/sms');
                showToast('Vercel Webhook URL Copied!', 'Paste into SMS Forwarder app.', 'success');
              }}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg shrink-0 transition-transform active:scale-95"
            >
              Copy Vercel URL
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 font-sans">
          <div className="font-bold text-amber-400">💡 SMS Forwarder App Setup Instructions:</div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
            <li>In your Android SMS Forwarder app, set Target / Destination to <strong className="text-white">Webhook / URL</strong>.</li>
            <li>Paste the URL above (<code className="text-amber-300">/api/webhook/sms</code>).</li>
            <li>Set Method to <strong className="text-white">POST</strong> or <strong className="text-white">GET</strong>.</li>
            <li>Ensure payload field includes <code className="text-amber-300">text</code>, <code className="text-amber-300">message</code>, or <code className="text-amber-300">body</code> containing the raw Mobile Money SMS.</li>
            <li>Automatically extracts MTN, Telecel, and AirtelTigo payment receipts and top-ups!</li>
          </ul>
        </div>
      </div>

      {/* Inbound SMS Simulator Form */}
      {showSmsSimulator && (
        <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Test Inbound SMS Forwarder Payload
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Simulates Android SMS Forwarder / Tasker Webhook</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">MoMo Txn ID</label>
              <input
                type="text"
                placeholder="e.g. 30192849182"
                value={simTxnId}
                onChange={e => setSimTxnId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (GHS)</label>
              <input
                type="number"
                placeholder="e.g. 50.00"
                value={simAmount}
                onChange={e => setSimAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Network</label>
              <select
                value={simNetwork}
                onChange={e => setSimNetwork(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              >
                <option value="MTN">MTN</option>
                <option value="Telecel">Telecel</option>
                <option value="AirtelTigo">AirtelTigo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reference Code</label>
            <input
              type="text"
              placeholder="e.g. DMH-123456"
              value={simReferenceCode}
              onChange={e => setSimReferenceCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raw SMS Message Text</label>
            <textarea
              rows={2}
              placeholder="e.g. Payment received for GHS 50.00 from 0241234567. Financial Transaction Id: 30192849182."
              value={simRawSms}
              onChange={e => setSimRawSms(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              onClick={() => setShowSmsSimulator(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!simTxnId && !simRawSms) {
                  showToast('Missing Fields', 'Provide a MoMo Transaction ID or raw SMS text.', 'error');
                  return;
                }
                const res = processSmsWebhook({
                  momoTxnId: simTxnId,
                  amount: Number(simAmount) || undefined,
                  referenceCode: simReferenceCode || undefined,
                  network: simNetwork,
                  rawSms: simRawSms,
                  senderPhone: '0241234567',
                });
                if (res.success) {
                  setSimTxnId('');
                  setSimAmount('');
                  setSimReferenceCode('');
                  setSimRawSms('');
                  setShowSmsSimulator(false);
                  refreshWebhookLogs();
                } else {
                  showToast('Error', res.message, 'error');
                }
              }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Post Webhook
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Table Container */}
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
          Webhooks Table ({webhookLogs.length})
        </h4>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          Unclaimed wait for customer Txn ID claim or admin deletion
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Network</th>
              <th className="p-4">Status</th>
              <th className="p-4">Claimed By</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
            {webhookLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No webhooks received yet. Use 'Simulate Inbound SMS' to test incoming payment webhooks.
                </td>
              </tr>
            ) : (
              webhookLogs.map((wh) => (
                <tr key={wh.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-amber-400">
                    {wh.momoTxnId}
                  </td>
                  <td className="p-4 font-black font-mono text-slate-900 dark:text-white">
                    GHS {wh.amount.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      wh.network === 'MTN'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : wh.network === 'Telecel'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {wh.network}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      wh.status === 'claimed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                    }`}>
                      {wh.status === 'claimed' ? 'Claimed' : 'Unclaimed'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                    {wh.claimedBy || '-'}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(wh.date).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteSmsWebhook(wh.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete Webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

          {/* Verified MoMo Claims Submissions Table (Merged from Verified ID Tab) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-0 mt-6">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Verified MoMo Txn ID Submissions ({claims.length})</span>
                  {claims.filter(c => c.status === 'pending').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-black">
                      {claims.filter(c => c.status === 'pending').length} Pending
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Customer-submitted transaction claims. Auto-credited when matched with incoming SMS webhooks.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Network</th>
                    <th className="p-4">MoMo Number</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No payment claims submitted yet.
                      </td>
                    </tr>
                  ) : (
                    claims.map(claim => (
                      <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-amber-500">
                          {claim.momoTxnId}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{claim.userName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{claim.userEmail}</div>
                        </td>
                        <td className="p-4 font-black font-mono text-slate-900 dark:text-white">
                          GHS {claim.amount.toFixed(2)}
                        </td>
                        <td className="p-4 uppercase font-bold text-[10px] text-slate-600 dark:text-slate-300">
                          {claim.momoNetwork}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                          {claim.momoNumber}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            (claim.status === 'approved' || claim.status === 'claimed')
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                              : claim.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {claim.status === 'approved' ? 'claimed' : claim.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(claim.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          {claim.status === 'pending' && (
                            <>
                              <button
                                onClick={() => processClaim(claim.id, 'claimed', 'Manually verified by admin')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-lg shadow-sm"
                              >
                                Claim & Credit
                              </button>
                              <button
                                onClick={() => processClaim(claim.id, 'rejected', 'Invalid transaction details')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase rounded-lg shadow-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Credit / Debit User Modal */}
      {showCreditModal && selectedUserForCredit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border space-y-4 shadow-2xl">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Credit / Debit {selectedUserForCredit.fullName}
            </h3>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Amount (Positive = Credit, Negative = Debit)
              </label>
              <input
                type="number"
                value={creditAmountInput}
                onChange={e => setCreditAmountInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border text-sm font-black font-mono rounded-xl"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={creditReasonInput}
                onChange={e => setCreditReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border text-xs rounded-xl"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreditModal(false)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  creditUserWallet(selectedUserForCredit.id, creditAmountInput, creditReasonInput);
                  setShowCreditModal(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Edit/Add Modal */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border space-y-4">
            <h3 className="font-black text-base">{editingPkgId ? 'Edit Package' : 'Add Package'}</h3>
            <form onSubmit={handleSavePackage} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={e => setPkgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Network</label>
                <select
                  value={pkgNetwork}
                  onChange={e => setPkgNetwork(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value="mtn">MTN Ghana</option>
                  <option value="telecel">Telecel Ghana</option>
                  <option value="airteltigo_ishare">AirtelTigo iShare</option>
                  <option value="airteltigo_bigtime">AirtelTigo Big Time</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold block mb-1">Data Amount</label>
                  <input
                    type="text"
                    required
                    value={pkgData}
                    onChange={e => setPkgData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Price (GHS)</label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={e => setPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
