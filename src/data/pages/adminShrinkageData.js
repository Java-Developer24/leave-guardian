import { BarChart3, Users, Calendar } from "lucide-react";

export const shrinkageFields = [
  {
    key: "maxDailyPct",
    label: "Max Daily Shrinkage %",
    desc: "Maximum percentage of team on leave per day",
    icon: BarChart3,
    accent: "primary",
  },
  {
    key: "maxMonthlyPct",
    label: "Max Monthly Shrinkage %",
    desc: "Monthly shrinkage cap across the department",
    icon: Calendar,
    accent: "accent",
  },
  {
    key: "agentMonthlyLeaveCap",
    label: "Agent Monthly Leave Cap",
    desc: "Maximum planned leaves per agent per month",
    icon: Users,
    accent: "info",
  },
];

export const shrinkageAccentColors = {
  primary: "bg-primary/10 border-primary/15 text-primary",
  accent: "bg-accent/10 border-accent/15 text-accent",
  info: "bg-info/10 border-info/15 text-info",
};
