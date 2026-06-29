import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../redux/authSlice';
import { setSearchParams } from '../redux/propertySlice';
import { useTheme } from '../context/ThemeContext';
import { Search, Globe, Menu, User, Sun, Moon, LogOut, Heart, Home as HomeIcon, LayoutDashboard, Bell, Shield, Mic, MicOff } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchGuests, setSearchGuests] = useState(1);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      const queryText = speechToText.endsWith('.') ? speechToText.slice(0, -1) : speechToText;
      setSearchCity(queryText);
      // Auto-trigger search or let user review
      dispatch(setSearchParams({ city: queryText, guestsCount: searchGuests }));
      navigate('/');
    };
    
    recognition.onerror = (err) => {
      console.error('Speech recognition API error:', err);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);

  // 2FA Setup states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);

  const handleSetup2FA = async () => {
    try {
      const res = await axios.post('/api/auth/setup-2fa');
      setTotpSecret(res.data.secret);
      setTotpQrCode(res.data.qrCodeUrl);
      setShow2FAModal(true);
      setIsMenuOpen(false);
    } catch (err) {
      alert('Could not initialize 2FA setup parameters');
    }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setEnabling2FA(true);
    try {
      const res = await axios.post('/api/auth/confirm-2fa', {
        secret: totpSecret,
        token: totpVerifyCode,
      });
      alert(res.data.message);
      setShow2FAModal(false);
      setTotpVerifyCode('');
      dispatch(updateUser({ isTwoFactorEnabled: true }));
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setEnabling2FA(false);
    }
  };

  // Fetch notifications if user is logged in
  useEffect(() => {
    if (user) {
      // Mock notifications or API request
      setNotifications([
        { id: 1, title: 'Welcome!', message: 'Thank you for choosing StayEase.', isRead: false },
        { id: 2, title: 'Superhost Status', message: 'You are viewing our premium demo listings!', isRead: false }
      ]);
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchParams({ city: searchCity, guestsCount: searchGuests }));
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error', error);
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="ios-glass sticky top-0 z-40 w-full px-6 py-3.5 shadow-sm transition-all duration-300 md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-brand hover:opacity-90 active:scale-95 transition-all">
          <svg
            className="h-8 w-8 stroke-brand fill-none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="hidden text-xl font-black tracking-tight md:block">StayEase</span>
        </Link>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className="relative flex max-w-lg flex-1 items-center gap-2 rounded-full border border-neutral-200 py-1.5 pl-4 pr-1.5 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-brand/40 focus-within:scale-[1.02] transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <input
            type="text"
            placeholder="Search destination..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-neutral-550 focus:outline-none dark:text-white"
          />
          
          {/* Voice Search Microphone button */}
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition dark:hover:bg-neutral-800 dark:hover:text-white ${
              isListening ? 'bg-red-55/10 text-red-500 animate-pulse dark:bg-red-950/20' : ''
            }`}
            title="Voice Search"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          
          <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-700"></div>
          
          {/* Custom Guest Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGuestOpen(!isGuestOpen)}
              className="flex items-center gap-1.5 bg-transparent text-xs font-black uppercase tracking-wider text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white py-1 px-2 rounded-full hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <span>{searchGuests} {searchGuests === 1 ? 'Guest' : 'Guests'}</span>
            </button>

            {isGuestOpen && (
              <>
                {/* Click outside backdrop overlay to close */}
                <div className="fixed inset-0 z-10" onClick={() => setIsGuestOpen(false)} />
                
                {/* Floating selector card */}
                <div className="absolute right-0 mt-3.5 w-60 rounded-3xl border border-neutral-100 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-850 z-20 animate-scale-in">
                  <div className="flex items-center justify-between border-b pb-3.5 dark:border-neutral-750">
                    <div>
                      <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">Number of Guests</h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Define stays capacity requirements.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-neutral-950 dark:text-white">Adults / Kids</h5>
                      <p className="text-[9px] text-neutral-500 font-semibold">Total capacity count</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSearchGuests(Math.max(1, searchGuests - 1))}
                        disabled={searchGuests <= 1}
                        className="h-8 w-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-neutral-950 dark:text-white w-4 text-center">
                        {searchGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchGuests(Math.min(16, searchGuests + 1))}
                        disabled={searchGuests >= 16}
                        className="h-8 w-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGuestOpen(false)}
                    className="w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-2.5 text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-98 transition"
                  >
                    Apply selection
                  </button>
                </div>
              </>
            )}
          </div>

          <button type="submit" className="rounded-full bg-brand p-2.5 text-white transition hover:bg-brand-dark hover:scale-105 active:scale-95 shadow-sm">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Utility Menu */}
        <div className="flex items-center gap-3">
          {user?.role === 'guest' && (
            <Link
              to="/become-host"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800 lg:block"
            >
              StayEase your home
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications Button */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-brand"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-800">
                  <h4 className="border-b border-neutral-100 pb-2 text-sm font-bold dark:border-neutral-700 dark:text-white">
                    Notifications
                  </h4>
                  <div className="mt-2 space-y-3">
                    {notifications.map((n) => (
                      <div key={n.id} className="text-xs">
                        <p className="font-semibold text-neutral-800 dark:text-white">{n.title}</p>
                        <p className="text-neutral-500 dark:text-neutral-400">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 rounded-full border border-neutral-200 px-3 py-2 transition hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <Menu className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="rounded-full bg-neutral-500 p-1 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-neutral-100 bg-white py-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-800">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700">
                      <p className="text-sm font-semibold dark:text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Personal Profile
                    </Link>

                    <Link
                      to="/wishlist"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4" /> Wishlist
                    </Link>

                    <Link
                      to="/bookings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <HomeIcon className="h-4 w-4" /> Trips History
                    </Link>

                    <button
                      onClick={handleSetup2FA}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <Shield className="h-4 w-4 text-brand" /> {user.isTwoFactorEnabled ? 'Google 2FA Active' : 'Setup Google 2FA'}
                    </button>

                    {(user.role === 'host' || user.role === 'admin') && (
                      <Link
                        to="/host/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" /> Host Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Console
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Google 2FA QR Code Setup Modal */}
      {show2FAModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm cursor-pointer animate-fade-in"
          onClick={() => setShow2FAModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 cursor-default animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-750">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Shield className="h-5 w-5 text-brand" />
                <span>Google Authenticator 2FA</span>
              </h3>
              <button
                onClick={() => setShow2FAModal(false)}
                className="rounded-xl p-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center text-center space-y-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Scan this QR code using Google Authenticator, Authy, or Microsoft Authenticator app on your phone.
              </p>
              
              <div className="rounded-2xl border border-neutral-105 bg-white p-3 shadow-md">
                <img src={totpQrCode} alt="TOTP QR Code" className="h-44 w-44" />
              </div>

              <div className="w-full text-left">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Secret Key (Manual Entry)</label>
                <div className="mt-1 rounded-xl bg-neutral-50 p-2 text-center text-xs font-mono font-bold tracking-wider text-neutral-700 dark:bg-neutral-800 dark:text-neutral-350 select-all border dark:border-neutral-700">
                  {totpSecret}
                </div>
              </div>

              {/* Confirm Code Input */}
              <form onSubmit={handleConfirm2FA} className="w-full space-y-4 pt-2">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Verification OTP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 py-2.5 px-3 text-center font-mono font-bold tracking-widest outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enabling2FA}
                  className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                >
                  {enabling2FA ? 'Confirming...' : 'Verify and Enable'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      </div>
    </header>
  );
};

export default Navbar;
