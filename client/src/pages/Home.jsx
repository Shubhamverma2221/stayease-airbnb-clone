import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStart, fetchSuccess, fetchMoreSuccess, fetchFailure } from '../redux/propertySlice';
import PropertyCard from '../components/PropertyCard';
import MapContainer from '../components/MapContainer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Compass, Filter, Map, SlidersHorizontal, MapPin, Flame, Palmtree, Warehouse, Trees, Droplet, Ship, Sparkles, Castle, Palette } from 'lucide-react';
import axios from 'axios';

const categories = [
  { name: 'Trending', icon: Flame },
  { name: 'Beachfront', icon: Palmtree },
  { name: 'Cabins', icon: Warehouse },
  { name: 'Countryside', icon: Trees },
  { name: 'Pools', icon: Droplet },
  { name: 'Lakefront', icon: Ship },
  { name: 'Modern', icon: Sparkles },
  { name: 'Castles', icon: Castle },
  { name: 'Islands', icon: Compass },
  { name: 'Design', icon: Palette },
];

const Home = () => {
  const dispatch = useDispatch();
  const { properties, searchParams, loading } = useSelector((state) => state.properties);

  const [activeCategory, setActiveCategory] = useState('Trending');
  const [showMap, setShowMap] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Infinite Scroll Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Geolocation parameters
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Request browser user location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      (error) => {
        console.error('Error fetching location:', error);
        alert('Could not acquire location. Setting standard coordinate centers.');
        setGeoLoading(false);
      }
    );
  };

  // Reset pagination when active filter parameters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [activeCategory, searchParams, minPrice, maxPrice, userCoords]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (page === 1) {
        dispatch(fetchStart());
      }
      try {
        const params = {
          category: activeCategory !== 'All' ? activeCategory : undefined,
          city: searchParams.city || undefined,
          guestsCount: searchParams.guestsCount || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          page,
          limit: 12,
        };

        // If user coordinates exist, search relative to user location
        if (userCoords) {
          params.userLat = userCoords.latitude;
          params.userLng = userCoords.longitude;
        }

        const res = await axios.get('/api/properties', { params });
        const fetched = res.data.properties;

        if (page === 1) {
          dispatch(fetchSuccess(fetched));
        } else {
          dispatch(fetchMoreSuccess(fetched));
        }

        if (fetched.length < 12) {
          setHasMore(false);
        }
      } catch (error) {
        dispatch(fetchFailure(error.response?.data?.message || 'Failed to fetch properties'));
      }
    };

    fetchProperties();
  }, [activeCategory, searchParams, minPrice, maxPrice, userCoords, page, dispatch]);

  return (
    <div className="flex min-h-screen flex-col ambient-bg page-fade-in">
      <Navbar />

      {/* Categories header bar */}
      <div className="ios-glass sticky top-[68px] z-30 py-3 shadow-sm transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 md:px-12">
          <div className="flex flex-1 items-center gap-6 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => {
              const IconComponent = c.icon;
              return (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className={`flex flex-col items-center gap-2 border-b-2 pb-1.5 text-[10px] font-black uppercase tracking-wider category-tab-hover active:scale-95 dark:hover:text-white ${
                    activeCategory === c.name
                      ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                      : 'border-transparent text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  <IconComponent className="h-7 w-7 stroke-[1.5]" />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Location proximity query button */}
          <button
            onClick={handleRequestLocation}
            disabled={geoLoading}
            className={`flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-xs font-bold shadow-sm hover:shadow-md hover:scale-102 active:scale-98 transition-all duration-200 dark:border-neutral-750 dark:bg-neutral-850 dark:text-white dark:hover:bg-neutral-800 ${
              userCoords ? 'bg-brand/10 border-brand text-brand hover:bg-brand/20 dark:border-brand' : ''
            }`}
          >
            <MapPin className="h-4 w-4 text-brand" />
            <span>{geoLoading ? 'Acquiring...' : userCoords ? 'Proximity Active' : 'Search Nearby'}</span>
          </button>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-3 text-xs font-semibold shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white dark:hover:bg-neutral-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <main className="flex-1 px-6 py-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
              Stay in {activeCategory} properties
            </h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95 dark:bg-white dark:text-neutral-900"
            >
              <Map className="h-4 w-4" />
              <span>{showMap ? 'Show Listings Grid' : 'Show Interactive Map'}</span>
            </button>
          </div>

          {/* Map vs List display */}
          {showMap ? (
            <div className="h-[600px] w-full">
              <MapContainer
                properties={properties}
                userLocation={userCoords}
                onMarkerClick={(p) => navigate(`/properties/${p._id}`)}
              />
            </div>
          ) : (
            <>
              {loading ? (
                // Skeletons list
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array(8)
                    .fill(0)
                    .map((_, idx) => (
                      <div key={idx} className="flex flex-col gap-3">
                        <div className="aspect-square w-full animate-pulse-fast rounded-2xl bg-neutral-200 dark:bg-neutral-850"></div>
                        <div className="h-4 w-3/4 animate-pulse-fast rounded bg-neutral-250 dark:bg-neutral-800"></div>
                        <div className="h-3 w-1/2 animate-pulse-fast rounded bg-neutral-200 dark:bg-neutral-800"></div>
                      </div>
                    ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
                    <Compass className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No properties found</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Try adjusting your filters or search location parameters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {properties.map((p) => (
                    <PropertyCard key={p._id} property={p} />
                  ))}
                </div>
              )}

              {hasMore && !loading && properties.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-full bg-brand px-6 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark hover:scale-105 active:scale-95 shadow-md"
                  >
                    Load More Listings
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Filters Modal Dialog */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-850">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-850">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Price Range Filter</h3>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-855"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Min Price (INR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Max Price (INR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="flex-1 rounded-xl border border-neutral-250 py-3 text-sm font-semibold transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-white"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Home;
