import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WeeklyScheduleWorkspace from "@/components/schedule/WeeklyScheduleWorkspace";
import { apiService } from "@/services/apiService";
import { useAppStore } from "@/state/store";

async function seedSupervisorStore() {
  const currentUser = await apiService.getUser("sup1");
  if (!currentUser) throw new Error("Supervisor user not found");

  const [
    users,
    departments,
    leaves,
    forecastAlerts,
    weekoffSwapRequests,
    holidays,
    rules,
    leaveWindow,
    schedule,
    attendance,
  ] = await Promise.all([
    apiService.getUsers(),
    apiService.getDepartments(),
    apiService.getAllLeaves(),
    apiService.getForecastAlerts(),
    apiService.getWeekoffSwapRequests(),
    apiService.getHolidays(),
    apiService.getRules(),
    apiService.getLeaveWindow(),
    apiService.getSchedule(),
    apiService.getAttendance(),
  ]);

  useAppStore.setState({
    currentUser,
    users,
    departments,
    leaves,
    forecastAlerts,
    weekoffSwapRequests,
    holidays,
    rules,
    leaveWindow,
    schedule,
    attendance,
    loading: false,
  });
}

describe("WeeklyScheduleWorkspace manage flow", () => {
  beforeEach(async () => {
    await seedSupervisorStore();
  });

  it("opens the week-off planning modal when manage is clicked", async () => {
    render(<WeeklyScheduleWorkspace mode="supervisor" />);

    const manageButtons = await screen.findAllByRole("button", {
      name: "Manage",
    });
    const enabledButton = manageButtons.find(
      (button) => !button.hasAttribute("disabled"),
    );

    expect(enabledButton).toBeTruthy();

    fireEvent.click(enabledButton);

    expect(
      await screen.findByRole("dialog", { name: "Week-Off Planning" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Selected Guide")).toBeInTheDocument();
  });
});
