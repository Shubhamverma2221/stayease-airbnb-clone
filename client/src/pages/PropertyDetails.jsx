import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSingleSuccess, fetchFailure } from '../redux/propertySlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WeatherWidget from '../components/WeatherWidget';
import MapContainer from '../components/MapContainer';
import PropertyCard from '../components/PropertyCard';
import TravelChecklist from '../components/TravelChecklist';
import CurrencyConverter from '../components/CurrencyConverter';
import AIItinerary from '../components/AIItinerary';
import ThreeSixtyTour from '../components/ThreeSixtyTour';
import { Star, Wifi, Car, BatteryCharging, ShieldAlert, Award, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.properties);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [reviewSummary, setReviewSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleToggleAddon = (addonName) => {
    if (selectedAddons.includes(addonName)) {
      setSelectedAddons(selectedAddons.filter(a => a !== addonName));
    } else {
      setSelectedAddons([...selectedAddons, addonName]);
    }
  };

  // Reviews list states
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/properties/${id}`);
        dispatch(fetchSingleSuccess(res.data.property));
        setNearbyPlaces(res.data.nearbyPlaces);

        // Fetch smart recommendations
        try {
          const recsRes = await axios.get('/api/properties', {
            params: { category: res.data.property.category, limit: 4 }
          });
          const filtered = recsRes.data.properties.filter(p => p._id !== id).slice(0, 3);
          setRecommendations(filtered);
        } catch (recsErr) {
          console.error('Failed to fetch recommendations', recsErr);
        }

        // Fetch reviews
        const reviewsRes = await axios.get(`/api/reviews/property/${id}`);
        const loadedReviews = reviewsRes.data.reviews || [];
        setReviews(loadedReviews);

        // Fetch AI reviews summary
        if (loadedReviews.length > 0) {
          try {
            setLoadingSummary(true);
            const summaryRes = await axios.post('/api/ai/reviews-summary', { propertyId: id });
            setReviewSummary(summaryRes.data.summary);
          } catch (sumErr) {
            console.error('Failed to load AI reviews summary:', sumErr.message);
          } finally {
            setLoadingSummary(false);
          }
        }
      } catch (err) {
        dispatch(fetchFailure(err.response?.data?.message || 'Error fetching details'));
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, dispatch]);

  const handleBookingRequest = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    try {
      const res = await axios.post('/api/bookings', {
        propertyId: id,
        checkIn,
        checkOut,
        guestsCount,
        addons: selectedAddons,
      });

      // Redirect to Checkout page with new booking details
      navigate(`/checkout?bookingId=${res.data.booking._id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Booking creation failed');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    // Attempt to match review to booking if possible
    // Note: For demo simplicity, we can fetch user's completed bookings for this property,
    // and grab the first matching booking ID.
    setLoadingReview(true);
    try {
      const bookingsRes = await axios.get('/api/bookings');
      const matchedBooking = bookingsRes.data.bookings.find(
        (b) => b.property._id === id && (b.status === 'Confirmed' || b.status === 'Completed')
      );

      if (!matchedBooking) {
        alert('Verification failed: You must have a confirmed/completed trip at this listing to review it.');
        return;
      }

      await axios.post('/api/reviews', {
        propertyId: id,
        bookingId: matchedBooking._id,
        rating,
        comment: reviewComment,
      });

      // Reload reviews
      const reviewsRes = await axios.get(`/api/reviews/property/${id}`);
      setReviews(reviewsRes.data.reviews);
      setReviewComment('');
      alert('Review posted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Review post failed');
    } finally {
      setLoadingReview(false);
    }
  };

  if (loading || !selectedProperty) {
    return (
      <div className="flex min-h-screen flex-col ambient-bg justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12 text-neutral-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  const hostImg = selectedProperty.host?.profilePicture
    ? selectedProperty.host.profilePicture.startsWith('http')
      ? selectedProperty.host.profilePicture
      : `http://localhost:5000${selectedProperty.host.profilePicture}`
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  const coverImgUrl = selectedProperty.coverImage?.startsWith('http')
    ? selectedProperty.coverImage
    : `http://localhost:5000${selectedProperty.coverImage}`;

  return (
    <div className="flex min-h-screen flex-col ambient-bg page-fade-in">
      <Navbar />

      <main className="flex-1 px-6 py-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              {selectedProperty.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1 font-bold">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {selectedProperty.averageRating > 0 ? selectedProperty.averageRating : 'New'}
              </span>
              <span>·</span>
              <span className="underline font-semibold cursor-pointer">{reviews.length} reviews</span>
              <span>·</span>
              <span className="underline font-semibold">{selectedProperty.address.formattedAddress}</span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="mt-6 overflow-hidden rounded-[2rem] shadow-lg grid grid-cols-1 md:grid-cols-2 gap-2 border dark:border-neutral-800">
            <div className="aspect-[4/3] w-full overflow-hidden mirror-glow relative">
              <img 
                src={coverImgUrl} 
                alt={selectedProperty.title} 
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" 
              />
              <button
                onClick={() => setIsTourOpen(true)}
                className="absolute bottom-5 right-5 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-4.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-900 shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 dark:bg-neutral-900/90 dark:text-white"
              >
                <span>🌐 Start 360° VR Tour</span>
              </button>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-2">
              {selectedProperty.images?.slice(0, 4).map((img, idx) => (
                <div key={idx} className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 mirror-glow relative">
                  <img
                    src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                    alt="Gallery item"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Main Info Blocks */}
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
            
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Host and Capacity info */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-6 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Entire place hosted by {selectedProperty.host?.name || 'Host'}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedProperty.guestsCapacity} guests · {selectedProperty.bedrooms} bedrooms · {selectedProperty.bathrooms} bathrooms
                  </p>
                </div>
                <img src={hostImg} alt="Host Profile" className="h-12 w-12 rounded-full object-cover border-2 border-brand" />
              </div>

              {/* Verified Badge / Highlights */}
              <div className="space-y-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                {selectedProperty.host?.superhost && (
                  <div className="flex items-start gap-4">
                    <Award className="h-6 w-6 text-brand" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-950 dark:text-white">Superhost</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Superhosts are experienced, highly rated hosts dedicated to providing great stays.</p>
                    </div>
                  </div>
                )}
                {selectedProperty.wifiSpeed > 0 && (
                  <div className="flex items-start gap-4">
                    <Wifi className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-950 dark:text-white">Fast Wifi</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">At {selectedProperty.wifiSpeed} Mbps, you can take video calls and stream videos.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-b border-neutral-100 pb-6 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white">About this space</h3>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {selectedProperty.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="border-b border-neutral-100 pb-6 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-950 dark:text-white">What this place offers</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {selectedProperty.amenities?.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="text-lg">✓</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Places */}
              {nearbyPlaces && (
                <div className="border-b border-neutral-100 pb-6 dark:border-neutral-800">
                  <h3 className="text-lg font-bold text-neutral-950 dark:text-white">Nearby Locations & Attractions</h3>
                  <p className="text-xs text-neutral-500 mb-4">Explore local attractions within proximity of your stay.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cafes & Restaurants */}
                    <div className="rounded-2xl p-4 ios-glass">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                        ☕ Cafes & Dining
                      </h4>
                      <div className="space-y-2 text-xs">
                        {nearbyPlaces.cafes?.map((cafe, i) => (
                          <div key={i} className="flex justify-between font-medium">
                            <span>{cafe.name}</span>
                            <span className="text-neutral-400">{cafe.distance}</span>
                          </div>
                        ))}
                        {nearbyPlaces.restaurants?.map((rest, i) => (
                          <div key={i} className="flex justify-between font-medium">
                            <span>{rest.name}</span>
                            <span className="text-neutral-400">{rest.distance}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transit & Points of Interest */}
                    <div className="rounded-2xl p-4 ios-glass">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                        🚇 Transit & Sights
                      </h4>
                      <div className="space-y-2 text-xs">
                        {nearbyPlaces.metroStations?.map((metro, i) => (
                          <div key={i} className="flex justify-between font-medium">
                            <span>{metro.name}</span>
                            <span className="text-neutral-400">{metro.distance}</span>
                          </div>
                        ))}
                        {nearbyPlaces.touristAttractions?.map((tour, i) => (
                          <div key={i} className="flex justify-between font-medium flex-col sm:flex-row">
                            <span>{tour.name}</span>
                            <span className="text-neutral-400">{tour.distance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live weather details */}
              <WeatherWidget weather={selectedProperty.weather} coordinates={selectedProperty.location?.coordinates} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TravelChecklist category={selectedProperty.category} />
                <CurrencyConverter priceInINR={selectedProperty.pricePerNight} />
              </div>

              {/* Travel Services Ecosystem Add-ons */}
              <div className="rounded-3xl p-6 ios-glass shadow-lg space-y-4">
                <div className="border-b pb-3 dark:border-neutral-800">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">Travel Services Add-ons</h3>
                  <p className="text-[10px] text-neutral-500 font-medium">Add premium travel services directly to your stay reservation</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Option 1: Airport Pickup */}
                  <button
                    type="button"
                    onClick={() => handleToggleAddon('Airport Pickup')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition ${
                      selectedAddons.includes('Airport Pickup')
                        ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                        : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-800 dark:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">✈️</span>
                    <h5 className="text-[11px] font-black uppercase tracking-wider">Airport Pickup</h5>
                    <p className="text-[9px] text-neutral-450 mt-0.5">INR 1,200 flat rate</p>
                  </button>

                  {/* Option 2: Car Rental */}
                  <button
                    type="button"
                    onClick={() => handleToggleAddon('Premium Car Rental')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition ${
                      selectedAddons.includes('Premium Car Rental')
                        ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                        : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-800 dark:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">🚗</span>
                    <h5 className="text-[11px] font-black uppercase tracking-wider">Car Rental</h5>
                    <p className="text-[9px] text-neutral-450 mt-0.5">INR 3,500 / day</p>
                  </button>

                  {/* Option 3: Local Guide */}
                  <button
                    type="button"
                    onClick={() => handleToggleAddon('Local Tour Guide')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition ${
                      selectedAddons.includes('Local Tour Guide')
                        ? 'border-brand bg-brand/5 text-brand dark:bg-brand/10'
                        : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-800 dark:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">🗺️</span>
                    <h5 className="text-[11px] font-black uppercase tracking-wider">Local Guide</h5>
                    <p className="text-[9px] text-neutral-450 mt-0.5">INR 1,800 / day</p>
                  </button>
                </div>
              </div>

              <AIItinerary propertyId={id} />

              {/* Maps representation */}
              <div className="h-96 w-full rounded-3xl overflow-hidden border border-neutral-100 shadow-md dark:border-neutral-800">
                <MapContainer properties={[selectedProperty]} />
              </div>

            </div>

            {/* Right Booking Card */}
            <div>
              <div className="sticky top-28 rounded-3xl ios-glass p-6 shadow-2xl">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">INR {selectedProperty.pricePerNight}</span>
                    <span className="text-neutral-500 dark:text-neutral-400"> / night</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>{selectedProperty.averageRating > 0 ? selectedProperty.averageRating : 'New'}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-neutral-350 dark:border-neutral-700 overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-neutral-350 dark:border-neutral-700">
                    <div className="p-3 border-r border-neutral-350 dark:border-neutral-700">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="mt-1 w-full bg-transparent text-xs font-semibold outline-none text-neutral-850 dark:text-white cursor-pointer"
                      />
                    </div>
                    <div className="p-3">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="mt-1 w-full bg-transparent text-xs font-semibold outline-none text-neutral-850 dark:text-white cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                      Guests
                    </label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="mt-1 w-full bg-transparent text-xs font-semibold outline-none text-neutral-800 dark:text-white cursor-pointer"
                    >
                      <option value="1" className="bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white">1 guest</option>
                      <option value="2" className="bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white">2 guests</option>
                      <option value="4" className="bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white">4 guests</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic pricing breakdown based on dates & selected add-ons */}
                {(() => {
                  const getNumNights = () => {
                    if (!checkIn || !checkOut) return 0;
                    const start = new Date(checkIn);
                    const end = new Date(checkOut);
                    const diff = end.getTime() - start.getTime();
                    const nightsCount = Math.ceil(diff / (1000 * 3600 * 24));
                    return nightsCount > 0 ? nightsCount : 0;
                  };

                  const nightsCount = getNumNights();
                  if (nightsCount <= 0) return null;

                  const baseTotal = nightsCount * selectedProperty.pricePerNight;
                  let addonsTotal = 0;
                  if (selectedAddons.includes('Airport Pickup')) addonsTotal += 1200;
                  if (selectedAddons.includes('Premium Car Rental')) addonsTotal += 3500 * nightsCount;
                  if (selectedAddons.includes('Local Tour Guide')) addonsTotal += 1800 * nightsCount;
                  const cleaning = selectedProperty.cleaningFee || 0;
                  const service = selectedProperty.serviceFee || 0;
                  const tax = Math.round(baseTotal * 0.12);
                  const totalCost = baseTotal + cleaning + service + tax + addonsTotal;

                  return (
                    <div className="mt-4 pt-4 border-t border-dashed dark:border-neutral-700 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-350 animate-scale-in">
                      <div className="flex justify-between">
                        <span>INR {selectedProperty.pricePerNight} x {nightsCount} nights</span>
                        <span className="font-bold text-neutral-900 dark:text-white">INR {baseTotal.toLocaleString()}</span>
                      </div>
                      {selectedAddons.length > 0 && (
                        <div className="flex justify-between text-brand dark:text-brand-light">
                          <span>Travel Add-ons</span>
                          <span className="font-bold">INR {addonsTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {(cleaning > 0 || service > 0) && (
                        <div className="flex justify-between">
                          <span>Cleaning & Service fees</span>
                          <span>INR {(cleaning + service).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Local occupancy taxes (12%)</span>
                        <span>INR {tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 font-black text-neutral-900 dark:text-white text-sm">
                        <span>Total Price (INR)</span>
                        <span className="text-brand font-black">INR {totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={handleBookingRequest}
                  className="mt-6 w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-brand-dark hover:scale-102 active:scale-98 shadow-md hover:shadow-brand/20"
                >
                  Reserve Listing
                </button>
                <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  You won't be charged yet. Secure checkout will verify payment.
                </p>
              </div>
            </div>

          </div>

          {/* Reviews List & Feedback Forms */}
          <div className="mt-12 border-t border-neutral-100 pt-8 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span>{selectedProperty.averageRating > 0 ? selectedProperty.averageRating : 'New'} · {reviews.length} reviews</span>
            </h3>

            {/* AI Review Summary Insights Card */}
            {reviews.length > 0 && (
              <div className="mt-5 rounded-3xl p-5 border border-brand/10 bg-brand/5 dark:bg-brand/10 dark:border-brand/20 space-y-2.5 animate-scale-in">
                <div className="flex items-center gap-2 text-brand">
                  <span className="text-base">✨</span>
                  <span className="text-xs font-black uppercase tracking-wider">StayEase AI Review Insight</span>
                </div>
                {loadingSummary ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
                    <span>AI is analyzing guest feedback...</span>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-750 dark:text-neutral-300 leading-relaxed font-semibold italic">
                    "{reviewSummary}"
                  </p>
                )}
              </div>
            )}

            {/* List */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((r) => {
                const authorImg = r.author?.profilePicture
                  ? r.author.profilePicture.startsWith('http')
                    ? r.author.profilePicture
                    : `http://localhost:5000${r.author.profilePicture}`
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                
                return (
                  <div key={r._id} className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <img src={authorImg} alt={r.author?.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <h4 className="text-sm font-bold dark:text-white">{r.author?.name || 'Guest'}</h4>
                        <span className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                      {r.comment}
                    </p>
                    {r.sentimentLabel && (
                      <span className="inline-block text-[9px] bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 rounded-full px-2 py-0.5 font-bold uppercase">
                        AI Verified: {r.sentimentLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Review form */}
            {user && (
              <form onSubmit={handleReviewSubmit} className="mt-10 border-t border-neutral-100 pt-8 dark:border-neutral-800 max-w-xl">
                <h4 className="text-base font-bold text-neutral-900 dark:text-white">Leave a Review</h4>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 p-2.5 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white cursor-pointer"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Terrible)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Comment</label>
                    <textarea
                      rows="4"
                      placeholder="Share your stay experience..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingReview}
                    className="rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-16 border-t border-neutral-100 pt-10 dark:border-neutral-800">
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-1.5">
                People Also Liked
              </h3>
              <p className="text-xs text-neutral-500 mb-6">Similar stays matching the category "{selectedProperty.category}"</p>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <ThreeSixtyTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        imageUrl={selectedProperty.threeSixtyImage}
      />

      <Footer />
    </div>
  );
};

export default PropertyDetails;
