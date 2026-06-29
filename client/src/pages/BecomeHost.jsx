import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Home, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BecomeHost = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBecomeHost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/become-host');
      dispatch(updateUser({ role: 'host' }));
      alert(res.data.message);
      navigate('/host/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upgrade account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between page-fade-in">
      <Navbar />

      <main className="flex-grow flex items-center px-6 py-16 md:px-12 bg-gradient-to-tr from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          
          {/* Text panel */}
          <div className="space-y-8 scroll-reveal">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 dark:bg-brand/20 px-3 py-1.5 rounded-lg border border-brand/10">
                Become a Host
              </span>
              <h1 className="text-4xl font-black text-neutral-950 leading-tight dark:text-white md:text-5.5xl tracking-tight">
                StayEase your home. <br />
                <span className="text-brand">Earn extra income.</span>
              </h1>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
                Open your doors to travelers globally. Set prices, choose booking availability calendars, and share the beauty of your neighborhood places.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-brand/5 p-3 text-brand dark:bg-brand/20 h-fit border border-brand/5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black dark:text-white uppercase tracking-wider text-neutral-900">Complete Host Protection</h4>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-normal">
                    AirCover guards host listings with damage verification coverage up to INR 80,00,000.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="rounded-2xl bg-brand/5 p-3 text-brand dark:bg-brand/20 h-fit border border-brand/5">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black dark:text-white uppercase tracking-wider text-neutral-900">Passionate Community</h4>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-normal">
                    Join millions of hosting veterans sharing expert neighborhood recommendations.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBecomeHost}
              disabled={loading}
              className="rounded-2xl bg-brand hover:bg-brand-dark px-10 py-4 text-xs font-black uppercase tracking-wider text-white transition shadow-md hover:shadow-lg active:scale-98 apple-hover"
            >
              {loading ? 'Upgrading account...' : 'Start Hosting Now'}
            </button>
          </div>

          {/* Visual banner */}
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border dark:border-neutral-850 apple-hover scroll-reveal" style={{ animationDelay: '0.15s' }}>
            <img
              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80"
              alt="Beautiful house exterior"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white space-y-2">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-light bg-brand/10 border border-brand-light/20 w-fit px-2.5 py-1 rounded-lg">
                <Home className="h-3.5 w-3.5" /> Recommended Stay
              </p>
              <h3 className="text-xl font-bold tracking-tight">Oceanview Cabin Retreat</h3>
              <p className="text-[10px] opacity-80 font-semibold">Host listings earn an average of INR 45,000 monthly.</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeHost;
