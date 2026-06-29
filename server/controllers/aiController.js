const Property = require('../models/Property');

// @desc    Conversational Context-Aware AI Chatbot
// @route   POST /api/ai/chat
// @access  Public
exports.chatWithAI = async (req, res, next) => {
  try {
    const { message, propertyId } = req.body;
    let contextProperty = null;

    if (propertyId) {
      contextProperty = await Property.findById(propertyId).populate('host', 'name superhost');
    }

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (hasGemini || hasOpenAI) {
      try {
        let responseText = '';
        let promptText = '';

        if (contextProperty) {
          promptText = `You are a warm, helpful, and professional AI Travel Concierge for the StayEase platform.
Listing Details:
Title: ${contextProperty.title}
Location: ${contextProperty.address.city}, ${contextProperty.address.country}
Price: INR ${contextProperty.pricePerNight}
Amenities: ${(contextProperty.amenities || []).join(', ')}
Guests Capacity: ${contextProperty.guestsCapacity}
Bedrooms: ${contextProperty.bedrooms} | Bathrooms: ${contextProperty.bathrooms}
WiFi Speed: ${contextProperty.wifiSpeed || 'Standard'} Mbps
Host Name: ${contextProperty.host?.name || 'Partner Host'}

Guest inquiry: "${message}"

Please respond directly to the guest's inquiry. Keep your response concise (maximum 3 sentences) and highly informative.`;
        } else {
          promptText = `You are a helpful, professional, and friendly AI Assistant for the StayEase platform.
You help users with general platform questions like:
- 2-Factor Authentication (2FA) setup or settings
- Host registration and listing creation
- Razorpay / Stripe payment safety
- Cancellation guidelines

User query: "${message}"

Please respond directly. Keep your response warm and concise (maximum 3 sentences).`;
        }

        if (hasOpenAI) {
          const { OpenAI } = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: promptText }],
            max_tokens: 150
          });
          responseText = completion.choices[0].message.content.trim();
        } else {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(promptText);
          responseText = result.response.text().trim();
        }

        return res.status(200).json({ success: true, response: responseText, realAI: true });
      } catch (aiErr) {
        console.error('Real AI call failed, falling back to mock:', aiErr.message);
      }
    }

    // --- FALLBACK MOCK CHATBOT LOGIC ---
    const msg = message?.toLowerCase() || '';
    let responseText = '';

    if (contextProperty) {
      const title = contextProperty.title;
      const city = contextProperty.address.city;
      const price = contextProperty.pricePerNight;
      const amenities = contextProperty.amenities || [];
      const wifi = contextProperty.wifiSpeed || 0;
      const hostName = contextProperty.host?.name || 'our partner host';
      const isSuperhost = contextProperty.host?.superhost || false;

      if (msg.includes('pool') || msg.includes('swim') || msg.includes('water')) {
        const hasPool = amenities.some(a => a.toLowerCase().includes('pool'));
        responseText = hasPool
          ? `Yes, ${title} features a private swimming pool! Perfect for cooling off. The weather currently is 24°C, which makes for a delightful swim.`
          : `Unfortunately, ${title} does not list a swimming pool in its amenities. However, you can enjoy other features like the spacious lounge and garden.`;
      } 
      else if (msg.includes('weather') || msg.includes('temp') || msg.includes('rain') || msg.includes('forecast')) {
        responseText = `The current weather in ${city} is 24°C, partly cloudy with 62% humidity. The forecast mentions a 10% chance of light showers today.`;
      } 
      else if (msg.includes('host') || msg.includes('superhost') || msg.includes('owner')) {
        responseText = isSuperhost
          ? `Your host, ${hostName}, is a verified Superhost! They have excellent ratings and are dedicated to providing outstanding stays.`
          : `Your host is ${hostName}. They are committed to guest satisfaction. Let us know if you need to contact them directly!`;
      } 
      else if (msg.includes('price') || msg.includes('cost') || msg.includes('pay') || msg.includes('night') || msg.includes('inr')) {
        responseText = `The price for ${title} is INR ${price} per night (excluding booking fees). You can check target currencies (USD, EUR, GBP) using our live currency estimator on the details panel!`;
      } 
      else if (msg.includes('wifi') || msg.includes('internet') || msg.includes('net') || msg.includes('speed')) {
        responseText = wifi > 0
          ? `Yes, high-speed WiFi is available at ${wifi} Mbps! Perfect for streaming and remote work.`
          : `WiFi is available at the property for standard browsing. Check with the host if you have heavy streaming requirements.`;
      }
      else if (msg.includes('park') || msg.includes('car') || msg.includes('parking') || msg.includes('garage')) {
        const hasParking = amenities.some(a => a.toLowerCase().includes('park') || a.toLowerCase().includes('garage'));
        responseText = hasParking
          ? `Yes, free secure parking is included with your stay at ${title}!`
          : `Street parking or paid parking is available nearby. Please coordinate with ${hostName} for specific parking spot guidelines.`;
      }
      else if (msg.includes('itinerary') || msg.includes('day') || msg.includes('plan') || msg.includes('schedule')) {
        responseText = `I can help you build an itinerary! Click the "Generate AI Itinerary" tab right on the details panel to view a full, beautifully formatted 3-day travel plan for ${city}.`;
      }
      else if (msg.includes('amenit') || msg.includes('offer') || msg.includes('kitchen') || msg.includes('ac') || msg.includes('heat')) {
        responseText = `${title} offers amenities including: ${amenities.join(', ')}.`;
      }
      else {
        responseText = `I'm your AI concierge for ${title} in ${city}. Feel free to ask me about pool access, WiFi speed, host details, price per night, local attractions, or weather forecasts!`;
      }
    } else {
      if (msg.includes('2fa') || msg.includes('security') || msg.includes('factor') || msg.includes('otp')) {
        responseText = `StayEase supports secure 2-Factor Authentication (2FA) via Google Authenticator or Email OTP. You can activate or manage this in the profile dropdown menu in the header.`;
      }
      else if (msg.includes('pay') || msg.includes('razorpay') || msg.includes('stripe') || msg.includes('card')) {
        responseText = `We process payments securely using Razorpay and Stripe with support for major cards. Stays are instantly confirmed after successful checkout.`;
      }
      else if (msg.includes('host') || msg.includes('earn') || msg.includes('become')) {
        responseText = `To become a host and list your properties, click "Become a Host" in the header dropdown menu. You will gain access to listing managers, revenue analytics, and reservation checkers.`;
      }
      else {
        responseText = `Welcome to StayEase Help Center! I am your AI assistant. Ask me about: 2-Factor Authentication (2FA), host registration, payment integrations, or booking cancellations. Or open any listing card to get tailored itinerary ideas for that home!`;
      }
    }

    res.status(200).json({ success: true, response: responseText });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a custom 3-day itinerary based on property details
