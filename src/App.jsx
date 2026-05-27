import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Feed from './pages/Feed';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import History from './pages/History';
import ParlayDetail from './pages/ParlayDetail';
import Stats from './pages/Stats.jsx';
import PicksHistory from './pages/PicksHistory';
import Pricing from './pages/Pricing.jsx';
import Notifications from './pages/Notifications';
import Referrals from './pages/Referrals';
import Admin from './pages/Admin';
import Marketplace from './pages/Marketplace';
import CreatorProfilePage from './pages/CreatorProfilePage';
import ParlayBuilder from './pages/ParlayBuilder';
import MyPicksDashboard from './pages/MyPicksDashboard';
import PurchasedPicks from './pages/PurchasedPicks';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/parlay/:id" element={<ParlayDetail />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/history" element={<PicksHistory />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/referrals" element={<Referrals />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/creator/:id" element={<CreatorProfilePage />} />
      <Route path="/builder" element={<ParlayBuilder />} />
      <Route path="/my-picks" element={<MyPicksDashboard />} />
      <Route path="/purchased" element={<PurchasedPicks />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/import" element={<Import />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App