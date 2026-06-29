import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlusCircle, BarChart3, LineChart, DollarSign, Calendar, Sparkles, Trash2, Home, Users, Bed, Bath, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const HostDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Chart Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Listing creation form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trending');
  const [pricePerNight, setPricePerNight] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [guestsCapacity, setGuestsCapacity] = useState(2);
  const [coverImage, setCoverImage] = useState(null);
  const [creating, setCreating] = useState(false);

  // Mock monthly statistics for Apple-style analytics representation
  const monthlyEarnings = [
    { month: 'Jan', amount: 15000, stays: 3, x: 40, y: 160 },
    { month: 'Feb', amount: 32000, stays: 6, x: 120, y: 130 },
    { month: 'Mar', amount: 28000, stays: 5, x: 200, y: 140 },
    { month: 'Apr', amount: 48000, stays: 9, x: 280, y: 100 },
    { month: 'May', amount: 72000, stays: 12, x: 360, y: 60 },
    { month: 'Jun', amount: 65000, stays: 10, x: 440, y: 75 },
    { month: 'Jul', amount: 95000, stays: 16, x: 520, y: 20 },
  ];

  const fetchHostData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch host stats
      const statsRes = await axios.get('/api/bookings/host/dashboard');
      setAnalytics(statsRes.data.analytics);

      // Fetch bookings
      const bookingsRes = await axios.get('/api/bookings?role=host');
      setReservations(bookingsRes.data.bookings);

      // Fetch my listings
      const listingsRes = await axios.get(`/api/properties?host=${user._id}`);
      setMyListings(listingsRes.data.properties || []);
    } catch (error) {
      console.error('Error fetching host dashboard details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostData();
  }, [user]);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('pricePerNight', pricePerNight);
    formData.append('city', city);
    formData.append('country', country);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    formData.append('guestsCapacity', guestsCapacity);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    try {
      await axios.post('/api/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Listing created successfully!');
      setTitle('');
      setDescription('');
      setPricePerNight('');
      setCity('');
      setCountry('');
      
      // Refresh statistics and listing view
      await fetchHostData();
      setActiveTab('listings-list');
    } catch (err) {
      alert(err.response?.data?.message || 'Listing creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently? This cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(`/api/properties/${id}`);
      alert('Listing deleted successfully.');
      setMyListings((prev) => prev.filter((p) => p._id !== id));
      // Update statistics
      const statsRes = await axios.get('/api/bookings/host/dashboard');
      setAnalytics(statsRes.data.analytics);
    } catch (err) {
      alert('Failed to delete property listing.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-900 justify-between">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-neutral-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Draw curved line path string for the earnings SVG
  const pathD = `M ${monthlyEarnings.map((p) => `${p.x} ${p.y}`).join(' L ')}`;

  // Area under path for linear gradient fills
  const areaD = `${pathD} L 520 180 L 40 180 Z`;

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between page-fade-in">
      <Navbar />

      <main className="flex-grow px-6 py-10 md:px-12 bg-neutral-50/50 dark:bg-neutral-950/20">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Header Segment */}
          <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 dark:border-neutral-800 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Hosting Center</span>
                <Sparkles className="h-6 w-6 text-brand animate-pulse" />
              </h1>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Welcome back, {user?.name || 'Host'}. Manage listings, review payouts, and check reservation tables.
              </p>
            </div>

            {/* Premium Selector Tabs */}
            <div className="flex bg-neutral-150/70 p-1.5 rounded-2xl dark:bg-neutral-800 w-fit border dark:border-neutral-700 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'analytics' ? 'bg-white shadow-md text-brand dark:bg-neutral-700 dark:text-white scale-102' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-350'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Analytics
              </button>
              
              <button
                onClick={() => setActiveTab('listings-list')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'listings-list' ? 'bg-white shadow-md text-brand dark:bg-neutral-700 dark:text-white scale-102' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-350'
                }`}
              >
                <Home className="h-4 w-4" /> My Listings
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'create' ? 'bg-white shadow-md text-brand dark:bg-neutral-700 dark:text-white scale-102' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-350'
                }`}
              >
                <PlusCircle className="h-4 w-4" /> Add Property
              </button>
            </div>
          </div>

          {activeTab === 'analytics' ? (
            /* ================= ANALYTICS PANEL ================= */
            <div className="space-y-8 animate-fade-in">
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-neutral-100 p-6 bg-white dark:border-neutral-800 dark:bg-neutral-850 apple-3d-card mirror-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Total Earnings</span>
                    <div className="rounded-xl bg-green-50 p-2 text-green-600 dark:bg-green-950/20"><DollarSign className="h-4 w-4" /></div>
                  </div>
                  <h3 className="mt-4 text-3xl font-black text-neutral-900 dark:text-white">INR {analytics?.totalEarnings || 0}</h3>
                  <p className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> +14.2% from last month
                  </p>
                </div>

                <div className="rounded-3xl border border-neutral-100 p-6 bg-white dark:border-neutral-800 dark:bg-neutral-850 apple-3d-card mirror-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Active Bookings</span>
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/20"><Calendar className="h-4 w-4" /></div>
                  </div>
                  <h3 className="mt-4 text-3xl font-black text-neutral-900 dark:text-white">{analytics?.activeBookings || 0} stays</h3>
                  <p className="mt-2 text-[10px] text-neutral-400 font-semibold">Current scheduled rentals</p>
                </div>

                <div className="rounded-3xl border border-neutral-100 p-6 bg-white dark:border-neutral-800 dark:bg-neutral-850 apple-3d-card mirror-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Occupancy Rate</span>
                    <div className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/20"><LineChart className="h-4 w-4" /></div>
                  </div>
                  <h3 className="mt-4 text-3xl font-black text-neutral-900 dark:text-white">{analytics?.occupancyRate || 0}%</h3>
                  <p className="mt-2 text-[10px] text-neutral-400 font-semibold">Average stay frequency</p>
                </div>

                <div className="rounded-3xl border border-neutral-100 p-6 bg-white dark:border-neutral-800 dark:bg-neutral-850 apple-3d-card mirror-glow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest">Total Listings</span>
                    <div className="rounded-xl bg-brand/5 p-2 text-brand dark:bg-brand/20"><Home className="h-4 w-4" /></div>
                  </div>
                  <h3 className="mt-4 text-3xl font-black text-neutral-900 dark:text-white">{myListings.length} properties</h3>
                  <p className="mt-2 text-[10px] text-neutral-400 font-semibold">Registered properties</p>
                </div>
              </div>

              {/* Earnings Performance Chart & Payout Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SVG Line Chart (Apple Style) */}
                <div className="lg:col-span-2 rounded-3xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-850 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-neutral-900 dark:text-white">Earnings Curve</h3>
                    <p className="text-[10px] font-semibold text-neutral-400">Monthly payout metrics breakdown (Jan - Jul)</p>
                  </div>

                  {/* Interactive Chart Canvas */}
                  <div className="relative mt-6 h-52 w-full flex items-center justify-center">
                    <svg viewBox="0 0 560 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF385C" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#FF385C" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="40" y1="20" x2="520" y2="20" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4" />
                      <line x1="40" y1="60" x2="520" y2="60" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4" />
                      <line x1="40" y1="100" x2="520" y2="100" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4" />
                      <line x1="40" y1="140" x2="520" y2="140" stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4" />
                      <line x1="40" y1="180" x2="520" y2="180" stroke="rgba(148, 163, 184, 0.15)" />

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#chartGradient)" className="animate-fade-in" />

                      {/* Line Path */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#FF385C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />

                      {/* Node Circles */}
                      {monthlyEarnings.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint?.month === p.month ? '7' : '4.5'}
                          fill={hoveredPoint?.month === p.month ? '#FF385C' : '#FFFFFF'}
                          stroke="#FF385C"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}

                      {/* X Axis Labels */}
                      {monthlyEarnings.map((p, idx) => (
                        <text
                          key={idx}
                          x={p.x}
                          y="196"
                          textAnchor="middle"
                          className="text-[9px] font-black fill-neutral-400 dark:fill-neutral-500 font-sans uppercase"
                        >
                          {p.month}
                        </text>
                      ))}
                    </svg>

                    {/* Dynamic Floating Tooltip */}
                    {hoveredPoint && (
                      <div className="absolute top-2 right-4 rounded-xl bg-neutral-900 p-2.5 text-white dark:bg-white dark:text-neutral-900 shadow-xl border dark:border-neutral-100 flex flex-col gap-0.5 animate-scale-in text-left">
                        <p className="text-[9px] uppercase font-black tracking-wider text-neutral-400 dark:text-neutral-500">
                          {hoveredPoint.month} Payout
                        </p>
                        <p className="text-xs font-black">INR {hoveredPoint.amount.toLocaleString()}</p>
                        <p className="text-[9px] font-semibold text-brand">{hoveredPoint.stays} Stays Booked</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reservation Summary */}
                <div className="rounded-3xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-850 flex flex-col justify-between shadow-sm">
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-neutral-900 dark:text-white">Active Performance</h3>
                    <div className="space-y-3.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-500">Occupancy Peak</span>
                        <span className="font-bold text-neutral-950 dark:text-white">92% (Jul)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-500">Avg. Stay Duration</span>
                        <span className="font-bold text-neutral-950 dark:text-white">4.2 nights</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-500">Superhost Progress</span>
                        <span className="font-bold text-brand">Superhost</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 space-y-2 mt-4">
                    <p className="text-[10px] text-neutral-450 uppercase font-black tracking-wider">Account Upgrade Protection</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-brand" />
                      <p className="text-[11px] font-bold dark:text-white">AirCover Protection Enforced</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Reservations Grid List */}
              <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-850">
                <h3 className="text-base font-black text-neutral-900 dark:text-white">Recent Guest Reservations</h3>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:border-neutral-800">
                        <th className="pb-3">Property</th>
                        <th className="pb-3">Guest</th>
                        <th className="pb-3">Check-In</th>
                        <th className="pb-3">Check-Out</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 font-medium">
                      {reservations.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-neutral-400 font-semibold">
                            No reservations found for your listings.
                          </td>
                        </tr>
                      ) : (
                        reservations.map((res) => (
                          <tr key={res._id}>
                            <td className="py-4 font-bold text-neutral-900 dark:text-white">{res.property?.title}</td>
                            <td className="py-4 text-neutral-600 dark:text-neutral-300">{res.guest?.name}</td>
                            <td className="py-4 text-neutral-500">{new Date(res.checkIn).toLocaleDateString()}</td>
                            <td className="py-4 text-neutral-500">{new Date(res.checkOut).toLocaleDateString()}</td>
                            <td className="py-4 font-black">INR {res.totalPrice}</td>
                            <td className="py-4">
                              <span className={`inline-block rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                                res.status === 'Confirmed'
                                  ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                                  : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20'
                              }`}>
                                {res.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'listings-list' ? (
            /* ================= MY LISTINGS MANAGEMENT PANEL ================= */
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white">Active Properties</h3>
                  <p className="text-xs text-neutral-450 font-semibold">View, inspect, or remove your published listings.</p>
                </div>
                <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-350 px-3 py-1.5 rounded-xl border dark:border-neutral-700">
                  {myListings.length} listings total
                </span>
              </div>

              {myListings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center space-y-4 dark:border-neutral-800">
                  <Home className="h-10 w-10 text-neutral-300 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold dark:text-white">No active properties published</h4>
                    <p className="text-xs text-neutral-450 mt-1">Get started by listing your spare home parameters.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="rounded-xl bg-brand py-2 px-5 text-xs font-bold text-white transition hover:bg-brand-dark"
                  >
                    Add Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map((prop) => (
                    <div 
                      key={prop._id} 
                      className="rounded-3xl border border-neutral-100 bg-white overflow-hidden dark:border-neutral-800 dark:bg-neutral-850 flex flex-col justify-between apple-hover shadow-sm"
                    >
                      <div className="relative aspect-[4/3]">
                        <img 
                          src={prop.coverImage} 
                          alt={prop.title}
                          className="h-full w-full object-cover" 
                        />
                        <span className={`absolute top-3 left-3 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white ${
                          prop.isApproved ? 'bg-green-600/90' : 'bg-orange-500/90'
                        }`}>
                          {prop.isApproved ? 'Approved' : 'Pending Verification'}
                        </span>
                      </div>
                      
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-neutral-900 dark:text-white line-clamp-1">{prop.title}</h4>
                          <p className="text-[10px] font-bold text-neutral-450 uppercase">{prop.address.city}, {prop.address.country}</p>
                          <p className="text-xs font-bold text-neutral-950 dark:text-white pt-1">INR {prop.pricePerNight} <span className="font-semibold text-neutral-500">/ night</span></p>
                        </div>

                        {/* Stats Summary row */}
                        <div className="grid grid-cols-3 gap-2 border-t pt-3 dark:border-neutral-800 text-center text-neutral-500 font-semibold text-[10px]">
                          <span className="flex items-center justify-center gap-1"><Bed className="h-3.5 w-3.5" /> {prop.bedrooms} Bed</span>
                          <span className="flex items-center justify-center gap-1"><Bath className="h-3.5 w-3.5" /> {prop.bathrooms} Bath</span>
                          <span className="flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" /> {prop.guestsCapacity} Guests</span>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleDeleteProperty(prop._id)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-100 hover:border-red-600 hover:bg-red-50 text-red-500 dark:border-neutral-800 dark:hover:bg-red-950/20 py-2.5 text-[11px] font-bold transition duration-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Listing</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ================= CREATE LISTING PANEL ================= */
            <form onSubmit={handleCreateProperty} className="mt-8 max-w-4xl space-y-6 bg-white border border-neutral-100 p-8 rounded-3xl dark:bg-neutral-850 dark:border-neutral-850 dark:border-neutral-800 shadow-lg animate-fade-in">
              <div className="border-b pb-4 dark:border-neutral-750">
                <h3 className="text-base font-black text-neutral-900 dark:text-white">New Listing Parameters</h3>
                <p className="text-[10px] text-neutral-450 font-semibold">Publish your spare vacation home details.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Listing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxury Beachside Villa"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm cursor-pointer"
                  >
                    <option value="Trending">Trending</option>
                    <option value="Beachfront">Beachfront</option>
                    <option value="Cabins">Cabins</option>
                    <option value="Countryside">Countryside</option>
                    <option value="Pools">Pools</option>
                    <option value="Lakefront">Lakefront</option>
                    <option value="Modern">Modern</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Description</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Detail your property features, accessibility options, nearby attractions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Goa"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Price per Night (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Guests Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={guestsCapacity}
                    onChange={(e) => setGuestsCapacity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide block mb-1">Cover Image</label>
                <div className="flex items-center justify-center border-2 border-dashed rounded-2xl dark:border-neutral-700 py-6 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">
                  <label className="flex flex-col items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <PlusCircle className="h-6 w-6 text-brand" />
                    <span>{coverImage ? coverImage.name : 'Select Cover Image File'}</span>
                    <input
                      type="file"
                      required
                      onChange={(e) => setCoverImage(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark shadow-md duration-200"
              >
                {creating ? 'Creating Listing...' : 'Publish Listing'}
              </button>

            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HostDashboard;
