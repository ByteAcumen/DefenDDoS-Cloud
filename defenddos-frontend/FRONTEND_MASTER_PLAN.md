# DefenDDoS-Cloud: Industry-Level Frontend Master Plan

## 🎯 Vision
Transform DefenDDoS into a world-class, open-source DDoS detection platform with:
- **Modern 3D UI/UX** (Three.js, GSAP, Framer Motion)
- **Smooth Animations** (Anime.js, Lottie, parallax scrolling)
- **Live Backend Integration** (Real-time API testing, WebSocket streams)
- **Interactive Documentation** (Swagger-like UI, code examples)
- **Performance Showcase** (Metrics, benchmarks, system efficiency)
- **User Testing Tools** (Built-in API playground, load testing)

## ⚠️ CRITICAL FIX COMPLETED
**Backend API URL Correction:**
- ❌ **OLD**: `http://localhost:8082` (WRONG PORT!)
- ✅ **NEW**: `http://localhost:8081` (CORRECT - matches backend server.port)
- 📁 **File Updated**: `src/lib/defenddos-api.ts`
- ✅ **Environment Variables Created**: `.env.local.example`

**Next Steps:**
1. Copy `.env.local.example` to `.env.local`
2. Verify backend is running on port 8081
3. Test API connection: `curl http://localhost:8081/actuator/health`

## 📊 Current State Analysis

### ✅ What We Have
- **Framework**: Next.js 15.5.4 with App Router (Turbopack enabled)
- **Styling**: Tailwind CSS 3.x with custom design system
- **State Management**: React Query (TanStack Query) v5.90.2
- **Animation Libraries**: 
  - GSAP 3.13.0 with @gsap/react
  - Anime.js 4.2.2
  - Framer Motion 12.23.24
  - Locomotive Scroll 4.1.4
  - Lottie React 2.4.1
- **3D Graphics** (✅ INSTALLED):
  - Three.js 0.182.0
  - @react-three/fiber 9.5.0
  - @react-three/drei 10.7.7
- **Smooth Scroll** (✅ INSTALLED):
  - Lenis 1.3.17 (modern smooth scroll)
  - @studio-freight/lenis 1.0.42 (legacy, deprecated)
- **Developer Tools** (✅ INSTALLED):
  - Socket.io Client 4.8.3 (WebSocket)
  - React Syntax Highlighter 16.1.0
  - React Markdown 10.1.0 + Remark GFM 4.0.1
  - @uiw/react-codemirror 4.25.4
- **Data Visualization**: Recharts 3.2.1
- **UI Components**: Headless UI, Heroicons, Lucide React
- **Backend Integration**: Axios client with 25 endpoint wrappers
- **Existing Pages**:
  - `/dashboard` - Real-time monitoring
  - `/traffic` - Traffic analysis
  - `/threat-detection` - ML predictions
  - `/blocked-ips` - IP management
  - `/analytics` - System analytics
  - `/api-test` - Basic endpoint testing
  - `/admin` - Admin panel
  - `/system` - System info

### ❌ What's Missing (To Implement)
- ❌ Modern landing page with 3D hero (files created, not integrated)
- ❌ Interactive API playground with code generation
- ❌ Comprehensive documentation hub with live examples
- ❌ Real-time WebSocket integration in dashboard
- ❌ Performance benchmarking dashboard
- ❌ Feature showcase sections with animations
- ❌ Smooth scroll implementation (Lenis integration)
- ❌ 3D network visualization in dashboard
- ❌ Attack geo-visualization on globe
- ❌ Code examples and tutorials

## 🏗️ Architecture Redesign

### New Route Structure
```
/                          → Modern landing page (3D hero, features)
/dashboard                 → Real-time monitoring hub
/features                  → Interactive feature showcase
/api-playground            → Live API testing tool
/documentation             → Interactive docs with examples
/performance               → System metrics & benchmarks
/demo                      → Live attack simulation viewer
/about                     → Technology stack showcase
```

