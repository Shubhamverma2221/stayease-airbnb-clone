import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SplashLoader from './components/SplashLoader';
import AIChatbot from './components/AIChatbot';

// Pages
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import HostDashboard from './pages/HostDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Wishlist from './pages/Wishlist';
import TripsHistory from './pages/TripsHistory';
import BecomeHost from './pages/BecomeHost';
import Profile from './pages/Profile';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  // Ambient Mouse Pointer Spotlight Coordinates
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('a') || 
        target.closest('button') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.apple-3d-card')
      ) {
        setIsHoveringInteractive(true);
      } else {
        setIsHoveringInteractive(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Global Apple-style Ambient Cursor Spotlight Tracker */}
      <div 
        className="pointer-events-none fixed inset-0 z-40 transition-all duration-500 opacity-20 dark:opacity-15 hidden md:block"
        style={{
          background: `radial-gradient(${isHoveringInteractive ? '480px' : '320px'} at ${coords.x}px ${coords.y}px, rgba(255, 56, 92, 0.14), transparent 80%)`
        }}
      />

      {showSplash && <SplashLoader onComplete={() => setShowSplash(false)} />}
      
      <Router>
        <AIChatbot />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Guest Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['guest', 'host', 'admin']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRoles={['guest', 'host', 'admin']}>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['guest', 'host', 'admin']}>
                <TripsHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-host"
            element={
              <ProtectedRoute allowedRoles={['guest']}>
                <BecomeHost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['guest', 'host', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Host Routes */}
          <Route
            path="/host/dashboard"
            element={
              <ProtectedRoute allowedRoles={['host', 'admin']}>
                <HostDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