// @route   POST /api/ai/itinerary
// @access  Public
exports.generateItinerary = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const city = property.address.city;
    const cat = property.category || 'Trending';

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (hasGemini || hasOpenAI) {
      try {
        const promptText = `Create a custom, detailed 3-day travel itinerary for a guest staying at:
Property: ${property.title}
Location: ${city}, ${property.address.country}
Category: ${cat}
Description: ${property.description}

You must return the response STRICTLY as a valid JSON array matching the following schema structure, with no markdown code block backticks (no \`\`\`json or similar):
[
  {
    "day": 1,
    "title": "Arrival & Local Vibe",
    "schedule": [
      { "time": "11:00 AM", "event": "Welcome Check-in", "description": "Short description of morning check-in and settling in details." },
      { "time": "02:30 PM", "event": "Afternoon Outing", "description": "Short description of afternoon activities close to the property." },
      { "time": "07:30 PM", "event": "Dinner Feast", "description": "Short description of dining options nearby." }
    ]
  },
  {
    "day": 2,
    "title": "Deep Dive & Adventure",
    "schedule": [
      { "time": "09:00 AM", "event": "Main Activity", "description": "Detailed description of a major local excursion." },
      { "time": "01:30 PM", "event": "Lunch & Relax", "description": "Description of local dining spot and afternoon downtime." },
      { "time": "06:30 PM", "event": "Sunset Magic", "description": "Sunset views or evening fireside chats description." }
    ]
  },
  {
    "day": 3,
    "title": "Farewell Stay",
    "schedule": [
      { "time": "08:30 AM", "event": "Morning Walk", "description": "Quiet morning relaxation details." },
      { "time": "01:00 PM", "event": "Souvenir Shopping", "description": "Exploring local shops before heading out." },
      { "time": "04:00 PM", "event": "Checkout Departure", "description": "Final checkout and leaving with warm memories." }
    ]
  }
]`;

        let rawText = '';
        if (hasOpenAI) {
          const { OpenAI } = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: promptText }],
            max_tokens: 800
          });
          rawText = completion.choices[0].message.content.trim();
        } else {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(promptText);
          rawText = result.response.text().trim();
        }

        // Clean up markdown markers if present
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const itinerary = JSON.parse(rawText);
        return res.status(200).json({ success: true, city, category: cat, itinerary, realAI: true });
      } catch (aiErr) {
        console.error('Real AI itinerary generation failed, falling back to mock:', aiErr.message);
      }
    }

    // --- FALLBACK MOCK ITINERARY LOGIC ---
    let activities = {};
    if (cat.includes('Beach') || cat.includes('Island')) {
      activities = {
        day1: {
          morning: 'Check in & settle. Sip coconut water on the sun loungers.',
          afternoon: 'Stroll down Sunny Sands Public Beach. Feel the warm breeze.',
          evening: 'Sunset dinner at The Bistro Gourmet with fresh seafood.'
        },
        day2: {
          morning: 'Scuba diving lesson or boat trip to a nearby lagoon.',
          afternoon: 'Lunch at Green Garden Salad Cafe. Explore beachside local shops.',
          evening: 'Beach bonfire, watching stars, and enjoying ocean views.'
        },
        day3: {
          morning: 'Morning yoga on the beach deck. Take a swim in the sea/pool.',
          afternoon: 'Visit local lighthouse / heritage sites.',
          evening: 'Prepare for checkout. Cozy dinner on the private balcony.'
        }
      };
    } else if (cat.includes('Cabin') || cat.includes('Country') || cat.includes('Lake')) {
      activities = {
        day1: {
          morning: 'Welcome check-in. Cozy up next to the warm fireplace.',
          afternoon: 'Take a light hiking trail around the property woodland.',
          evening: 'Warm rustic dinner. Enjoy outdoor bonfire under the stars.'
        },
        day2: {
          morning: 'Birdwatching trek. Capture stunning photography of the valley.',
          afternoon: 'Picnic lunch near the creek/lake. Kayak on the water.',
          evening: 'Relaxing outdoor hot tub session. BBQ grilling on the deck.'
        },
        day3: {
          morning: 'Watch the sunrise mist rise over the mountains with fresh coffee.',
          afternoon: 'Visit local heritage clocktower or organic farms.',
          evening: 'Checkout and departure with warm memories.'
        }
      };
    } else {
      activities = {
        day1: {
          morning: 'Settle in. Sip premium tea in the glass dining room.',
          afternoon: 'Visit the Museum of Fine Modern Arts (0.8 km away).',
          evening: 'Premium fine dining dinner at The Bistro Gourmet.'
        },
        day2: {
          morning: 'Guided architectural tour of historical monuments & Clocktower.',
          afternoon: 'Explore downtown designer shops. Cafe hopping at Brew & Beans.',
          evening: 'Cocktail lounge experience at the stay, overlooking city lights.'
        },
        day3: {
          morning: 'Morning walk in the private botanical gardens.',
          afternoon: 'Souvenir shopping. Lunch at Green Garden Salad Cafe.',
          evening: 'Check out and head to the airport.'
        }
      };
    }

    const itinerary = [
      {
        day: 1,
        title: 'Arrival & Local Vibe',
        schedule: [
          { time: '11:00 AM', event: 'Welcome & Check-in', description: activities.day1.morning },
          { time: '02:30 PM', event: 'Local Exploration', description: activities.day1.afternoon },
          { time: '07:30 PM', event: 'Evening Feast', description: activities.day1.evening }
        ]
      },
      {
        day: 2,
        title: 'Deep Dive & Adventure',
        schedule: [
          { time: '09:00 AM', event: 'Main Experience', description: activities.day2.morning },
          { time: '01:30 PM', event: 'Lunch & Relax', description: activities.day2.afternoon },
          { time: '06:00 PM', event: 'Sunset Magic', description: activities.day2.evening }
        ]
      },
      {
        day: 3,
        title: 'Farewell StayEase',
        schedule: [
          { time: '08:30 AM', event: 'Morning Rituals', description: activities.day3.morning },
          { time: '01:00 PM', event: 'Cultural Outing', description: activities.day3.afternoon },
          { time: '04:00 PM', event: 'Departure Checkout', description: activities.day3.evening }
        ]
      }
    ];

    res.status(200).json({ success: true, city, category: cat, itinerary });
  } catch (error) {
    next(error);
  }
};