### Component Architecture
```
src/
├── components/
│   ├── 3d/                # Three.js components
│   │   ├── Globe3D.tsx
│   │   ├── NetworkVisualization.tsx
│   │   └── ParticleField.tsx
│   ├── animations/        # GSAP/Anime.js animations
│   │   ├── ScrollReveal.tsx
│   │   ├── CounterAnimation.tsx
│   │   └── MorphingShape.tsx
│   ├── showcase/          # Feature demonstrations
│   │   ├── MLShowcase.tsx
│   │   ├── EndpointShowcase.tsx
│   │   └── SecurityShowcase.tsx
│   ├── playground/        # Interactive testing
│   │   ├── APITester.tsx
│   │   ├── ResponseViewer.tsx
│   │   └── CodeGenerator.tsx
│   └── landing/           # Landing page sections
│       ├── HeroSection.tsx
│       ├── FeaturesGrid.tsx
│       └── TechStack.tsx
```

## 🚀 Implementation Phases

### Phase 1: Dependencies & Setup ✅ COMPLETED
**Installed Packages:**
```bash
✅ three@0.182.0
✅ @react-three/fiber@9.5.0
✅ @react-three/drei@10.7.7
✅ lenis@1.3.17
✅ socket.io-client@4.8.3
✅ react-syntax-highlighter@16.1.0
✅ react-markdown@10.1.0
✅ remark-gfm@4.0.1
✅ @uiw/react-codemirror@4.25.4
✅ @types/react-syntax-highlighter@15.5.13
``` ⏳ IN PROGRESS
**Components to Create:**
1. **3D Hero Section** ⏳
   - ✅ Globe3D.tsx created with interactive globe
   - ✅ Particle field with color gradients
   - ✅ Auto-rotation with orbit controls
   - ⏳ Integration with attack data from backend
   - ⏳ Smooth camera movements with GSAP
   - ⏳ Create new `/` landing page route

2. **Features Grid** ❌
   - Create animated feature cards
   - Add Lottie animation icons
   - Implement parallax scrolling with Lenis
   - Showcase: ML models, Rate limiting, Auto-blocking, AWS WAF

3. **Statistics Counter** ❌
   - Use react-countup for animations
   - Real-time metrics: Threats blocked, Uptime, Accuracy, Requests/sec
   - Visual progress bars with GSAP
   - Connect to `/api/v1/statistics` endpoint

4. **Technology Stack Section** ❌
   - Animated tech logos (Spring Boot, Next.js, Python, InfluxDB)
   - Architecture diagram with hover  ❌ NOT STARTED
**Route:** `/api-playground`

**Components to Create:**
1. **API Request Builder** ❌
   - Method selector (GET, POST, PUT, DELETE)
   - Endpoint dropdown (all 25 endpoints)
   - Headers editor (API key, content-type)
   - Body editor with CodeMirror
   - Send reqEnhanced Dashboard (Day 3-4) ❌ NOT STARTED
**Route:** `/dashboard` (enhance existing)

**Enhancements to Implement:**
1. **3D Network Visualization** ❌
   - Integrate NetworkVisualization.tsx component
   - Show nodes: Backend, ML Service, InfluxDB, Redis, Kafka
   - Animate data flow between services
   - Color-code by health status (green/amber/red)

2. **Real-Time Updates (WebSocket)** ❌
   - Connect to `ws://localhost:8081/ws/traffic`
   - Listen for traffic updates every 30 seconds
   - Update charts without full page reload
   - Show "Live" indicator when connected

3. **ML Confidence Visualizer** ❌
   - Real-time confidence scores from predictions
   - Gauge charts for Random Forest & LSTM
   - Feature importance radar chart
   - Model comparison side-by-side ❌ NOT STARTED
**Route:** `/features`

**Sections to Build:**
1. **ML Models Showcase** ❌
   - **Live Prediction Demo**
     - Upload sample traffic data (CSV/JSON)
     - Real-time prediction with confidence score
     - Feature extraction visualization
     - Model decision explanation
   - **Model Comparison**
     - Side-by-side: Random Forest (99.2%) vs LSTM (Reconstruction)
     - Confusion matrix visualization
     - ROC curve and AUC score
     - Training time and inference speed
   - **Feature Importance**
     - Interactive bar chart (30 features)
     - Hover to see feature descriptions
     - Link to feature engineering docs

2. **Security Features** ❌ ❌ NOT STARTED
**Route:** `/documentation`

**Sections:**
1. **Getting Started** ❌
   - Quick start guide (3 commands to run)
   - System requirements
   - Docker setup walkthrough
   - First API call tutorial
   - Video walkthrough embed (YouTube/Loom)

