import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CustomerDashboard } from './components/CustomerDashboard';
import { PackageCatalog } from './components/PackageCatalog';
import { WalletView } from './components/WalletView';
import { OrdersView } from './components/OrdersView';
import { ComplaintsView } from './components/ComplaintsView';
import { GuidesView } from './components/GuidesView';
import { ReferralView } from './components/ReferralView';
import { AdminDashboard } from './components/AdminDashboard';
import { TopUpModal } from './components/TopUpModal';
import { ClaimPaymentModal } from './components/ClaimPaymentModal';
import { ShoppingCartDrawer } from './components/ShoppingCartDrawer';
import { ReceiptModal } from './components/ReceiptModal';
import { ToastNotification } from './components/ToastNotification';
import { LiveChatWidget } from './components/LiveChatWidget';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { AuthModal } from './components/AuthModal';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import { ProfileView } from './components/ProfileView';
import { Footer } from './components/Footer';
import { AnnouncementModal } from './components/AnnouncementModal';
import { Order } from './types';

function MainApp() {
  const { activeRole, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('dmh_active_tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('dmh_active_tab', activeTab);
  }, [activeTab]);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  const handleOrderSuccess = (order: Order) => {
    setSelectedReceiptOrder(order);
  };

  // If not authenticated, render only the sign-in / sign-up screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          allowClose={false}
          initialMode="login"
        />
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans pb-20 md:pb-0">

      <Header
        onOpenTopUp={() => setIsTopUpOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-7xl mx-auto flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenTopUp={() => setIsTopUpOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <CustomerDashboard
              onOpenTopUp={() => setIsTopUpOpen(true)}
              onOpenClaim={() => setIsClaimOpen(true)}
              setActiveTab={setActiveTab}
              onSelectReceiptOrder={setSelectedReceiptOrder}
            />
          )}

          {activeTab === 'packages' && <PackageCatalog />}

          {activeTab === 'wallet' && (
            <WalletView
              onOpenTopUp={() => setIsTopUpOpen(true)}
              onOpenClaim={() => setIsClaimOpen(true)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView onSelectReceiptOrder={setSelectedReceiptOrder} />
          )}

          {activeTab === 'complaints' && <ComplaintsView />}

          {activeTab === 'guides' && <GuidesView />}

          {activeTab === 'referral' && <ReferralView />}

          {activeTab === 'profile' && (
            <ProfileView
              onOpenTopUp={() => setIsTopUpOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPolicyView onBackToDashboard={() => setActiveTab('dashboard')} />
          )}

          {activeTab === 'terms' && (
            <TermsOfServiceView onBackToDashboard={() => setActiveTab('dashboard')} />
          )}

          {(activeTab === 'admin' || activeTab === 'users' || activeTab === 'claims') && activeRole === 'admin' && <AdminDashboard />}
        </main>
      </div>

      <Footer setActiveTab={setActiveTab} activeTab={activeTab} />

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals & Drawers */}
      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />

      <ClaimPaymentModal isOpen={isClaimOpen} onClose={() => setIsClaimOpen(false)} />

      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenTopUp={() => {
          setIsCartOpen(false);
          setIsTopUpOpen(true);
        }}
      />

      <ReceiptModal
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      <UniversalSearchModal setActiveTab={setActiveTab} />

      <LiveChatWidget />

      <AnnouncementModal />

      <ToastNotification />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