const Review = require('../models/Review');

// @desc    Generate AI review summary for a property
// @route   POST /api/ai/reviews-summary
// @access  Public
exports.summarizeReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const reviews = await Review.find({ property: propertyId });
    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        summary: 'No reviews posted yet for this listing. Be the first to share your experience!'
      });
    }

    const commentList = reviews.map(r => `* Rating: ${r.rating}/5 - "${r.comment}"`).join('\n');

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (hasGemini || hasOpenAI) {
      try {
        const promptText = `Analyze the following guest reviews for a StayEase rental property titled "${property.title}" located in ${property.address.city}.
Reviews:
${commentList}

Please generate a professional, objective 2-sentence summary of guest feedback, highlighting what guests loved most and any minor criticisms. Keep it under 200 characters.`;

        let summaryText = '';
        if (hasOpenAI) {
          const { OpenAI } = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: promptText }],
            max_tokens: 100
          });
          summaryText = completion.choices[0].message.content.trim();
        } else {
          const { GoogleGenerativeAI } = require('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(promptText);
          summaryText = result.response.text().trim();
        }

        return res.status(200).json({ success: true, summary: summaryText, realAI: true });
      } catch (aiErr) {
        console.error('AI Review Summarization failed, falling back to mock:', aiErr.message);
      }
    }

    // --- FALLBACK MOCK SUMMARIZATION ---
    const avgRating = property.averageRating || 5;
    let summaryText = `Guests generally rated this stay highly (${avgRating}/5). `;
    if (property.category === 'Beachfront') {
      summaryText += 'They loved the stunning coastal views and fast wifi access, though some noted sea breeze humidity.';
    } else if (property.category === 'Pools') {
      summaryText += 'Many reviews praised the pristine swimming pool and warm hospitality, with minor suggestions for parking.';
    } else {
      summaryText += 'Praise centered around the cozy interior layouts, modern utilities, and convenient check-in process.';
    }

    res.status(200).json({ success: true, summary: summaryText, realAI: false });
  } catch (error) {
    next(error);
  }
};
