# DefenDDoS Frontend

A modern, professional Next.js dashboard for real-time DDoS protection and threat monitoring.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API running on `http://localhost:8082`
- ML Service running on `http://localhost:8000` (optional)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3001`

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
defenddos-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── traffic/           # Traffic monitoring
│   │   ├── threat-detection/  # Threat detection
│   │   ├── blocked-ips/       # IP management
│   │   ├── system/            # System health
│   │   ├── admin/             # Admin panel
│   │   └── analytics/         # Analytics
│   ├── components/            # React components
│   │   ├── layout/           # Layout components (Header, Sidebar)
│   │   ├── charts/           # Data visualizations
│   │   ├── ui/               # UI components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── hooks/                # Custom React hooks
│   │   ├── useBackendApi.ts  # Main API hooks (React Query)
│   │   ├── useDefenDDoS.ts   # Legacy hooks (being migrated)
│   │   └── useConnection.ts  # Connection monitoring
│   ├── lib/                  # Utilities and configurations
│   │   ├── defenddos-api.ts  # API client
│   │   └── utils.ts          # Helper functions
│   ├── contexts/             # React contexts
│   │   └── ThemeContext.tsx  # Theme management
│   └── styles/               # Global styles
│       └── globals.css       # Tailwind + custom styles
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🎨 Features

### ✅ Implemented
- **Real-time Dashboard** - Live threat monitoring with auto-refresh
- **Traffic Monitoring** - Network traffic analysis and visualization
- **Threat Detection** - ML-powered attack detection
- **IP Management** - Block/unblock malicious IPs
- **System Health** - Backend and ML service monitoring
- **Theme Support** - Light/Dark/System themes
- **Responsive Design** - Mobile-first approach
- **Glass Morphism** - Modern UI effects
- **Smooth Animations** - Framer Motion transitions

### 🔧 Technologies
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.6
- **State Management**: React Query v5 (TanStack Query)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📡 API Integration

The frontend connects to two services:

1. **Backend API** (`http://localhost:8082`)
   - Security dashboard data
   - Traffic statistics
   - Mitigation management
   - Threat intelligence

2. **ML Service** (`http://localhost:8000`)
   - Attack predictions
   - Model health status

### Available Hooks

```typescript
// Main hooks (recommended)
import {
  useDashboardData,
  useBackendHealth,
  useMLHealth,
  useSecurityDashboard,
  useRealtimeMetrics,
  useBlockedIPs,
  useMitigationStats,
  useTrafficSummary,
  useTrafficVisualization,
} from '@/hooks/useBackendApi';

// API client
import { defenddosAPI } from '@/lib/defenddos-api';
```

## 🎯 Key Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Main security dashboard |
| `/traffic` | Traffic monitoring and ingestion |
| `/threat-detection` | Attack detection and analysis |
| `/blocked-ips` | Manage blocked IP addresses |
| `/system` | System health and diagnostics |
| `/admin` | Administrative settings |
| `/analytics` | Traffic analytics and reports |

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8082
NEXT_PUBLIC_ML_URL=http://localhost:8000
```

### API Endpoints
All endpoints are configured in `src/lib/defenddos-api.ts`

## 🎨 Theming

The app supports three theme modes:
- **Light** - Clean, professional light theme
- **Dark** - Modern dark theme with glass effects
- **System** - Auto-detect from OS

Themes are managed through `ThemeContext` and use CSS variables for consistency.

## 🐛 Error Handling

- **Network Errors**: Gracefully handled with user-friendly messages
- **Connection Status**: Real-time indicator in bottom-right
- **Auto-retry**: Failed requests retry with exponential backoff
- **Fallback UI**: Partial data displayed when services are unavailable

## 📖 Documentation

- **Architecture** - See `ARCHITECTURE.md`
- **Connection Guide** - See `CONNECTION_GUIDE.md`
- **Frontend Fixes** - See `FRONTEND_FIXES_COMPLETE.md`
- **Security Guide** - See `SECURITY_GUIDE.md`
- **Documentation Index** - See `DOCUMENTATION_INDEX.md`

## 🧪 Development

### Code Style
- ESLint configuration in `eslint.config.mjs`
- Prettier configuration in `.prettierrc`
- TypeScript strict mode enabled

### Best Practices
- Use semantic color tokens from `ThemeContext`
- Leverage React Query for all API calls
- Follow component composition patterns
- Implement proper error boundaries
- Use TypeScript for type safety

## 🚨 Troubleshooting

### Backend Not Connecting
1. Verify backend is running: `http://localhost:8082/actuator/health`
2. Check CORS configuration
3. Review browser console for errors

### ML Service Unavailable
- ML service is optional
- Dashboard continues working with reduced functionality
- Connection status indicator shows service health

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
pnpm install
pnpm build
```

## 📝 License

This project is part of the DefenDDoS security suite.

## 🤝 Contributing

1. Follow the existing code style
2. Write TypeScript with proper types
3. Test all changes locally
4. Ensure responsive design works on mobile

---

**Status**: ✅ Production Ready

Last Updated: 2025-01-19
