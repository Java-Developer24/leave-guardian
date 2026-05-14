import { useMemo, useState } from "react";
import WeeklyScheduleWorkspace from "@/components/schedule/WeeklyScheduleWorkspace1";
import { showToast } from "@/components/toasts/ToastContainer";

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const last12Months = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push({
        value: `${year}-${month}-01`,
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return months;
  }, []);

  const handleDownload = () => {
    try {
      // Create sample CSV data for the month
      const [year, month] = selectedDate.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(month) - 1,
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const csvContent = [
        ["User", "Date", "Shift Start", "Shift End", "Week Off"],
        ["Sample Data", selectedDate, "09:00", "18:00", "No"],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `schedule-${monthName.replace(" ", "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Schedule for ${monthName} downloaded`, "success");
    } catch {
      showToast("Failed to download schedule", "error");
    }
  };

  return (
    <WeeklyScheduleWorkspace mode="admin" initialMonthDate={selectedDate} />
  );
}
