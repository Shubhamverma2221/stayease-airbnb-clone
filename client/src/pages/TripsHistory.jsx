import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatComponent from '../components/ChatComponent';
import { Calendar, MessageSquare, AlertCircle, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const TripsHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Chat States
  const [activeChatBooking, setActiveChatBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/bookings?role=guest');
      setBookings(res.data.bookings);
    } catch (error) {
      console.error('Error fetching trips history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await axios.post(`/api/bookings/${bookingId}/cancel`);
      alert(res.data.message);
      fetchBookings(); // Reload
    } catch (error) {
      alert(error.response?.data?.message || 'Cancellation failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between page-fade-in">
      <Navbar />

      <main className="flex-grow px-6 py-10 md:px-12">
        <div className="mx-auto max-w-7xl relative">
          
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-brand" />
            <span>Your Trips History</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
            View booking status, coordinate chat messages with hosts, or manage check-in dates cancellation rules.
          </p>

          {loading ? (
            <div className="flex justify-center p-12 text-neutral-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-neutral-50 p-4 dark:bg-neutral-850">
                <AlertCircle className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No trips found</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                You haven't reserved any property yet. Browse destinations to start booking!
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {bookings.map((b) => (
                <div
                  key={b._id}
                  className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-850 md:flex-row md:items-center"
                >
                  <img
                    src={
                      b.property.coverImage?.startsWith('http')
                        ? b.property.coverImage
                        : `http://localhost:5000${b.property.coverImage}`
                    }
                    alt={b.property.title}
                    className="h-32 w-32 rounded-2xl object-cover"
                  />

                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-neutral-950 dark:text-white">{b.property.title}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      Check-in: {new Date(b.checkIn).toLocaleDateString()} · Check-out: {new Date(b.checkOut).toLocaleDateString()}
                    </p>
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Guests: {b.guestsCount} guests · Paid amount: <span className="font-extrabold text-neutral-950 dark:text-white">INR {b.totalPrice}</span>
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        b.status === 'Confirmed'
                          ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                          : b.status === 'Cancelled'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                          : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20'
                      }`}>
                        {b.status}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        b.paymentStatus === 'Paid'
                          ? 'bg-green-50 text-green-600 dark:bg-green-950/20'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <button
                      onClick={() => setActiveChatBooking(b)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                    >
                      <MessageSquare className="h-4 w-4" /> Message Host
                    </button>
                    {b.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50/50"
                      >
                        <XCircle className="h-4 w-4" /> Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Floating Chat Panel overlay */}
          {activeChatBooking && (
            <div className="fixed bottom-6 right-6 z-50">
              <ChatComponent
                bookingId={activeChatBooking._id}
                user={user}
                receiverName={activeChatBooking.property.host?.name || 'Host'}
                onClose={() => setActiveChatBooking(null)}
              />
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripsHistory;