2. **API Reference** ❌
   - Swagger-like UI with @uiw/react-codemirror
   - All 25 endpoints with:
     - Method, path, description
     - Request/response schemas
     - Example requests (cURL, Python, JS)
     - Try it out button → links to API Playground
   - Searchable/filterable
   - Group by category (Traffic, ML, Security, System)

3. **Architecture Guides** ❌
   - **System Architecture**
     - Interactive diagram (Three.js or SVG)
     - Component descriptions on hover
     - Data flow animations
   - **ML Pipeline**
     - Feature extraction → Model → Prediction flow
     - Model training process
     - Dataset information (CIC-IDS2017)
   - **Backend Architecture**
     - Spring Boot components
     - Database schema (InfluxDB)
     - Microservices communication

4. **Deployment Tutorials** ❌
   - **Local Development**
     - Step-by-step with screenshots
     - Troubleshooting common issues
   - **Docker Deployment**
     - Docker Compose walkthrough
     - Environment variables guide ❌ NOT STARTED

**Performance Optimization:**
- [ ] Code splitting with Next.js dynamic imports
  ```tsx
  const Globe3D = dynamic(() => import('@/components/3d/Globe3D'), { ssr: false });
  ```
- [ ] Lazy load heavy 3D components
- [ ] Image optimization (next/image)
- [ ] Bundle size analysis (`pnpm build && pnpm analyze`)
- [ ] Lighthouse score optimization (target: 95+)
- [ ] React Query cache optimization
- [ ] Debounce scroll events
- [ ] Memoize expensive computations

**Accessibility (WCAG 2.1 AA):**
- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels on buttons/links
- [ ] Focus indicators (outline on focus)
- [ ] Alt text on all images
- [ ] Color contrast ratio > 4.5:1
- [ ] Screen reader testing
- [ ] Skip to content link

**Mobile Responsiveness:**
- [ ] Test all pages on mobile (375px - 768px)
- [ ] Touch-friendly buttons (min 44px × 44px)
- [ ] Responsive 3D canvas sizing
- [ ] Mobile navigation menu
- [ ] Swipe gestures for carousels
- [ ] Optimize animations for mobile performance

**Theme Refinement:**
- [ ] Consistent dark/light mode across all pages
- [ ] Smooth theme transition animation
- [ ] Theme persistence (localStorage)
- [ ] Custom theme color picker (optional)
- [ ] High contrast mode support

**Loading States & Error Handling:**
- [ ] Skeleton loaders for all async data
- [ ] Error boundaries for 3D components
- [ ] Graceful fallbacks (no 3D → static image)
- [ ] Toast notifications for all actions
- [ ] Offline mode detection
- [ ] Retry mechanisms for failed requests

**Testing:**
- [ ] E2E tests with Cypress
  - Landing page user flow
  - API playground testing
  - Dashboard interactions
  - Documentation search
- [ ] Component tests (Jest + React Testing Library)
- [ ] Visual regression tests (Chromatic/Percy)
- [ ] Performance testing (Lighthouse CI)

**SEO & Meta Tags:**
- [ ] Open Graph tags
- [ ] Twitter Cards
- [ ] Favicon set (16x16, 32x32, Apple touch icon)
- [ ] robots.txt
- [ ] sitemap.xml
- [ ] Structured data (JSON-LD)
     - RDS/ElastiCache integration
     - AWS WAF configuration

5. **Code Examples** ❌
   - **Backend Integration**
     - Java/Python/JavaScript/TypeScript examples
     - Authentication flow
     - Error handling
   - **Frontend Integration**
     - React hooks examples
     - WebSocket connection
     - Real-time updates
   - **Testing Examples**
     - Unit tests
     - Integration tests
     - Load testing with k6

6. **Troubleshooting** ❌
   - Common errors and solutions
   - FAQ section
   - Performance optimization tips
   - Security best practices

**Features:**
- React Markdown for content rendering
- Syntax highlighting with react-syntax-highlighter
- Copy code button on all snippets
- Dark/light theme support
- Search functionality
- Table of contents sidebar
- Breadcrumb navigationblocked IPs
     - Auto-mitigation timeline
     - Unblock IP simulation
     - iptables rules display
   - **JWT Authentication**
     - Token generation flow diagram
     - Decode JWT claims viewer
     - Expiration countdown timer
   - **AWS WAF Integration**
     - IP set sync visualization
     - WAF rule status dashboard
     - Regional deployment map

