import {
  Users,
  Layers,
  TrendingUp,
  CalendarCheck,
  BarChart3,
  Clock4,
  CheckCircle2,
} from "lucide-react";

export const loginStats = [
  { value: 103, suffix: "", label: "Guides", icon: Users },
  { value: 11, suffix: "", label: "Departments", icon: Layers },
  { value: 99, suffix: "%", label: "Uptime", icon: TrendingUp },
];

export const loginFeatures = [
  { icon: CalendarCheck, label: "Smart leave scheduling" },
  { icon: BarChart3, label: "Real-time shrinkage analytics" },
  { icon: Clock4, label: "Shift coverage forecasting" },
  { icon: CheckCircle2, label: "Automated approval workflows" },
];
