# Supervisor Dashboard PRD

## Document Purpose
This document defines the product requirements for the Supervisor Dashboard experience. It is written for product, design, engineering, operations, QA, and business stakeholders. The goal is to describe what the supervisor dashboard should achieve and what features it must provide, without going into frontend, backend, or code-level implementation details.

## Document Status
- Status: Draft
- Last updated: 2026-04-13
- Product area: Supervisor Experience

## Product Summary
The Supervisor Dashboard is the central hub for supervisors to manage their team's leave requests, monitor production capacity, analyze forecasted shrinkage risks, and make data-driven approval decisions. The dashboard provides real-time visibility into team availability, pending approvals, and department performance metrics.

The supervisor experience is designed to balance approval efficiency with strategic workforce planning, enabling supervisors to:
- Quickly review and approve time-sensitive leave requests
- Monitor team production hours and leave capacity
- Identify and mitigate forecasted shrinkage risks
- Track team member performance and compliance
- Make informed leave-approval decisions using AI-powered insights

## Problem Statement
Supervisors face multiple challenges in managing team leave:
- Scattered information across multiple approval workflows makes it hard to stay on top of time-sensitive requests
- Lack of visibility into department-wide shrinkage impact when approving individual leave requests
- No clear view of which team members will fall short of production targets
- Difficulty identifying optimal week-off movement and swap opportunities
- Time-consuming manual analysis to spot high-risk dates and recommend leave approval limits

## Goals
- Provide supervisors with immediate visibility into pending actions and approvals
- Enable data-driven leave approval decisions using forecasted shrinkage and production metrics
- Reduce approval time by surfacing only relevant information
- Identify and recommend strategic workforce adjustments (week-off movements, etc.)
- Help supervisors balance team satisfaction with business needs