3. **Performance Metrics** ❌
   - **Response Time Analysis**
     - Histogram of response times (p50, p95, p99)
     - Endpoint comparison chart
     - Time-series trend line
   - **Throughput Benchmarks**
     - Requests per second gauge
     - Load testing results (k6 tests)
     - Scalability curve
   - **Resource Utilization**
     - Docker container stats
     - CPU/Memory/Network usage
     - InfluxDB query performance

**Animation Features:**
- Scroll-triggered reveals with GSAP
- Interactive code snippets
- Animated data flows
- Hover effects on all card to Enhance:**
- `src/components/charts/DataVisualizations.tsx` - Add 3D options
- `src/components/dashboard/KPICard.tsx` - Add animations
- `src/app/dashboard/page.tsx` - Add WebSocket connection
3. **Code Generator** ❌
   - Generate cURL commands
   - Generate Python requests code
   - Generate JavaScript fetch/axios code
   - Generate Java RestTemplate code
   - Copy to clipboard functionality

4. **Request History** ❌
   - LocalStorage persistence
   - Recent requests list
   - Favorite requests
   - Share request as URL

5. **WebSocket Tester** ❌
   - Connect to `ws://localhost:8081/ws`
   - Send/receive messages
   - Connection status indicator
   - Message history

**Integration Points:**
- Connect to existing `defenddos-api.ts` client
- Use backend endpoints from `http://localhost:8081/api/v1/`
- Display endpoint documentation from OpenAPI speckey metrics
   - Real-time data from backend
   - Visual progress bars

### Phase 3: API Playground (Day 2-3)
**Features:**
- Live endpoint testing with request builder
- Response visualization (JSON, charts, tables)
- Code generation (cURL, Python, JavaScript, Java)
- Authentication token management
- Request history and favorites
- WebSocket connection tester

### Phase 4: Interactive Dashboard (Day 3-4)
**Enhancements:**
- 3D network visualization
- Real-time traffic flow animation
- ML model confidence visualizer
- Attack heatmap with geo-location
- WebSocket integration for live updates
- Performance metrics with sparklines

### Phase 5: Feature Showcase (Day 4-5)
**Sections:**
1. **ML Models Showcase**
   - Live predictions with confidence scores
   - Model comparison (Random Forest vs LSTM)
   - Training metrics visualization
   - Feature importance charts

2. **Security Features**
   - Rate limiting demonstration
   - IP blocking visualization
   - JWT authentication flow
   - AWS WAF integration demo

3. **Performance Metrics**
   - Response time charts
   - Throughput benchmarks
   - Resource utilization
   - Scalability tests

### Phase 6: Documentation Hub (Day 5-6)
**Features:**
- Interactive API reference (Swagger-like)
- Code examples with syntax highlighting
- Getting started guide
- Architecture diagrams
- Deployment tutorials
- Troubleshooting guides

### Phase 7: Polish & Optimization (Day 6-7)
**Tasks:**
- Performance optimization (code splitting, lazy loading)
- Accessibility improvements (WCAG compliance)
- Mobile responsiveness
- Dark/light theme refinement
- Loading states and error handling
- E2E testing with Cypress

## 🎨 Design System

### Color Palette (Dark Mode)
```css
--primary: #0ea5e9 (Sky Blue)
--secondary: #8b5cf6 (Purple)
--success: #10b981 (Green)
--warning: #f59e0b (Amber)
--danger: #ef4444 (Red)
--background: #0f172a (Dark Navy)
--surface: #1e293b (Slate)
--text: #f1f5f9 (Off-White)
```

### Animation Principles
- **Smooth**: 60fps animations with GPU acceleration
- **Purposeful**: Animations guide user attention
- **Responsive**: Adapts to user interactions
- **Performance**: Debounced scroll events, requestAnimationFrame

### Typography
- Headings: Inter, bold (font-bold)
- Body: Inter, regular (font-normal)
- Code: JetBrains Mono, monospace (font-mono)

## 📦 Key Libraries Usage

