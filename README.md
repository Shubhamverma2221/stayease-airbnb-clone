# StayEase

StayEase is a production-focused Airbnb-style MERN platform with guest, host, and admin experiences. It includes authentication with refresh-token cookies, property discovery, bookings, Razorpay and Stripe payment wiring, real-time chat, maps, weather, analytics, reviews, wishlists, notifications, dark mode, multilingual UI, and responsive dashboards.

## Features

- **Advanced Authentication**: JWT authentication with refresh tokens, email verification, forgot/reset password, change password, avatar uploads, Google Authenticator (TOTP) based 2FA, and registration welcome emails.
- **Mobile Authentication**: Support for registering and signing in via mobile phone number as an alternative to email address.
- **Frosted Glassmorphism Design**: High-fidelity iOS-inspired white frosted glass theme (`.ios-glass`) with mirror refraction highlights and smooth scaling behaviors over colorful ambient mesh backdrops.
- **Property Discovery**: Discovery with search, filters, location-aware proximity results, maps, live weather widgets, wishlists, and category navigators (Beachfront, Cabins, Lakefront, Castles, Countryside).
- **Host Tooling**: Tooling for listing creation, pricing controls, availability checks, booking management, revenue analytics, and reservation dashboards.
- **Admin Tooling**: Management portal for approvals, moderation, fraud signals, analytics, and platform management.
- **Real-Time Communication**: Socket.io server-client wiring for instant host-guest chat rooms and live notification events.
- **Payments**: Razorpay signature validation and payment order wiring (with Stripe configurations).

## Screenshots

Screenshots can be added after local setup with real property data and media uploads.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

## Running Locally

1. Start MongoDB locally or provide a managed MongoDB connection string.
2. Configure Google Maps, OpenWeather, Cloudinary, SMTP, and payment credentials in `.env`.
3. Run `npm install` at the repository root.
4. Run `npm run seed` to seed default administrators (`admin@airbnb.com` / `password123`) and expanded property listings.
5. Run `npm run dev` to start the client and server concurrently.

## Environment Variables

The root `.env.example` file includes both backend and Vite client variables for:

- MongoDB and application URLs
- JWT secrets and cookie settings
- SMTP email delivery
- Cloudinary uploads
- Google Maps and weather APIs
- Razorpay and Stripe payments

## Folder Structure

```text
client/  React + Vite frontend
server/  Express + MongoDB backend
docs/    Architecture and implementation notes
```

## Deployment

- Frontend: Vercel, Netlify, Cloudflare Pages, or any static hosting that supports Vite builds.
- Backend: Render, Railway, Fly.io, EC2, or container platforms.
- Database: MongoDB Atlas or a self-managed MongoDB deployment.
- Media: Cloudinary.
- Payments: Razorpay and Stripe accounts with verified webhook URLs.

## Future Improvements

- Dedicated mobile app clients
- Advanced fraud scoring backed by external risk signals
- Richer itinerary planning and transport APIs
- Web push notifications and offline booking history sync

## License

MIT

## Author

Shubham Verma

GitHub: [Shubhamverma2221/stayease-airbnb-clone](https://github.com/Shubhamverma2221/stayease-airbnb-clone)