## Non-Goals
- Replacing the agent leave application experience
- Managing leave policy configuration or department rules
- Automating leave approvals without supervisor review
- Providing insights for roles other than supervisors (that's manager/admin)

## Primary Users
- Supervisors (team leads managing 5-30 agents)

## Secondary Stakeholders
- Agents waiting for leave decisions
- Managers overseeing multiple supervisors
- Admin teams managing system-wide policies
- Operations/HR teams monitoring compliance

## User Needs
- I need to quickly see which leave requests are waiting for my action
- I need to understand the impact of approving or rejecting a specific leave request on my team's capacity
- I need to identify which team members are at-risk of production shortfalls
- I need strategic recommendations on managing leaves to protect production
- I need visibility into my team's overall leave and attendance patterns
- I want to manage week-off movements and swaps to balance team flexibility with business needs

---

# Feature Specifications

## 1. Supervisor Home (Dashboard)

### Purpose
The primary landing page for supervisors, providing a quick status overview and access to pending decisions.

### Key Metrics (KPI Cards)
- **Leaves Taken**: Count of approved leaves in the current month
- **Pending Leave Requests**: Count of leave requests awaiting supervisor approval
- **Production Hours**: Achieved hours vs. planned target hours for the selected month
- **Team Size**: Number of active agents in the department
- **Shrinkage Level**: Current day's shrinkage percentage vs. department cap

### Core Components

#### 1.1 Month Selector
- Dropdown to select which month to view (current, next, or historical with active leaves)
- Updates all dashboard metrics and pending requests list to the selected month

#### 1.2 Pending Requests Section
- Displays up to 4 most recent pending leave requests (for the selected month)
- Organized in a 2-column layout showing:
  - Requester name and initials
  - Leave date/date range
  - Leave days
  - Leave type (Planned, Unplanned, Transfer, Swap)
  - Current status
- Quick actions: "Approve," "Reject," "Review"
- Shows count of pending transfers separately
- Indicates pending week-off swaps awaiting admin approval

#### 1.3 Team Summary Table
- Ranked by highest production deficit (hours behind target)
- Shows up to 15 team members in current selection
- Columns:
  - Agent name with initials avatar
  - Planned vs. Unplanned leave count
  - Total leave days taken
  - Pending approvals count
  - Achieved hours vs. target hours
  - Production deficit hours
- Color-coded risk indicators:
  - Green: On track
  - Blue: Moderate risk
  - Orange: At risk
  - Red: Critical

#### 1.4 Forecast Alerts Section
- Displays high-risk dates in the current month where shrinkage exceeds safe thresholds
- Shows date, forecast volume, required guides, and available guides
- Links to detailed approval flow with shrinkage preview

#### 1.5 Quick Action Flows
- **Approve Leave Modal**: Shows leave details, current shrinkage, after-approval shrinkage, and comment field
- **Reject Leave Modal**: Shows leave details and optional rejection reason field

### Interactions
- Clicking on a pending request opens approval/rejection modal
- Selecting a team member may navigate to individual performance view (future enhancement)
- Clicking on a forecast alert shows shrinkage details for that date

---

## 2. Supervisor Approvals

### Purpose
Dedicated interface for managing leave requests, transfers, and forecast alerts with detailed shrinkage analysis.

### Key Components

#### 2.1 Tabbed Interface
Three tabs organize different approval types:

**Tab 1: Leave Queue**
- Lists all pending leave requests (PendingSupervisor status)
- Filtered to current department
- Sorted by submission date (oldest first)
- Columns:
  - Requester name
  - Leave date/duration
  - Leave type
  - Reason (if provided)
  - Days requested
  - Current shrinkage / After-approval shrinkage (with gauge visualization)
  - Actions: Approve, Reject

**Tab 2: Transfers**
- Lists pending transfer requests (leave type = Transfer)
- Columns:
  - From agent and To agent
  - Original date and transfer date
  - Reason (if provided)
  - Impact on both agents' shrinkage
  - Actions: Approve, Reject

**Tab 3: Forecast Alerts**
- Lists high-shrinkage dates flagged by forecasting system
- Each alert shows:
  - Date
  - Forecast volume estimate
  - Required guides
  - Scheduled guides
  - Available guides
  - Pending leaves on this date
  - Option to mark as "Reviewed" and add comments

#### 2.2 Approval Module
- **Shrinkage Gauge**: Visual comparison of shrinkage before and after approval
  - Shows if approval would exceed safe shrinkage cap
  - Color-coded: Green (safe), Yellow (caution), Red (not recommended)
- **Decision Buttons**: "Approve" and "Reject" with optional comment field
- **Confirmation Modal**: Shows final summary before committing approval/rejection

#### 2.3 Leave Selection Controls
- **Month Selector**: Choose which month to view pending requests
- **Guide Filter**: Optional filter to show only pending requests for specific agent
- **Transfer Mode Toggle**: Switch to month-level transfer planning view

### Interactions
- Submitting approval/rejection records the action with timestamp and supervisor ID
- Comments are stored as part of leave history
- Forecast alerts can be marked reviewed without approval/rejection
- Approving leave triggers refresh of all department metrics

---

## 3. Supervisor Team (Team Management)

### Purpose
Comprehensive team member view with production tracking, leave history, and risk assessment.

### Key Components

#### 3.1 Team Summary Stats (Featured Glass Card)
- **Total Agents**: Count of active agents in department
- **On Track for Production**: Count of agents with zero production deficit
- **At Risk for Production**: Count of agents with 1-16 hours deficit
- **Leaves Taken (Current Month)**: Total approved leave days this month across team
- **Pending Leave Requests (Next Month)**: Count of unresolved requests for next month

#### 3.2 Search and Filter
- Search box to filter team members by name
- Sorted by highest production deficit by default

#### 3.3 Team Member Cards (Grid View)
Each card displays:
- Agent name and avatar
- Current month production metrics:
  - Hours delivered vs. target (visual progress bar)
  - Leave days approved
  - Pending approval count
  - Rejection count
- Production deficit status with risk indicator:
  - Critical (>24 hours behind)
  - High (16-24 hours behind)
  - At Risk (1-15 hours behind)
  - On Track (0 hours behind)
- Next month pending requests count
- Click to expand or navigate to agent detail view (future enhancement)

#### 3.4 Agent Performance Metrics
For selected month:
- Standard mandays: 25 (configurable per department)
- Hours target: 200 (25 * 8)
- Breakdown:
  - Approved leaves (days and hours impact)
  - Pending leaves (count)
  - Rejected leaves (count)
  - Hours delivered / Hours deficit

---

## 4. Supervisor Schedule (Weekly View)

### Purpose
Visual weekly schedule to coordinate team availability, validate week-off movements, and manage manual scheduling adjustments.

### Key Components

#### 4.1 Weekly Grid
- Shows 7 days in current week
- Rows for each team member
- Color-coded cells:
  - Green: Scheduled work shift
  - Gray: Week-off
  - Red: On leave (approved)
  - Yellow: Pending leave decision
  - Blue: Holiday

#### 4.2 Schedule Legend
- Color key explaining all status types
- Week-off swap and movement indicators (planned or active)

#### 4.3 Week Navigation
- Previous/Next week buttons
- Week date range display
- Jump to specific date picker

#### 4.4 Shift Details
- Click on scheduled cell to view shift times
- Hover shows agent name, shift start/end times
- Shows leave reason for leave cells

#### 4.5 Scheduling Actions (Future Enhancement)
- Ability to approve/suggest week-off movements
- Swap initiation interface for week-off adjustments

### Interactions
- Navigation between weeks updates schedule view
- Clicking cells provides detail view
- Supervisor can validate recommended week-off movements from Analytics page

---

## 5. Supervisor Analytics

### Purpose
Department-level analytics and forecasting dashboard for strategic workforce planning and risk mitigation.

### Key Components

#### 5.1 KPI Summary (Header Cards)
- **Forecast Accuracy**: Percentage accuracy of previous forecasts
- **Shrinkage %**: Current period overall shrinkage (planned + unplanned)
  - Subtitle shows breakdown: "Planned X% • Unplanned Y%"
- **Production Hours**: Achieved vs. target hours ratio for selected month
- **High Risk Days**: Count of days exceeding safe shrinkage thresholds
- **Total Leaves**: Total leave days in period
  - Subtitle: "PL- X • UL- Y" (planned leaves and unplanned leaves bifurcated)

#### 5.2 Calendar Filters
- **Active Month Selector**: Choose primary analysis month
- **Range Preset**: 1-month, 3-month, 6-month, or custom date range options
- **Filter Mode**: Toggle between single month, month range, or custom date range
- **Month Navigation**: Previous/Next month buttons
- Helper text explaining current filter selection

#### 5.3 Shrinkage Forecast Calendar
- **Grid View**: Calendar visualization of current month
- **Color Coding** (by forecasted shrinkage):
  - Green: Safe (<= cap)
  - Yellow: Caution (near cap)
  - Red: High Risk (> cap)
  - Dark Red: Critical (significantly over cap)
- **Cell Details**: Date, forecast volume, required guides, scheduled guides, pending leaves
- **High Risk Indication**: Visual highlighting of high-risk date ranges

#### 5.4 Shrinkage % Forecast Chart
- **Left Panel**: Day-wise shrinkage chart
- **Chart Type**: Bar or line chart showing forecast shrinkage across selected period
- **Data Points**:
  - Scheduled guides (capacity)
  - Required guides (forecast demand)
  - Available guides (scheduled - required)
- **Legend**: Shows planned shrinkage vs. unplanned shrinkage splits
- **Reference Line**: Department cap (e.g., 32%)

#### 5.5 High-Risk Summary
- Lists consecutive high-risk date spans
- Shows:
  - Start date to end date
  - Duration (number of days)
  - Peak shrinkage percentage
  - Pending leave count
  - Expand to see individual dates

#### 5.6 Attendance Trend Analysis
- **Right Panel**: Multi-month comparison
- Shows planned vs. actual leave trends
- Variance analysis:
  - Expected leave days
  - Actual leave days taken
  - Variance (difference)
  - Variance % (percentage difference)
- Helps identify if team is trending below/above typical patterns

#### 5.7 Team Risk Analysis
- Lists all team members with leave load during selected period
- Columns:
  - Agent name
  - Planned vs. unplanned leave split
  - Total leave percentage of period
  - Risk level indicator:
    - High: >=16%
    - Moderate: 10-15%
    - Low: <10%
- Sorted by highest leave percentage

#### 5.8 Actionable Recommendations (Sidebar)
Based on analytics, system recommends:

**Recommendation Type 1: High-Risk Window Alert**
- "Forecasted risk window [date range] is the highest-risk date range. Review approvals closely on these dates because team forecast stays above the comfortable shrinkage band."
- Severity: High

**Recommendation Type 2: Production Gap Alert**
- "Based on X planned days, Y unplanned days, and current monthly leave load, team falls short by Z production hours. To recover target, reduce approvals by ~N leave days."
- Severity: Medium

**Recommendation Type 3: Week-off Movement Opportunity**
- "Agent A can be reviewed for week-off movement from [date] to [date] because availability stays covered on target date. Review 7th-day login rule before applying."
- Severity: Low

**Recommendation Type 4: Alternative Coverage Suggestion**
- "Week-off movement or swaps can be reviewed as alternatives where they don't reduce same-day availability. Use Team Schedule planner to validate changes."
- Severity: Low

#### 5.9 AI Chat Advisor
- Floating chat interface for asking questions about analytics
- Context-aware responses based on current data
- Sample queries:
  - "What are the highest shrinkage dates?"
  - "Show me safe week-off movement options"
  - "How many leaves are pending next month?"
- Responses include actionable recommendations and relevant date ranges

#### 5.10 Analytics Customization
- **Period Selection**:
  - Single month: View specific month metrics
  - Month range: Compare trends across multiple months
  - Custom date range: Analyze specific date periods
- **Calendar Navigation**:
  - Separate month/date pickers for performance and forecast calendars
  - Independent navigation allows comparing different time periods

### Data Points Tracked
- Scheduled guides per day
- Forecasted demand (forecast volume)
- Required guides for demand fulfillment
- Available guides (scheduled - required)
- Approved leaves by type (planned, unplanned, swap, transfer)
- Pending leaves by type
- Active leaves by type
- Shrinkage percentage (overall, planned, unplanned)
- Production hours (target vs. achieved)
- Week-off swap and movement counts
- Forecast accuracy (compared to actuals)

---

# User Flows

## Flow 1: Quick Approval (Supervisor Home → Approval)
1. Supervisor lands on Home dashboard
2. Sees pending requests in list
3. Clicks "Approve" on a request
4. Modal shows leave details, shrinkage gauge, comment field
5. Supervisor adds optional comment
6. Clicks "Confirm Approve"
7. Leave is approved, dashboard updates

## Flow 2: Strategic Leave Planning (Analytics → Recommendations)
1. Supervisor opens Analytics page
2. Selects 3-month range to analyze trends
3. Reviews high-risk dates in calendar
4. Reads recommendations for date range
5. Uses week-off movement suggestion to adjust schedule
6. Navigates to Approvals to review affected leave requests
7. Approves/rejects based on recommendation

## Flow 3: Team Performance Review (Team → Production Analysis)
1. Supervisor opens Team page
2. Identifies agents with highest production deficit
3. Clicks on agent to review their pending requests
4. Views their planned vs. unplanned leave split
5. Decides which pending transfers/requests to approve/reject
6. Uses predictions to set approval strategy for month

## Flow 4: Week-off Management (Schedule → Execution)
1. Supervisor opens Schedule to validate team availability
2. Sees pending week-off swaps and movements
3. Reviews shift details for high-risk dates
4. Validates that recommended movements don't reduce coverage
5. Approves week-off adjustments through modal
6. Schedule updates and team is notified

---

# Interaction Patterns

## Approval Decision Pattern
- **Show Context**: Display leave details, shrinkage impact, and team context
- **Provide Guidance**: Show if decision is recommended via gauge/badge
- **Enable Comments**: Allow supervisor to record reasoning
- **Confirm Action**: Modal confirmation before final commitment
- **Provide Feedback**: Toast confirmation with undo option (if supported)

## Data Visualization Patterns
- **Color Coding**: Consistent use of green (safe), yellow (caution), red (risk)
- **Progress Bars**: Show hours/percentage filled vs. target
- **Gauges**: Shrinkage before/after comparisons
- **Trend Charts**: Month-over-month comparisons
- **Badges**: Quick risk level indicators (High/Medium/Low)

## Navigation Patterns
- **Persistent Context**: Selected month/date range persists across page navigation
- **Quick Links**: Recommendations link to relevant approval or schedule
- **Breadcrumbs**: Show current location (e.g., Home → Pending → Approve)
- **Back Navigation**: Return to previous state when closing modals

---

# Success Metrics

## Adoption Metrics
- % of supervisors using dashboard weekly
- Time to first leave approval after login
- Approval action volume per supervisor per week

## Efficiency Metrics
- Average approval decision time (target: <2 minutes per request)
- % of approvals using AI recommendations
- Time spent on analytics vs. operational tasks

## Quality Metrics
- % of forecasted high-risk dates that actually experience high volume
- Forecast accuracy rate (target: >90%)
- % of approved leaves within recommended shrinkage caps

## Satisfaction Metrics
- Supervisor satisfaction with approval process (NPS)
- Agent satisfaction with decision transparency
- % of compliance with department policies

---

# Constraints & Assumptions

## Technical Constraints
- Real-time data updates require efficient database queries
- Chat bot responses must return within 500ms for good UX
- Schedule visualization must handle up to 30 team members

## Policy Constraints
- Only supervisors can approve leaves for their department
- Leaves exceeding shrinkage cap require manager override
- Week-off swaps require admin approval (not supervisor-approved)

## User Assumptions
- Supervisors check dashboard at least weekly
- Supervisors make approval decisions within 48 hours of submission (SLA)
- Supervisors understand basic shrinkage and production hour concepts

---

# Future Enhancements

1. **Advanced Forecasting**: ML-based prediction of leave patterns
2. **Approval Automation**: Auto-approve low-risk leaves below thresholds
3. **Integration with HR Systems**: Sync with external HR for accurate attendance
4. **Mobile Optimized View**: Mobile-friendly dashboard for remote supervisors
5. **Bulk Actions**: Approve/reject multiple requests in batch
6. **Workflow Customization**: Configure approval rules and policies
7. **Audit Trail**: Detailed history of all approval decisions
8. **Export Reports**: PDF/Excel export of analytics and performance data
9. **Team Member Insights**: Detailed performance profiles with historical data
10. **Predictive Recommendations**: System recommends optimal approval strategy

---

# Glossary

- **Shrinkage**: Percentage of workforce unavailable due to leave
- **Forecasted Shrinkage**: Predicted shrinkage based on pending approvals
- **Production Hours**: Target work hours to be delivered by team (usually 25 * 8 = 200 hours/month)
- **High-Risk Date**: Date where forecasted shrinkage exceeds department cap
- **Week-off Movement**: Rescheduling a team member's planned week-off to a different week/month
- **Week-off Swap**: Trading week-off days between two team members
- **Planned Leave**: Leave requested in advance (>7 days typically)
- **Unplanned Leave**: Urgent/emergency leave requested with short notice
- **Forecast Alert**: System-generated alert for dates with high shrinkage risk
- **Shrinkage Cap**: Maximum safe shrinkage percentage for department (configured globally)
