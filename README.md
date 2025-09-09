# Tuk Tuk Eazy - Passenger App

A modern, mobile-first ride-sharing application built with React, TypeScript, and Supabase. Designed specifically for the Indonesian market with Tuk Tuk (auto-rickshaw) transportation.

## Features

- 🔐 **Secure Authentication** - Email/password auth with role-based access control
- 🗺️ **Interactive Maps** - Google Maps integration with Places Autocomplete
- 🚗 **Real-time Tracking** - Live ride updates and driver location tracking
- 💳 **Secure Payments** - Stripe integration with IDR currency support
- 📱 **Mobile-First Design** - Optimized for mobile devices with large touch targets
- ⚡ **Real-time Updates** - Supabase Realtime for live ride status updates
- 🎯 **Production Ready** - Comprehensive error handling, validation, and monitoring
- 🌏 **Localized** - Designed for Indonesian market with proper currency formatting

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Maps**: Google Maps JavaScript API
- **Payments**: Stripe
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel, Netlify, or any static hosting

## Live Demo

🚀 **[Try the Live Demo](https://tuktukeazy.netlify.app)**

### Demo Credentials
- **Email**: demo@tuktukeazy.com
- **Password**: demo123

> Note: This is a demo environment. Real payments are disabled and rides are simulated.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project
- Google Maps API key
- Stripe account (test mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tuk-tuk-passenger-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
   ```

4. **Set up Supabase database** (Click "Connect to Supabase" in the app)
   
   Run the migration file in your Supabase SQL editor:
   ```sql
   -- See supabase/migrations/create_schema.sql
   ```

5. **Deploy Supabase Edge Functions**

6. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── api.ts          # API client with error handling
│   ├── constants.ts    # App configuration constants
│   ├── errors.ts       # Custom error classes
│   ├── security.ts     # Security utilities
│   ├── validation.ts   # Input validation
│   └── performance.ts  # Performance monitoring
├── pages/              # Page components
└── supabase/
    ├── functions/      # Edge functions
    └── migrations/     # Database migrations
```

## Key Features

### Authentication & Security
- Email/password authentication with Supabase Auth
- Role-based access control (riders only)
- Input validation and sanitization
- Rate limiting and security headers
- Error boundary for graceful error handling

### Maps & Location
- Google Maps integration with custom styling
- Places Autocomplete for address selection
- Real-time driver location tracking
- Distance calculation and fare estimation
- Coordinate validation

### Real-time Features
- Live ride status updates
- Driver location tracking
- Payment status monitoring
- Network status detection

### Payments
- Stripe Checkout integration
- Secure payment processing
- Payment status tracking
- Error handling for failed payments

### Performance
- Code splitting and lazy loading
- Image optimization utilities
- Performance monitoring
- Bundle size optimization
- Caching strategies

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | Yes |

## Deployment

### Quick Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

---

## Database Schema

The app uses the following main tables:
- `profiles` - User profiles with role information
- `rides` - Ride requests and tracking
- `driver_locations` - Real-time driver positions
- `payments` - Payment records
- `ratings` - Ride ratings and feedback

## API Endpoints

### Supabase Edge Functions
- `POST /functions/v1/stripe` - Create Stripe checkout session

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## Security

- All user inputs are validated and sanitized
- Environment variables are properly configured
- HTTPS is enforced in production
- Content Security Policy headers are implemented
- Rate limiting is applied to prevent abuse

---

## Performance

- Bundle size is optimized with code splitting
- Images are compressed and optimized
- API calls are cached and retried on failure
- Performance metrics are tracked
- Lazy loading is implemented for non-critical components

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

---

## Changelog

### v1.0.1 (Latest)
- 🎨 Enhanced UI/UX with better animations and feedback
- 🌏 Added Indonesian Rupiah (IDR) currency support
- 🗺️ Improved map marker management and performance
- 🔧 Production optimizations and error handling
- 📱 Better mobile responsiveness

## License

This project is licensed under the MIT License.