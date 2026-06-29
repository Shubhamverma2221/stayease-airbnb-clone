import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleWishlistState } from '../redux/propertySlice';
import axios from 'axios';

const PropertyCard = ({ property }) => {
  const { user } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.properties);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isSaved = wishlist.some((p) => p._id === property._id);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setLoadingWishlist(true);
    try {
      await axios.post(`/api/properties/${property._id}/wishlist`);
      dispatch(toggleWishlistState(property._id));
    } catch (error) {
      console.error('Error toggling wishlist', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const displayImage = property.coverImage?.startsWith('http')
    ? property.coverImage
    : `http://localhost:5000${property.coverImage}`;

  return (
    <div className="group relative flex flex-col gap-3 rounded-3xl ios-glass p-3 shadow-sm apple-3d-card mirror-glow animate-fade-in cursor-pointer">
      
      {/* Cover Image Slider Container */}
      <Link to={`/properties/${property._id}`} className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-inner">
        <img
          src={displayImage}
          alt={property.title}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={handleWishlist}
          disabled={loadingWishlist}
          className="absolute right-3 top-3 rounded-full p-2.5 bg-white/90 dark:bg-neutral-900/90 text-neutral-600 shadow hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors duration-200 ${
              isSaved ? 'fill-brand text-brand' : 'text-neutral-500 dark:text-neutral-300'
            }`}
          />
        </button>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 rounded-full bg-neutral-900/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md uppercase tracking-wider">
          {property.category}
        </div>
      </Link>

      {/* Details info */}
      <Link to={`/properties/${property._id}`} className="flex flex-col gap-1 px-1 py-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 text-base">
            {property.address.city}, {property.address.country}
          </h3>
          <div className="flex items-center gap-1 text-sm font-semibold dark:text-neutral-350">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{property.averageRating > 0 ? property.averageRating : 'New'}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
          {property.title}
        </p>

        {property.distanceFromUser && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-brand dark:text-brand-light">
            <MapPin className="h-3.5 w-3.5" />
            <span>{property.distanceFromUser} away</span>
          </p>
        )}

        <div className="mt-2 flex items-baseline gap-1 text-sm">
          <span className="font-extrabold text-neutral-900 dark:text-white text-base">INR {property.pricePerNight}</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-xs">/ night</span>
        </div>
      </Link>

    </div>
  );
};

export default PropertyCard;