### Three.js / React Three Fiber
```tsx
// 3D Globe showing attack origins
<Canvas>
  <Globe 
    data={attackData}
    rotationSpeed={0.001}
    highlightColor="#ef4444"
  />
</Canvas>
```

### GSAP
```tsx
// Smooth scroll-triggered animations
useGSAP(() => {
  gsap.from('.feature-card', {
    y: 100,
    opacity: 0,
    stagger: 0.2,
    scrollTrigger: {
      trigger: '.features',
      start: 'top center'
    }
  });
});
```

### Anime.js
```tsx
// Morphing shapes and path animations
anime({
  targets: '.network-path',
  points: [/* animated SVG path */],
  easing: 'easeInOutQuad',
  duration: 2000,
  loop: true
});
```

### Lenis (Smooth Scroll)
```tsx
// Replace Locomotive Scroll with Lenis (better performance)
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});
```

## 🔌 Backend Integration Points

### Real-Time Data (WebSocket)
```typescript
// Connect to Spring Boot WebSocket
const socket = io('ws://localhost:8081', {
  path: '/ws',
  transports: ['websocket']
});

socket.on('traffic-update', (data) => {
  updateDashboard(data);
});
```

### All 25 API Endpoints
```typescript
// Showcase every backend endpoint
const endpoints = [
  { method: 'GET', path: '/api/v1/health', description: 'Health check' },
  { method: 'GET', path: '/api/v1/traffic', description: 'Traffic data' },
  { method: 'POST', path: '/api/v1/ml/predict', description: 'ML prediction' },
  { method: 'GET', path: '/api/v1/security/blocked-ips', description: 'Blocked IPs' },
  // ... all 25 endpoints
];
```

### Performance Metrics
```typescript
// Show system efficiency
interface SystemMetrics {
  avgResponseTime: number;    // ms
  requestsPerSecond: number;  // throughput
  mlAccuracy: number;         // 99.2%
  threatsDetected: number;    // count
  uptime: number;             // hours
}
```

## 📈 Success Metrics

### Performance Targets
| Metric | Target | Current | Tool |
|--------|--------|---------|------|
| Lighthouse Performance | 95+ | TBD | Chrome DevTools |
| First Contentful Paint | < 1.5s | TBD | Lighthouse |
| Largest Contentful Paint | < 2.5s | TBD | Lighthouse |
| Time to Interactive | < 3.5s | TBD | Lighthouse |
| Cumulative Layout Shift | < 0.1 | TBD | Lighthouse |
| Total Blocking Time | < 200ms | TBD | Lighthouse |
| Initial Bundle Size | < 500KB | TBD | webpack-bundle-analyzer |
| Animation FPS | 60fps | TBD | Chrome Performance |

### User Experience Goals
- [x] **Intuitive Navigation**: Users find features within 3 clicks
- [ ] **Mobile-First**: Works perfectly on 375px screens
- [ ] **Fast Loading**: All pages load in < 3 seconds
- [ ] **Smooth Animations**: No jank, 60fps consistently
- [ ] **Accessible**: WCAG 2.1 AA compliance (Level A minimum)
- [ ] **Error Recovery**: Clear error messages with actions
- [ ] **Offline Support**: Show offline indicator, queue requests

### Technical Excellence
- [x] **TypeScript Coverage**: 100% (all files use TypeScript)
- [ ] **Test Coverage**: 80%+ code coverage
  - [ ] Unit tests: 70%+
  - [ ] Integration tests: 60%+
  - [ ] E2E tests: 10 critical paths
- [x] **Documentation**: Every component has JSDoc comments
- [ ] **Error Boundaries**: No unhandled errors reach users
- [ ] **Security**: XSS prevention, CSRF tokens, CSP headers
- [ ] **SEO**: Proper meta tags, structured data, sitemap

### Feature Completeness
- [ ] **Landing Page**: 100% (7 sections)
  - [ ] Hero with 3D globe
  - [ ] Features grid
  - [ ] Statistics counter
  - [ ] Technology stack
  - [ ] Call-to-action
  - [ ] Footer
- [ ] **API Playground**: 100% (5 components)
  - [ ] Request builder
  - [ ] Response viewer
  - [ ] Code generator
  - [ ] History manager
  - [ ] WebSocket tester
