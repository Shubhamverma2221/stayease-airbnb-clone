const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // load dotenv from server directory

const mockProperties = (hostId) => {
  const categoriesList = ['Trending', 'Beachfront', 'Cabins', 'Countryside', 'Pools', 'Lakefront', 'Modern', 'Castles', 'Islands', 'Design'];
  
  const descriptors = ["Serene", "Cozy", "Luxury", "Bespoke", "Grand", "Charming", "Stunning", "Peaceful", "Elegant", "Scenic", "Hidden", "Majestic", "Royal", "Tranquil", "Breathtaking", "Sunny", "Alpine", "Tropical", "Modernist", "Wabi-Sabi"];
  
  const features = ["Private Deck", "Wood Fireplace", "Panoramic Views", "Infinity Pool", "Hot Tub", "Boating Dock", "Butler Service", "Chef Kitchen", "Veranda", "Organic Gardens", "Cliffside Views", "Stargazing Skylight", "Traditional Meals", "Smart Home Tech", "Spa Retreat", "Sunset View", "Nature Trails", "Private Beach", "Valet Parking", "EV Charging"];
  
  const propertyTypes = {
    'Trending': ['Glass Dome', 'Eco-Haven', 'A-Frame Sanctuary', 'Sky Villa', 'Loft Space', 'Design Retreat'],
    'Beachfront': ['Ocean Villa', 'Beach Bungalow', 'Sand Cabin', 'Seaside Chalet', 'Coastal Cottage'],
    'Cabins': ['Timber Lodge', 'Log Cabin', 'Alpine Retreat', 'A-Frame Hideout', 'Woodland Nest'],
    'Countryside': ['Farmhouse Stay', 'Mud House', 'Meadow Cottage', 'Valley Ranch', 'Barn Retreat'],
    'Pools': ['Infinity Mansion', 'Plunge Pool Oasis', 'Resort Estate', 'Lagoon Villa', 'Pool Pavilion'],
    'Lakefront': ['Boathouse', 'Lake Cottage', 'Floating Loft', 'Lakeside Manor', 'Waterfront Cabin'],
    'Modern': ['Concrete Loft', 'Glass Skybox', 'Minimalist Penthouse', 'Smart Villa', 'Architect House'],
    'Castles': ['Heritage Fortress', 'Palace Wing Suite', 'Medieval Tower', 'Royal Manor', 'Chateau Stay'],
    'Islands': ['Water Bungalow', 'Private Island Hut', 'Eco Lagoon Retreat', 'Island Bungalow'],
    'Design': ['Pop Art Studio', 'Teakwood Villa', 'Geometric Loft', 'Designer Pavilion', 'Wabi-Sabi Sanctuary']
  };

  const categoryImages = {
    'Trending': [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?auto=format&fit=crop&w=800&q=80'
    ],
    'Beachfront': [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
    ],
    'Cabins': [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=800&q=80'
    ],
    'Countryside': [
      'https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'
    ],
    'Pools': [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
    ],
    'Lakefront': [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
    ],
    'Modern': [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
    ],
    'Castles': [
      'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    ],
    'Islands': [
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505881506029-4b055811d161?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
    ],
    'Design': [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ]
  };

  const citiesData = [
    { city: 'Goa', state: 'Goa', lat: 15.5804, lng: 73.7553, zip: '403001' },
    { city: 'Manali', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887, zip: '175131' },
    { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.6824, zip: '313001' },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.8189, zip: '302001' },
    { city: 'Wayanad', state: 'Kerala', lat: 11.6854, lng: 76.0896, zip: '673121' },
    { city: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1743, zip: '171001' },
    { city: 'Coorg', state: 'Karnataka', lat: 12.4244, lng: 75.7378, zip: '571201' },
    { city: 'Lonavala', state: 'Maharashtra', lat: 18.7544, lng: 73.4071, zip: '410401' },
    { city: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lng: 70.9126, zip: '345001' },
    { city: 'Nainital', state: 'Uttarakhand', lat: 29.3912, lng: 79.4635, zip: '263001' },
    { city: 'Mumbai', state: 'Maharashtra', lat: 18.9220, lng: 72.8315, zip: '400001' },
    { city: 'Bangalore', state: 'Karnataka', lat: 12.9719, lng: 77.6412, zip: '560038' },
    { city: 'Lakshadweep', state: 'Lakshadweep', lat: 10.5667, lng: 72.6417, zip: '682555' },
    { city: 'Alleppey', state: 'Kerala', lat: 9.4981, lng: 76.3388, zip: '688001' },
    { city: 'Pondicherry', state: 'Pondicherry', lat: 11.9338, lng: 79.8340, zip: '605001' },
    { city: 'Varkala', state: 'Kerala', lat: 8.7360, lng: 76.7065, zip: '695141' },
    { city: 'Gokarna', state: 'Karnataka', lat: 14.5204, lng: 74.3168, zip: '581326' },
    { city: 'Kodaikanal', state: 'Tamil Nadu', lat: 10.2381, lng: 77.4908, zip: '624101' },
    { city: 'Bir Billing', state: 'Himachal Pradesh', lat: 32.0402, lng: 76.7176, zip: '176077' },
    { city: 'Alibaug', state: 'Maharashtra', lat: 18.7188, lng: 72.8778, zip: '402201' }
  ];

  const categoryCities = {
    'Beachfront': ['Goa', 'Lakshadweep', 'Pondicherry', 'Varkala', 'Gokarna', 'Alibaug'],
    'Islands': ['Lakshadweep', 'Alleppey', 'Goa', 'Varkala'],
    'Lakefront': ['Udaipur', 'Nainital', 'Alleppey', 'Kodaikanal'],
    'Cabins': ['Manali', 'Shimla', 'Coorg', 'Wayanad', 'Gokarna', 'Bir Billing'],
    'Countryside': ['Wayanad', 'Shimla', 'Coorg', 'Kodaikanal', 'Bir Billing'],
    'Castles': ['Jaipur', 'Udaipur', 'Jaisalmer'],
    'Pools': ['Goa', 'Jaipur', 'Jaisalmer', 'Lonavala', 'Bangalore', 'Mumbai', 'Alibaug'],
    'Modern': ['Mumbai', 'Bangalore', 'Lonavala', 'Goa'],
    'Trending': ['Lonavala', 'Manali', 'Udaipur', 'Wayanad', 'Mumbai', 'Bir Billing', 'Goa'],
    'Design': ['Pondicherry', 'Goa', 'Bangalore', 'Jaipur', 'Mumbai']
  };

  const categoryAmenities = {
    'Beachfront': ['Beach Access', 'Wi-Fi', 'Air Conditioning', 'Pool', 'Kitchen'],
    'Cabins': ['Wi-Fi', 'Fireplace', 'Heater', 'Kitchen', 'Mountain View'],
    'Countryside': ['Breakfast Included', 'Mountain View', 'Hiking Trails', 'Hammock', 'Wi-Fi'],
    'Lakefront': ['Wi-Fi', 'Air Conditioning', 'Kitchen', 'Lake View', 'Boating Dock'],
    'Pools': ['Wi-Fi', 'Pool', 'Air Conditioning', 'Kitchen', 'Dedicated Workspace'],
    'Castles': ['Wi-Fi', 'Air Conditioning', 'Butler Service', 'Historic Tours', 'Palace Garden Access'],
    'Islands': ['Wi-Fi', 'Private Beach Access', 'Snorkeling Gear', 'Air Conditioning'],
    'Modern': ['Wi-Fi', 'Air Conditioning', 'Kitchen', 'Smart Home Controls', 'Gym'],
    'Trending': ['Wi-Fi', 'Air Conditioning', 'Hot Tub', 'Fireplace', 'Modern Design'],
    'Design': ['Wi-Fi', 'Air Conditioning', 'Designer Furniture', 'Artistic Decor', 'Kitchen']
  };

  const propertiesList = [];

  // Generate 20 properties per category
  categoriesList.forEach((category) => {
    const images = categoryImages[category] || categoryImages['Trending'];
    const types = propertyTypes[category] || propertyTypes['Trending'];
    const amenities = categoryAmenities[category] || ['Wi-Fi', 'Air Conditioning'];
    const allowedCityNames = categoryCities[category] || ['Goa', 'Manali', 'Udaipur'];
    const filteredCities = citiesData.filter(c => allowedCityNames.includes(c.city));

    for (let i = 0; i < 20; i++) {
      const cityObj = filteredCities[i % filteredCities.length];
      const desc = descriptors[(i + category.length) % descriptors.length];
      const type = types[i % types.length];
      const feat = features[(i * 3) % features.length];
      const title = `${desc} ${type} with ${feat}`;
      
      const offsetLat = (i % 5 - 2) * 0.006;
      const offsetLng = (Math.floor(i / 5) - 2) * 0.006;

      const pricePerNight = 2500 + ((i * 1234) % 15000);
      const cleaningFee = Math.floor(pricePerNight * 0.06);
      const serviceFee = Math.floor(pricePerNight * 0.04);
      const securityDeposit = Math.floor(pricePerNight * 0.3);

      propertiesList.push({
        host: hostId,
        title,
        description: `Experience the finest lodging in this ${title.toLowerCase()}. Nestled in a premium location in ${cityObj.city}, it provides state-of-the-art details, absolute privacy, and easy accessibility. Features include ${amenities.join(', ')}. Ideal for family trips or couples seeking a perfect retreat.`,
        category,
        coverImage: images[i % images.length],
        images: [
          images[(i + 1) % images.length],
          images[(i + 2) % images.length]
        ],
        bedrooms: 1 + (i % 4),
        bathrooms: 1 + Math.floor(i % 3),
        guestsCapacity: 2 + (i % 6),
        pricePerNight,
        cleaningFee,
        serviceFee,
        securityDeposit,
        address: {
          street: `${10 + i * 3} ${category} Lane`,
          city: cityObj.city,
          state: cityObj.state,
          country: 'India',
          zipCode: cityObj.zip,
          formattedAddress: `${10 + i * 3} ${category} Lane, ${cityObj.city}, ${cityObj.state}, India`
        },
        location: {
          type: 'Point',
          coordinates: [cityObj.lng + offsetLng, cityObj.lat + offsetLat]
        },
        wifiSpeed: 50 + (i * 20) % 250,
        parkingAvailable: i % 2 === 0,
        evCharging: i % 3 === 0,
        amenities,
        rules: [`Keep noise minimal after 10 PM`, `No smoking indoors`, `Check-out by 11 AM`],
        cancellationPolicy: i % 2 === 0 ? 'Moderate' : 'Strict',
        averageRating: parseFloat((4.2 + (i % 9) * 0.1).toFixed(1)),
        reviewsCount: 5 + (i * 7) % 50,
        isApproved: true
      });
    }
  });

  return propertiesList;
};

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/airbnb_clone';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Property.deleteMany();

    // Create a default administrator/host user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@airbnb.com',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      isHostApproved: true,
      superhost: true
    });
    console.log('Admin/Host user created: admin@airbnb.com / password123');

    // Create properties linked to adminUser
    const properties = mockProperties(adminUser._id);
    await Property.create(properties);
    console.log('Mock properties seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
