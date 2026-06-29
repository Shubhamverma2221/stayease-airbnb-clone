import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Users, Compass, DollarSign, Ban, CheckCircle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Dashboard Stats
        const statsRes = await axios.get('/api/admin/dashboard');
        setStats(statsRes.data.stats);

        // Users List
        const usersRes = await axios.get('/api/admin/users');
        setUsersList(usersRes.data.users);
      } catch (err) {
        console.error('Error fetching admin console data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleToggleBlock = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/block`);
      // Update state local list
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u))
      );
      alert(res.data.message);
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleApproveHost = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/approve-host`);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: 'host', isHostApproved: true } : u))
      );
      alert(res.data.message);
    } catch (error) {
      alert(error.response?.data?.message || 'Approve host failed');
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

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between">
      <Navbar />

      <main className="flex-grow px-6 py-10 md:px-12">
        <div className="mx-auto max-w-7xl space-y-10">
          
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="h-7 w-7 text-brand" />
              <span>Admin Console</span>
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Verify platform users list, suspend accounts, and inspect billing receipts summaries.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-neutral-250 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-850">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-50 p-3 text-green-600 dark:bg-green-950/20"><DollarSign className="h-5 w-5" /></div>
                <span className="text-xs font-bold text-neutral-400">Total Revenue</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-neutral-900 dark:text-white">INR {stats?.totalRevenue || 0}</h3>
            </div>

            <div className="rounded-3xl border border-neutral-250 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-850">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/20"><Users className="h-5 w-5" /></div>
                <span className="text-xs font-bold text-neutral-400">Platform Users</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-neutral-900 dark:text-white">{stats?.totalUsers || 0} users</h3>
            </div>

            <div className="rounded-3xl border border-neutral-250 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-850">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-50 p-3 text-orange-600 dark:bg-orange-950/20"><Compass className="h-5 w-5" /></div>
                <span className="text-xs font-bold text-neutral-400">Listings approved</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-neutral-900 dark:text-white">{stats?.totalProperties || 0} properties</h3>
            </div>

            <div className="rounded-3xl border border-neutral-250 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-850">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand/5 p-3 text-brand dark:bg-brand/20"><FileSpreadsheet className="h-5 w-5" /></div>
                <span className="text-xs font-bold text-neutral-400">Total Bookings</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-neutral-900 dark:text-white">{stats?.totalBookings || 0} stays</h3>
            </div>
          </div>

          {/* User Management Section */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-850">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Platform Users Directory</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:border-neutral-800">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {usersList.map((u) => (
                    <tr key={u._id} className="text-xs dark:text-neutral-300">
                      <td className="py-4 font-semibold text-neutral-900 dark:text-white">{u.name}</td>
                      <td className="py-4">{u.email}</td>
                      <td className="py-4 capitalize font-semibold">{u.role}</td>
                      <td className="py-4">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          u.isBlocked ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-green-50 text-green-600 dark:bg-green-950/20'
                        }`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 flex justify-center gap-2">
                        {u.role === 'guest' && (
                          <button
                            onClick={() => handleApproveHost(u._id)}
                            className="flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-1.5 font-bold text-white text-[10px] hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve Host
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleBlock(u._id)}
                          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 font-bold text-[10px] transition ${
                            u.isBlocked
                              ? 'border-green-200 text-green-600 hover:bg-green-50/50'
                              : 'border-red-200 text-red-600 hover:bg-red-50/50'
                          }`}
                        >
                          <Ban className="h-3.5 w-3.5" /> {u.isBlocked ? 'Unblock' : 'Block User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