- [ ] **Dashboard**: 80% (enhance existing)
  - [ ] 3D visualization
  - [ ] Real-time updates
  - [ ] ML confidence
  - [ ] Performance metrics
- [ ] **Documentation**: 100% (6 sections)
  - [ ] Getting started
  - [ ] API reference (25 endpoints)
  - [ ] Architecture guides
  - [ ] Deployment tutorials
  - [ ] Code examples
  - [ ] Troubleshooting
- [ ] **Feature Showcase**: 100% (3 sections)
  - [ ] ML models
  - [ ] Security features
  - [ ] Performance metrics

### Open Source Metrics (GitHub)
- [ ] **Stars**: Target 100+ in first month
- [ ] **Documentation**: Complete README, CONTRIBUTING, CODE_OF_CONDUCT
- [ ] **Issues**: Bug template, feature template, good first issue labels
- [ ] **CI/CD**: Automated tests, build, and deployment
- [ ] **License**: MIT or Apache 2.0
- [ ] **Community**: Active responses to issues/PRs

## 🎯 Priority Features

### Week 1: Foundation & Core Features
**Day 1-2: Landing Page** (8-10 hours)
- [x] Install dependencies (Three.js, Lenis, etc.)
- [x] Create 3D Globe component
- [x] Create Network Visualization component
- [ ] Build landing page route (`/`)
- [ ] Integrate Globe3D with hero section
- [ ] Add features grid with animations
- [ ] Implement statistics counter
- [ ] Add smooth scroll with Lenis

**Day 3-4: API Playground** (8-10 hours)
- [ ] Create `/api-playground` route
- [ ] Build request builder UI
- [ ] Implement response viewer with tabs
- [ ] Add code generator (cURL, Python, JS, Java)
- [ ] Create request history manager
- [ ] Add WebSocket tester
- [ ] Test with all 25 backend endpoints

**Day 5-6: Dashboard Enhancement** (8-10 hours)
- [ ] Add WebSocket integration
- [ ] Integrate 3D network visualization
- [ ] Build ML confidence visualizer
- [ ] Add attack geo-visualization
- [ ] Implement performance sparklines
- [ ] Add smooth scroll and animations
- [ ] Test real-time updates

**Day 7: Documentation Hub** (6-8 hours)
- [ ] Create `/documentation` route
- [ ] Build API reference with CodeMirror
- [ ] Add getting started guide
- [ ] Create architecture diagrams
- [ ] Add code examples library
- [ ] Implement search functionality

### Week 2: Enhancement & Polish
**Day 8-9: Feature Showcase** (8-10 hours)
- [ ] Create `/features` route
- [ ] Build ML models showcase
- [ ] Add security features demo
- [ ] Create performance metrics dashboard
- [ ] Add scroll-triggered animations
- [ ] Test all interactive elements

**Day 10-11: Optimization** (6-8 hours)
- [ ] Performance optimization (code splitting)
- [ ] Mobile responsiveness testing
- [ ] Accessibility improvements
- [ ] Theme refinement
- [ ] Loading states everywhere
- [ ] Error handling

**Day 12-14: Testing & Deployment** (8-10 hours)
- [ ] Write E2E tests (Cypress)
- [ ] Component testing
- [ ] Lighthouse optimization
- [ ] Bug fixes
- [ ] Production build
- [ ] Deployment setup

### Total Estimated Time: 60-80 hours (2 weeks full-time)

## 📝 Development Guidelines

