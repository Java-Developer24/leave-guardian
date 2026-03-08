

## Plan: Premium UI Overhaul + Rename to "Leave & Shrinkage Manager" + Landing Page

### 1. Rename: WatchTower to Leave & Shrinkage Manager (LSM)

Update all branding references across these files:
- **LoginPage.tsx**: Change "WatchTower" logo/text to "LSM" with tagline "Leave & Shrinkage Manager"
- **AppShell.tsx**: Sidebar brand, footer text, version label
- **index.html**: Page title

### 2. Create Landing Page (`/` route)

A new `src/pages/LandingPage.tsx` with premium sections:
- **Hero**: Large gradient headline "Intelligent Leave & Shrinkage Management", animated subtitle, CTA buttons (Get Started / Learn More), floating decorative elements with Framer Motion
- **Stats Bar**: Animated counters (e.g., "10K+ Leaves Managed", "99.9% Uptime", "500+ Teams")
- **Features Grid**: 3 premium glass cards with icons — Smart Calendar, Real-time Shrinkage Analytics, Role-based Workflows
- **Role Showcase**: 3-column layout showing Agent/Supervisor/Admin capabilities with mini mockup illustrations
- **Footer**: Minimal branded footer

Route `/` will show LandingPage; login stays at `/login`.

### 3. Premium UI Overhaul for All Screens

**Global Enhancements (index.css + motion.ts)**:
- Add subtle animated gradient mesh background (CSS `@keyframes` for slow-moving radial gradients on background)
- Enhance `glass-card` with more prominent `inset` highlight borders and softer glow on hover
- Add `.glass-card-featured` hover shadow enhancements
- Richer stagger animations: increase stagger delay, add spring easing
- Add floating animation keyframe for decorative elements
- New utility: `.shimmer` effect for loading states

**KpiCard.tsx** — Premium redesign:
- Add subtle gradient border on hover (via pseudo-element)
- Larger icon containers with gradient backgrounds
- Animated number counters using Framer Motion's `animate` for value changes
- Add sparkline mini-charts (simple SVG paths) to key KPIs
- Better spacing, larger value text

**StatusChip.tsx** — Enhanced:
- Add dot indicator before label
- Subtle glow matching status color
- Pill with softer backgrounds

**SectionHeader.tsx** — Premium:
- Decorative gradient line is longer, animated width on mount
- Subtitle text with slightly more spacing

**LeaveCalendar.tsx** — Rich redesign:
- Larger cells with better padding
- Tooltip-style hover showing holiday names
- Pulsing dot for "today"
- Better color coding with softer glassmorphism cell backgrounds
- Month navigation with animated transitions

**AppShell.tsx** — Sidebar & header:
- Sidebar: subtle vertical gradient on left edge, smoother hover states, user profile section at bottom with avatar + role badge
- Header: Add a subtle bottom gradient border instead of plain border, breadcrumb-style with gradient separator dots
- Add user dropdown in header with name, role, email display

**LoginPage.tsx** — Premium:
- Animated background mesh/particles effect
- Larger, more prominent logo with glow
- Feature bullets with animated check icons
- Better form field styling with animated focus rings

### 4. Page-Level Enhancements

**AgentHome**: Add a "Leave Quota" visual ring/donut chart (pure SVG), activity timeline with vertical line connector, richer card layouts with icons and color-coded borders.

**AgentSummary**: Add visual timeline dots for history, enhanced table with row hover animations, summary stats with mini bar charts.

**AgentLeave**: Better calendar with today highlight, enhanced form panel with step indicators, progress bar for "cap remaining".

**AgentRequests**: Cards with avatar pairs showing swap direction, animated state transitions.

**SupervisorHome**: Add mini donut chart for approval rate, color-coded alert cards with animated borders, richer pending list with shrinkage preview.

**SupervisorApprovals**: Enhanced table with avatar circles, shrinkage impact shown as visual gauge bars (not just text), action buttons with confirmation states.

**SupervisorTeam**: Richer member cards with circular progress rings for hours delivered, gradient borders on risk cards.

**AdminAnalytics**: Real Recharts integration — AreaChart for planned vs actual, BarChart for department breakdown, RadialBarChart for shrinkage gauge. Replace placeholder bars with actual charts.

**Admin Config pages**: Better toggle switches with animation, visual sliders for percentage inputs, preview cards showing "before/after" effect.

**Admin Upload pages**: Drag-drop zone with animated dashed border, file icon animation on hover, richer preview table.

### 5. More Dummy Data

Expand `seeds/index.ts`:
- Add 3-4 more leave requests across different months and statuses to fill out tables
- Add more attendance records
- Extend schedule to March 2026 as well
- Add a few more departments for analytics variety

### Technical Approach

All changes are CSS/component-level within existing Tailwind + Framer Motion stack. Recharts is already installed for AdminAnalytics charts. No new dependencies needed.

Files to create:
- `src/pages/LandingPage.tsx`

Files to modify (all):
- `src/index.css` — enhanced animations, mesh background
- `src/styles/motion.ts` — richer motion presets
- `src/components/kpis/KpiCard.tsx`
- `src/components/StatusChip.tsx`
- `src/components/SectionHeader.tsx`
- `src/components/calendar/LeaveCalendar.tsx`
- `src/components/layout/AppShell.tsx`
- `src/pages/login/LoginPage.tsx`
- `src/pages/LandingPage.tsx` (new)
- `src/pages/agent/AgentHome.tsx`
- `src/pages/agent/AgentSummary.tsx`
- `src/pages/agent/AgentLeave.tsx`
- `src/pages/agent/AgentRequests.tsx`
- `src/pages/supervisor/SupervisorHome.tsx`
- `src/pages/supervisor/SupervisorApprovals.tsx`
- `src/pages/supervisor/SupervisorTeam.tsx`
- `src/pages/admin/AdminAnalytics.tsx`
- `src/pages/admin/config/AdminLeaveWindow.tsx`
- `src/pages/admin/config/AdminShrinkage.tsx`
- `src/pages/admin/config/AdminHolidays.tsx`
- `src/pages/admin/uploads/AdminScheduleUpload.tsx`
- `src/pages/admin/uploads/AdminAttendanceUpload.tsx`
- `src/app/router.tsx`
- `src/data/seeds/index.ts`
- `src/core/constants.ts`
- `index.html`

