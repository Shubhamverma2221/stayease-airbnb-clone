const Property = require('../models/Property');
const Wishlist = require('../models/Wishlist');
const uploadImage = require('../utils/uploadImage');

// Helper: Calculate distance between two coordinates using Haversine formula (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Generate Mock Nearby Places
const getMockNearbyPlaces = (lat, lng) => {
  return {
    restaurants: [
      { name: 'The Bistro Gourmet', type: 'Italian', distance: '0.4 km', rating: 4.8 },
      { name: 'Green Garden Salad Cafe', type: 'Vegan', distance: '0.9 km', rating: 4.5 },
    ],
    cafes: [
      { name: 'Brew & Beans', distance: '0.2 km', wifi: '50 Mbps', rating: 4.6 },
      { name: 'The Roasted Mug', distance: '0.6 km', wifi: '100 Mbps', rating: 4.7 },
    ],
    hospitals: [{ name: 'City Central Medical Clinic', distance: '1.5 km' }],
    atms: [{ name: 'Global Bank ATM', distance: '0.3 km' }],
    metroStations: [{ name: 'Central Boulevard Metro Line A', distance: '1.1 km' }],
    airports: [{ name: 'Metropolitan International Airport (MET)', distance: '12.4 km' }],
    beaches: [{ name: 'Sunny Sands Public Beach', distance: '2.5 km' }],
    touristAttractions: [
      { name: 'Historical Heritage Clocktower', type: 'Monument', distance: '1.2 km' },
      { name: 'Museum of Fine Modern Arts', type: 'Museum', distance: '0.8 km' },
    ],
  };
};

// Helper: Mock Weather Data
const getMockWeatherData = (city) => {
  return {
    liveWeather: {
      temperature: 24, // Celsius
      humidity: 62, // %
      aqi: 45, // Good
      rainForecast: '10% chance of light showers',
      condition: 'Partly Cloudy',
    },
    sevenDayForecast: [
      { day: 'Mon', temp: 24, condition: 'Sunny' },
      { day: 'Tue', temp: 25, condition: 'Sunny' },
      { day: 'Wed', temp: 23, condition: 'Partly Cloudy' },
      { day: 'Thu', temp: 22, condition: 'Rainy' },
      { day: 'Fri', temp: 24, condition: 'Cloudy' },
      { day: 'Sat', temp: 26, condition: 'Sunny' },
      { day: 'Sun', temp: 27, condition: 'Sunny' },
    ],
  };
};