### Project Structure
```
defenddos-frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── layout.tsx            # Root layout
│   │   ├── dashboard/            # Dashboard route
│   │   ├── api-playground/       # NEW: API testing
│   │   ├── features/             # NEW: Feature showcase
│   │   ├── documentation/        # NEW: Docs hub
│   │   └── performance/          # NEW: Metrics
│   ├── components/
│   │   ├── 3d/                   # NEW: Three.js components
│   │   │   ├── Globe3D.tsx
│   │   │   ├── NetworkVisualization.tsx
│   │   │   └── ParticleField.tsx
│   │   ├── animations/           # NEW: Animation wrappers
│   │   │   ├── ScrollReveal.tsx
│   │   │   ├── CounterAnimation.tsx
│   │   │   └── SmoothScroll.tsx
│   │   ├── landing/              # NEW: Landing page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   ├── StatsCounter.tsx
│   │   │   └── TechStack.tsx
│   │   ├── playground/           # NEW: API playground
│   │   │   ├── RequestBuilder.tsx
│   │   │   ├── ResponseViewer.tsx
│   │   │   ├── CodeGenerator.tsx
│   │   │   └── WebSocketTester.tsx
│   │   ├── showcase/             # NEW: Feature demos
│   │   │   ├── MLShowcase.tsx
│   │   │   ├── SecurityShowcase.tsx
│   │   │   └── PerformanceShowcase.tsx
│   │   ├── docs/                 # NEW: Documentation components
│   │   │   ├── APIReference.tsx
│   │   │   ├── CodeExample.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── charts/               # Existing: Data visualizations
│   │   ├── dashboard/            # Existing: Dashboard components
│   │   ├── layout/               # Existing: Layout components
│   │   └── ui/                   # Existing: UI primitives
│   ├── hooks/
│   │   ├── useBackendApi.ts      # Existing: API hooks
│   │   ├── useWebSocket.ts       # NEW: WebSocket hook
│   │   ├── useSmoothScroll.ts    # NEW: Lenis integration
│   │   └── use3DScene.ts         # NEW: Three.js helpers
│   ├── lib/
│   │   ├── defenddos-api.ts      # Existing: API client
│   │   ├── websocket.ts          # NEW: WebSocket client
│   │   └── animations.ts         # NEW: GSAP utilities
│   └── types/
│       ├── api.ts                # Existing: API types
│       └── 3d.ts                 # NEW: Three.js types
```

### Code Standards
```typescript
// Component Template
'use client'; // Only if using hooks/browser APIs

import { useState, useEffect } from 'react';
import type { ComponentProps } from '@/types';

interface MyComponentProps {
  data: DataType;
  onAction?: (id: string) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  // 1. Hooks (state, queries, effects)
  const [state, setState] = useState<StateType>(initialValue);
  const { data: apiData } = useQuery({ queryKey: ['key'], queryFn });
  
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependency]);
  
  // 2. Event handlers
  const handleClick = () => {
    onAction?.(data.id);
  };
  
  // 3. Derived values
  const processedData = useMemo(() => 
    expensiveComputation(data), 
    [data]
  );
  
  // 4. Render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}

// Export
export default MyComponent;
```

### TypeScript Rules
- **Strict mode enabled** in tsconfig.json
- **No `any` types** - use `unknown` or proper types
- **Interface over type** for objects
- **Export types** separately from components
- **Use generics** for reusable components

### Naming Conventions
- **Components**: PascalCase (`MyComponent.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMyHook.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse<T>`)

### CSS/Tailwind Guidelines
```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
  
// Use CSS modules for complex styles
<div className={styles.customComponent}>

// Use CVA for component variants
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { primary: '...', secondary: '...' }
  }
});
```

### Performance Optimization
```typescript
// Lazy load heavy components
const Globe3D = lazy(() => import('@/components/3d/Globe3D'));

// Memoize expensive calculations
const processedData = useMemo(() => 
  heavyComputation(data), 
  [data]
);

// Virtualize long lists
<VirtualList items={10000} renderItem={Item} />
```

### Animation Best Practices
```typescript
// Use transform and opacity only (GPU-accelerated)
gsap.to(element, {
  x: 100,           // ✅ transform: translateX
  y: 50,            // ✅ transform: translateY
  opacity: 0.5,     // ✅ opacity
  // ❌ avoid: top, left, width, height
});
```

## 🚀 Getting Started

### Quick Start (Development)
```bash
# 1. Navigate to frontend directory
cd defenddos-frontend

# 2. Install dependencies (if not already installed)
pnpm install

# 3. Start development server
pnpm dev

# 4. Open browser
# Visit: http://localhost:3000
```

### Start Backend Services
```bash
# In separate terminal, start backend + ML + databases
cd ../backend-service
docker-compose up -d

# Wait 30 seconds for InfluxDB initialization
# Verify all services running:
docker-compose ps
```
production-ready, open-source DDoS detection platform** featuring:

### 🌟 Visual Excellence
- ✨ **Stunning 3D visualizations** with Three.js (interactive globe, network graphs)
- 🎨 **Modern animations** with GSAP, Anime.js, and Framer Motion
- 🌊 **Buttery-smooth scrolling** with Lenis (60fps)
- 🎭 **Beautiful UI/UX** with Tailwind CSS and custom design system
- 📱 **Fully responsive** on all devices (mobile-first approach)

