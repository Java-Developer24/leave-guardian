import {
  Calendar,
  Zap,
  Users,
  Clock,
  BarChart3,
  Shield,
  Fingerprint,
  Activity,
  LineChart,
  Layers,
  Bell,
  Lock,
  Workflow,
  Database,
  Eye,
} from "lucide-react";

export const landingStats = [
  { value: 10000, suffix: "+", label: "Leaves Managed", icon: Calendar },
  { value: 99, suffix: ".9%", label: "Platform Uptime", icon: Zap },
  { value: 500, suffix: "+", label: "Active Teams", icon: Users },
  { value: 45, suffix: "%", label: "Time Saved", icon: Clock },
];

export const landingFeatures = [
  {
    icon: Calendar,
    title: "Smart Calendar Engine",
    description:
      "AI-powered date blocking with real-time shrinkage calculations. Holidays, weekly offs, and capacity limits — all orchestrated automatically.",
    accent: "primary",
    metric: "3x faster",
    metricLabel: "planning speed",
    items: [
      "Auto-block high-shrinkage dates",
      "Monthly cap enforcement",
      "Holiday-aware scheduling",
    ],
  },
  {
    icon: BarChart3,
    title: "Shrinkage Analytics",
    description:
      "Monitor planned vs actual shrinkage with department breakdowns, risk alerts, and predictive trend analysis.",
    accent: "accent",
    metric: "99.2%",
    metricLabel: "accuracy rate",
    items: [
      "Real-time dashboards",
      "Department breakdowns",
      "Predictive risk alerts",
    ],
  },
  {
    icon: Shield,
    title: "Role-Based Workflows",
    description:
      "Purpose-built dashboards for every role, from guides to managers. Multi-level approvals, swap requests, and real-time status propagation.",
    accent: "info",
    metric: "60%",
    metricLabel: "fewer escalations",
    items: [
      "Guide / Supervisor / Manager / Admin views",
      "Multi-level approval chains",
      "Swap & transfer handling",
    ],
  },
];

export const landingRoles = [
  {
    role: "Agent",
    desc: "Apply for leave, initiate swaps, track approval status, and manage your personal calendar with quota tracking.",
    items: [
      "Apply planned leave",
      "Swap & transfer requests",
      "Real-time quota ring",
      "Leave history timeline",
    ],
    color: "primary",
    icon: Fingerprint,
  },
  {
    role: "Supervisor",
    desc: "Review pending approvals, monitor team shrinkage impact, and ensure coverage across all shifts.",
    items: [
      "One-click approve/reject",
      "Shrinkage impact gauge",
      "Team hours dashboard",
      "Risk date alerts",
    ],
    color: "accent",
    icon: Activity,
  },
  {
    role: "Manager",
    desc: "Track department and supervisor performance, review forecast risks, and compare team-level schedule visibility before decisions are made.",
    items: [
      "Department insights",
      "Supervisor performance views",
      "All Departments Schedule visibility",
      "Forecast review oversight",
    ],
    color: "manager",
    icon: LineChart,
  },
  {
    role: "Admin",
    desc: "Upload schedules, configure policies, manage holidays, and access organization-wide performance analytics.",
    items: [
      "Bulk schedule uploads",
      "Leave window control",
      "Shrinkage rule engine",
      "Department analytics",
    ],
    color: "info",
    icon: Layers,
  },
];

export const landingCapabilities = [
  {
    icon: LineChart,
    title: "Live Analytics",
    desc: "Real-time shrinkage monitoring across guide, supervisor, and manager views",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Instant status updates across all approval stages",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "Role-based access control with audit logging",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    desc: "Multi-level approvals with zero manual overhead",
  },
  {
    icon: Database,
    title: "Data Integration",
    desc: "CSV/JSON imports for schedules and attendance",
  },
  {
    icon: Eye,
    title: "Full Visibility",
    desc: "Manager and admin dashboards with organization-wide visibility",
  },
];

export const landingTestimonials = [
  {
    name: "Sarah Chen",
    role: "Operations Director",
    text: "LSM reduced our leave management overhead by 60%. The shrinkage analytics alone are worth it.",
    rating: 5,
    company: "TechServe Inc.",
  },
  {
    name: "James Okafor",
    role: "Team Lead",
    text: "The approval workflow is seamless. I can see shrinkage impact before approving — game changer.",
    rating: 5,
    company: "GlobalConnect",
  },
  {
    name: "Maya Patel",
    role: "Manager",
    text: "The team and department analytics finally give me one place to compare schedules, risks, and supervisor performance.",
    rating: 5,
    company: "SupportGrid",
  },
  {
    name: "Priya Mehta",
    role: "HR Manager",
    text: "Finally a tool that understands contact center dynamics. Setup took 30 minutes.",
    rating: 5,
    company: "VoiceFirst",
  },
];