// @desc    Get all properties (filters, search, pagination)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res, next) => {
  try {
    const {
      category,
      city,
      country,
      guestsCount,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      amenities,
      sortBy,
      page = 1,
      limit = 12,
      userLat,
      userLng,
      maxDistance = 10, // km
    } = req.query;

    const query = {};
    if (req.query.host) {
      query.host = req.query.host;
    } else {
      query.isApproved = true;
    }

    // Standard Filters
    if (category) query.category = category;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (country) query['address.country'] = new RegExp(country, 'i');
    if (guestsCount) query.guestsCapacity = { $gte: Number(guestsCount) };
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: Number(bathrooms) };

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    // Amenities filter
    if (amenities) {
      const amenitiesList = amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }

    // Geolocation Proximity Search (if user coords are passed)
    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance * 1000, // MongoDB expects meters
        },
      };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    let sort = { createdAt: -1 }; // default newest
    if (sortBy === 'price_asc') sort = { pricePerNight: 1 };
    if (sortBy === 'price_desc') sort = { pricePerNight: -1 };
    if (sortBy === 'rating') sort = { averageRating: -1 };

    const properties = await Property.find(query)
      .populate('host', 'name profilePicture superhost')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const totalProperties = await Property.countDocuments(query);

    // Calculate distance for each property if user location provided (and we didn't use $near)
    let processedProperties = properties.map((p) => {
      let distance = null;
      if (userLat && userLng) {
        const pLat = p.location.coordinates[1];
        const pLng = p.location.coordinates[0];
        distance = calculateDistance(parseFloat(userLat), parseFloat(userLng), pLat, pLng);
      }
      return {
        ...p.toObject(),
        distanceFromUser: distance ? `${distance.toFixed(1)} km` : null,
      };
    });

    res.status(200).json({
      success: true,
      count: processedProperties.length,
      totalPages: Math.ceil(totalProperties / Number(limit)),
      currentPage: Number(page),
      properties: processedProperties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res, next) => {
  try {
    const { userLat, userLng } = req.query;
    const property = await Property.findById(req.params.id).populate('host', 'name profilePicture bio superhost createdAt');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Live weather integrations
    const weather = getMockWeatherData(property.address.city);

    // Get nearby listings / places
    const pLng = property.location.coordinates[0];
    const pLat = property.location.coordinates[1];
    const nearbyPlaces = getMockNearbyPlaces(pLat, pLng);

    // Calculate user distance if provided
    let distanceFromUser = null;
    if (userLat && userLng) {
      distanceFromUser = calculateDistance(parseFloat(userLat), parseFloat(userLng), pLat, pLng);
    }

    res.status(200).json({
      success: true,
      property: {
        ...property.toObject(),
        distanceFromUser: distanceFromUser ? `${distanceFromUser.toFixed(1)} km` : null,
        weather,
        nearbyPlaces,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create property listing
// @route   POST /api/properties
// @access  Private (Host/Admin)
exports.createProperty = async (req, res, next) => {
  try {
    // Check if host is approved
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only hosts can create property listings' });
    }

    const {
      title,
      description,
      category,
      bedrooms,
      bathrooms,
      guestsCapacity,
      pricePerNight,
      cleaningFee,
      serviceFee,
      securityDeposit,
      street,
      city,
      state,
      country,
      zipCode,
      latitude,
      longitude,
      amenities,
      rules,
      cancellationPolicy,
      wifiSpeed,
      parkingAvailable,
      evCharging,
    } = req.body;

    // Handle uploaded file images
    let coverImage = '';
    const images = [];

    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        coverImage = await uploadImage(req.files.coverImage[0]);
      }
      if (req.files.images) {
        for (const file of req.files.images) {
          const imgUrl = await uploadImage(file);
          images.push(imgUrl);
        }
      }
    }

    // Default coordinates in case not sent
    const latVal = parseFloat(latitude) || 40.7128;
    const lngVal = parseFloat(longitude) || -74.0060;

    const property = await Property.create({
      host: req.user.id,
      title,
      description,
      category,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      guestsCapacity: Number(guestsCapacity),
      pricePerNight: Number(pricePerNight),
      cleaningFee: Number(cleaningFee) || 0,
      serviceFee: Number(serviceFee) || 0,
      securityDeposit: Number(securityDeposit) || 0,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
      address: {
        street,
        city,
        state,
        country,
        zipCode,
        formattedAddress: `${street ? street + ', ' : ''}${city}, ${state ? state + ', ' : ''}${country}`,
      },
      location: {
        type: 'Point',
        coordinates: [lngVal, latVal],
      },
      wifiSpeed: Number(wifiSpeed) || 0,
      parkingAvailable: parkingAvailable === 'true' || parkingAvailable === true,
      evCharging: evCharging === 'true' || evCharging === true,
      amenities: typeof amenities === 'string' ? amenities.split(',') : amenities,
      rules: typeof rules === 'string' ? rules.split(',') : rules,
      cancellationPolicy: cancellationPolicy || 'Flexible',
    });

    res.status(201).json({ success: true, property, message: 'Property listing created successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update property listing
// @route   PUT /api/properties/:id
// @access  Private (Host/Admin)
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Verify ownership
    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this listing' });
    }

    const updates = { ...req.body };

    // Format nested structures if provided
    if (req.body.street || req.body.city || req.body.state || req.body.country || req.body.zipCode) {
      updates.address = {
        street: req.body.street || property.address.street,
        city: req.body.city || property.address.city,
        state: req.body.state || property.address.state,
        country: req.body.country || property.address.country,
        zipCode: req.body.zipCode || property.address.zipCode,
        formattedAddress: `${req.body.street || property.address.street || ''}, ${req.body.city || property.address.city}, ${req.body.country || property.address.country}`,
      };
    }

    if (req.body.latitude && req.body.longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    if (typeof req.body.amenities === 'string') {
      updates.amenities = req.body.amenities.split(',');
    }
    if (typeof req.body.rules === 'string') {
      updates.rules = req.body.rules.split(',');
    }

    // Images updates
    if (req.files) {
      if (req.files.coverImage && req.files.coverImage[0]) {
        updates.coverImage = await uploadImage(req.files.coverImage[0]);
      }
      if (req.files.images) {
        const newImages = [];
        for (const file of req.files.images) {
          const imgUrl = await uploadImage(file);
          newImages.push(imgUrl);
        }
        updates.images = [...property.images, ...newImages];
      }
    }

    property = await Property.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, property, message: 'Property details updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Host/Admin)
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle wishlist item
// @route   POST /api/properties/:id/wishlist
// @access  Private (Guest/Host/Admin)
exports.toggleWishlist = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, properties: [] });
    }

    const index = wishlist.properties.indexOf(propertyId);
    let added = false;

    if (index === -1) {
      wishlist.properties.push(propertyId);
      added = true;
    } else {
      wishlist.properties.splice(index, 1);
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      added,
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
      properties: wishlist.properties,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wishlist
// @route   GET /api/properties/user/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'properties',
      populate: { path: 'host', select: 'name superhost' },
    });

    res.status(200).json({
      success: true,
      properties: wishlist ? wishlist.properties : [],
    });
  } catch (error) {
    next(error);
  }
};
