import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { Heart } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setWishlist } from '../redux/propertySlice';
import axios from 'axios';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.properties);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/properties/user/wishlist');
        dispatch(setWishlist(res.data.properties));
      } catch (error) {
        console.error('Error fetching wishlist', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-neutral-900 justify-between page-fade-in">
      <Navbar />

      <main className="flex-grow px-6 py-10 md:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Heart className="h-7 w-7 text-brand fill-brand" />
            <span>Your Wishlist</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
            A compilation of your favorite stays saved from searches.
          </p>

          {loading ? (
            <div className="flex justify-center p-12 text-neutral-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-neutral-50 p-4 dark:bg-neutral-850">
                <Heart className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Your wishlist is empty</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                When searching, click the heart icon on properties to save them here.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
              {wishlist.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
