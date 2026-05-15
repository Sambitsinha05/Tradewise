import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Watchlist from './pages/Watchlist';
import Simulator from './pages/Simulator';
import Journal from './pages/Journal';

function App() {
  const { checkAuth, isLoading, user, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle Socket Connection Lifecycle
  useEffect(() => {
    if (isAuthenticated && user) {
      connect(user._id);
    } else {
      disconnect();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes inside Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />}>
              <Route path=":symbol" element={<Markets />} />
            </Route>
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* We will add /journal etc here later */}
          </Route>
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