### ⚡ Technical Prowess
- 🔥 **Full-stack integration** (Spring Boot backend + Next.js frontend)
- 🤖 **Dual ML models** (Random Forest 99.2% + LSTM) with live predictions
- 📡 **Real-time updates** via WebSocket connections
- 🔐 **Enterprise security** (JWT, rate limiting, IP blocking, AWS WAF)
- 📊 **Production-ready** (Docker, Kubernetes, CI/CD, monitoring)

### 🛠️ Developer Experience
- 📚 **Comprehensive documentation** (API reference, tutorials, examples)
- 🎮 **Interactive API playground** (test all 25 endpoints)
- 🧪 **Built-in testing tools** (unit, integration, E2E, load tests)
- 💻 **Code generation** (cURL, Python, JavaScript, Java)
- 🔍 **Performance metrics** (response times, throughput, resource usage)

### 🎯 Use Cases
1. **Portfolio Project** - Showcase to employers/recruiters
   - Demonstrates full-stack expertise
   - Shows ML/AI integration skills
   - Proves modern UI/UX capabilities
   - Highlights DevOps knowledge

2. **Open Source Contribution** - GitHub stars and community
   - Production-ready codebase
   - Comprehensive documentation
   - Active maintenance
   - Welcoming to contributors

3. **Learning Resource** - For developers learning DDoS detection
   - Complete architecture explained
   - Step-by-step tutorials
   - Code examples in multiple languages
   - Best practices demonstrated

4. **Production Deployment** - Ready for real-world use
   - Scalable microservices architecture
   - High availability (99.9% uptime)
   - Automated monitoring and alerts
   - Disaster recovery procedures

### 📊 Impact Metrics
- **GitHub Stars**: 100+ in first month
- **Weekly Active Users**: 50+ developers
- **Documentation Views**: 500+ per week
- **API Playground Sessions**: 200+ per week
- **Uptime**: 99.9% availability
- **Performance**: Sub-second response times

### 🚀 Future Roadmap
After completing the master plan, potential enhancements:
1. **Multi-language support** (i18n)
2. **Custom dashboard builder** (drag-and-drop widgets)
3. **Mobile app** (React Native)
4. **Collaborative features** (team accounts, shared dashboards)
5. **Plugin system** (community extensions)
6. **Machine learning marketplace** (share trained models)
7. **Cloud SaaS offering** (hosted version)

---

**Let's build something amazing! 🚀**

*This is more than a project—it's a showcase of modern software engineering excellence.
pnpm build && pnpm export
```

### Development Workflow
1. **Create feature branch**: `git checkout -b feature/landing-page`
2. **Start dev server**: `pnpm dev`
3. **Make changes**: Edit files in `src/`
4. **Test**: Browser auto-reloads on save
5. **Check types**: `pnpm tsc --noEmit`
6. **Lint**: `pnpm lint`
7. **Commit**: `git commit -m "feat: add landing page"`
8. **Push**: `git push origin feature/landing-page`

### Debugging Tips
```bash
# Check React Query cache
# Open React Query DevTools in browser (bottom-right icon)

# Inspect 3D scenes
# Right-click → Inspect in Chrome DevTools
# Check Three.js warnings in console

# Network debugging
# Chrome DevTools → Network tab
# Filter by XHR to see API calls

# Performance profiling
# Chrome DevTools → Performance tab
# Record → Interact with page → Stop
# Look for long tasks (>50ms)
```

## 📚 Resources

- [Three.js Docs](https://threejs.org/docs/)
- [GSAP Docs](https://greensock.com/docs/)
- [Framer Motion](https://www.framer.com/motion/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Query](https://tanstack.com/query/latest)

## 🎉 Expected Outcome

A **world-class, open-source DDoS detection platform** that:
1. Impresses technical recruiters and open-source community
2. Demonstrates full-stack expertise (Spring Boot + Next.js)
3. Shows modern UI/UX skills (3D, animations, responsive)
4. Proves system architecture knowledge (microservices, ML integration)
5. Ready for portfolio, GitHub stars, and production deployment

---

**Let's build something amazing! 🚀**
