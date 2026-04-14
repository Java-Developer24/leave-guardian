# Admin Persona - Product Requirements Document

**Version:** 1.0  
**Last Updated:** April 13, 2026  
**Status:** Approved  

---

## Executive Summary

The **Admin persona** functions as the system administrator and operational controller for Leave Guardian. Admins have enterprise-wide visibility across all departments and control critical system parameters, master data, and approval workflows. They serve as the bridge between tactical operational decisions (supervisors) and strategic compliance needs (managers), while maintaining data integrity through uploads and configurations.

### Role Scope
- **Enterprise Level:** Full organization visibility across departments, teams, and agents
- **Data Governance:** Control leave windows, shrinkage rules, holidays, and bulk data imports
- **Compliance & Auditing:** Manage week-off swap final approvals and oversee leave policy enforcement
- **Strategic Analytics:** Monitor organization-wide leave trends and provide data-driven recommendations

---

## 1. User Personas & Goals

### 1.1 Primary User: System Administrator
**Goal:** Maintain system integrity, enforce policies, and ensure accurate data flow  
**Key Responsibilities:**
- Configure leave request windows (open/close dates)
- Define shrinkage thresholds and agent leave caps
- Manage holiday master data and regional variations
- Approve final week-off swap requests after supervisor review
- Monitor enterprise-wide leave analytics and compliance metrics

### 1.2 Secondary User: Operations Manager
**Goal:** Oversee data quality and operational compliance  
**Key Responsibilities:**
- Upload and validate monthly schedules
- Upload and reconcile weekly attendance records
- Review and audit approval workflows
- Monitor high-risk dates across departments
- Ensure proper holiday configuration for shrinkage adjustments

### 1.3 Tertiary User: Finance/Compliance Officer
**Goal:** Ensure regulatory compliance and audit trail accuracy  
**Key Responsibilities:**
- Monitor overall shrinkage trends against targets
- Validate leave approval rates and policy adherence
- Review recommendations for operational improvements
- Generate audit reports on approval workflows

---

## 2. Core Features & Workflows

### 2.1 Performance Analytics Dashboard
**Purpose:** Provide enterprise-wide insights into leave patterns, shrinkage, and compliance  
**Context:** Accessible when admin logs in  

#### 2.1.1 Key Metrics (Top-Level KPIs)
| Metric | Definition | Calculation | Target |
|--------|-----------|-------------|--------|
| Forecast Accuracy % | Alignment of forecasted vs actual shrinkage | System-calculated | 90%+ |
| Total Leave Requests | Sum of all pending and decided requests | Count of all leaves | Varies |
| Approved Leaves | Count of approved requests | Filter by status='Approved' | High approval rate |
| Pending Requests | Unresolved leave requests awaiting decision | Filter by status='PendingSupervisor' | Minimize |
| Total Agents | Count of agent-level users in organization | User count by role | Tracked |

#### 2.1.2 Department-Level Breakdown
Display matrix showing per-department metrics:
- **Department Name** - Text field with hyperlink to department details
- **Agent Count** - Number of active agents in department
- **Leave Requests** - Total requests submitted for department
- **Approved Count** - Number of approved requests
- **Rejected Count** - Number of rejected requests
- **Pending Count** - Number of pending requests
- **Avg Leaves/Agent** - Average leave requests per agent (leaves / agents)
- **Department Shrinkage %** - Actual shrinkage impact on department

**Filtering:**
- Filter by Department (dropdown: All Departments or specific department)
- Filter by Time Range (toggle: All / Jan / Feb / Mar)
- Search departments by name (partial match)

#### 2.1.3 Visualizations

**a) Leave Status Distribution (Pie Chart)**
- Shows breakdown of leave requests by status
- Categories: Approved, Rejected, Pending Supervisor, Pending Peer
- Color-coded by status with legend
- Interactive: Hover to show counts and percentages

**b) Monthly Trend (Stacked Bar Chart)**
- X-axis: Month (Jan, Feb, Mar)
- Y-axis: Number of requests
- Stacks: Approved (green), Rejected (red), Pending (orange)
- Shows approval trends over time
- Tooltip on hover: exact counts per category

**c) Shrinkage Forecast (Line Chart)**
- X-axis: Month (January, February, March)
- Y-axis: Percentage (0-20%)
- Lines: Actual Shrinkage %, Max Daily Target (dashed)
- Highlight when actual exceeds target
- Interactive tooltips with values

**d) Department Risk Matrix (Scatter Plot)**
- X-axis: Leaves Per Agent
- Y-axis: Shrinkage %
- Bubble per department (size = agent count)
- Color-coded risk zones: Green (low), Orange (moderate), Red (high)
- Displays top 6 departments by agent count

**e) Top Risk Dates (Bar Chart)**
- Shows top 6 dates with concurrent leave requests
- Sorted by number of concurrent requests
- Color-coded severity: Green (low), Orange (moderate), Red (high)
- Format: "MMM DD - X concurrent requests"

**f) Department-wise Treemap**
- Visualizes all departments as sized rectangles
- Size = number of leave requests
- Color = assigned department color
- Shows department name and leave count in rectangle
- Helps identify high-volume departments at a glance

#### 2.1.4 Recommendations Section
Display 3-5 actionable insights to admins:

**Recommendation Types:**
1. **Peak-Day Distribution** 
   - Severity: High
   - Trigger: Multiple dates with 6+ concurrent requests
   - Action: "Redistribute peak-day leaves across department"

2. **Department Capacity Alert**
   - Severity: Medium
   - Trigger: Department hitting monthly leave cap consistently
   - Action: "Review and adjust leave caps for [Department]"

3. **Approval Pattern Analysis**
   - Severity: Low/Medium
   - Trigger: High swap/transfer ratio in specific department
   - Action: "Review scheduling practices in [Department]"

4. **Shrinkage Trend Alert**
   - Severity: Medium
   - Trigger: Overall shrinkage trending above policy threshold
   - Action: "Monitor shrinkage trends and adjust approvals"

5. **Data Quality Alert**
   - Severity: Low
   - Trigger: Missing or inconsistent data patterns
   - Action: "Validate recent data uploads and schedules"

---

### 2.2 System Configuration

**Purpose:** Centralized control of leave policy parameters and system operation  
**Context:** Admin > Configuration tab  

#### 2.2.1 Leave Window Management

**Functionality:** Control when agents can submit leave requests

**Leave Window State:**
- **Status Toggle:** Open/Closed switch
  - When OPEN: Agents can submit requests within configured day range
  - When CLOSED: Agents cannot submit new requests (prevents double-booking)
- **Visual Indicator:** 
  - Green (Unlock icon) when OPEN
  - Red (Lock icon) when CLOSED

**Day Range Configuration:**
- **Start Day:** Number input (1-31)
  - Sets first day of month when requests are accepted
  - Example: "15" = requests open on 15th of each month
  
- **End Day:** Number input (1-31)
  - Sets last day of month when requests expire
  - Example: "25" = requests close on 25th of each month
  
- **Validation:** startDay must be < endDay
- **Info Box:** Display human-readable summary
  - "Agents can apply between day **{startDay}** and day **{endDay}** of each month. Currently **{open ? 'open' : 'closed'}**."

**Side Panel Display:**
- Current status badge (Open/Closed)
- Visual representation of day range (15 → 25)
- Last modified timestamp (optional)

**Save & Audit:**
- "Save Changes" button triggers backend update
- Success toast: "Leave window updated"
- Audit trail: Log who changed what and when

---

#### 2.2.2 Shrinkage Rules Management

**Purpose:** Define leave capacity limits and shrinkage thresholds  

**Rule 1: Max Daily Shrinkage %**
- **Field:** Number input (0-100)
- **Definition:** Maximum percentage of team that can be on leave on any single day
- **Example:** "10" = no more than 10% of team absent on same day
- **Impact:** Used to flag high-risk dates in analytics and supervisor views
- **Default:** 10%

**Rule 2: Max Monthly Shrinkage %**
- **Field:** Number input (0-100)
- **Definition:** Maximum cumulative shrinkage allowed per department per month
- **Example:** "25" = monthly absence cannot exceed 25% of total scheduled hours
- **Impact:** Used for capacity planning and monthly approval decisions
- **Default:** 25%

**Rule 3: Agent Monthly Leave Cap**
- **Field:** Number input (1-31)
- **Definition:** Maximum planned leave days per agent per calendar month
- **Example:** "3" = each agent can take max 3 planned leaves per month
- **Impact:** Prevents single agent from taking excessive time off
- **Default:** 3

**Application:**
- Rules apply across organization at global level
- Can be overridden per-holiday (see Holiday Management)
- Changes take effect immediately for new requests

**Save & Audit:**
- "Save Changes" button triggers backend update
- Success toast: "Shrinkage rules updated"
- Display previous values for comparison (optional)

---

### 2.3 Master Data Management

#### 2.3.1 Holiday Management
**Purpose:** Define organizational holidays and regional variations  
**Context:** Admin > Configuration > Holidays tab  

**Data Structure:**
```
Holiday {
  id: string
  name: string                    // e.g., "Independence Day"
  date: YYYY-MM-DD               // e.g., "2026-07-04"
  type: 'National' | 'Festival' | 'Regional' | 'Company'
  allowedShrinkagePct?: number    // Override max shrinkage for this day
}
```

**Holiday Type Definitions:**
| Type | Icon | Color | Description | Use Case |
|------|------|-------|-------------|----------|
| National | Flag | Blue | Statutory holidays | Independence Day, New Year |
| Festival | Star | Purple | Religious/cultural festivals | Diwali, Christmas |
| Regional | MapPin | Cyan | Region-specific holidays | State holidays |
| Company | Building | Green | Organization-specific closures | Company anniversary, all-hands |

**UI Components:**

**Summary Cards (Top):**
- Display count of each holiday type
- Icon + type name + count layout
- Quick overview of holiday distribution

**Holiday List Table:**
| Column | Type | Sortable | Filterable |
|--------|------|----------|-----------|
| Holiday | Text + Icon | Yes | Yes (by type) |
| Date | Date (MMM DD, YYYY) | Yes | Yes (date range) |
| Type | Badge | Yes | Yes |
| Allowed Shrinkage | % num | Yes | No |
| Actions | Edit/Delete buttons | No | No |

**Add Holiday Dialog:**
- Modal form with fields:
  - **Name** (text input, required)
  - **Date** (date picker, required)
  - **Type** (dropdown: National/Festival/Regional/Company)
  - **Allowed Shrinkage %** (number input, optional)
    - If empty, uses system default (maxDailyPct)
    - If specified, overrides default for this date
- Action buttons: Cancel / Save

**Edit Holiday Dialog:**
- Same form as Add, pre-populated with existing values
- Action buttons: Cancel / Delete / Save

**Delete Confirmation:**
- Toast notification: "Holiday deleted"
- No undo (permanent)

**Sort & Filter:**
- DefaultSort: By date (ascending)
- Filter by Type: Radio buttons for each type
- Search: By holiday name (partial match)

**Import/Export (Future Enhancement):**
- "Import JSON" button with hover state
- Download template for batch imports

---

#### 2.3.2 Locations/Departments (Read-Only)
- Displayed in analytics but not editable in admin
- Managed through separate system administration
- Listed for context in holiday and rule management

---

### 2.4 Data Management & Uploads

**Purpose:** Ingest operational data (schedules, attendance) into system  
**Context:** Admin > Data Management tabs  

#### 2.4.1 Schedule Upload
**Purpose:** Import monthly team shift schedules  

**Accepted Formats:**
- CSV (comma-separated values)
- JSON (array of objects)

**Data Schema:**
```
ScheduleDay {
  userId: string              // Agent user ID
  date: YYYY-MM-DD           // Shift date
  shiftStart: HH:MM          // Clock-in time (24-hour), e.g., "09:00"
  shiftEnd: HH:MM            // Clock-out time (24-hour), e.g., "18:00"
  weekOff: boolean           // true if agent has week-off on this date
}
```

**Workflow:**

1. **Upload Interface:**
   - Drag-and-drop zone for file selection
   - "Load Sample Data" button (pre-loads sample for testing)
   - Upload icon and instructions

2. **File Parsing:**
   - Parse CSV/JSON on client side
   - Validate required fields (userId, date, shiftStart, shiftEnd, weekOff)
   - Auto-detect column mapping from headers
   - Toast: "File parsed — {count} rows detected"

3. **Preview Mode:**
   - Table display of parsed data
   - Columns: User, Date, Shift Start, Shift End, Week Off
   - Color-coded Week Off status:
     - Red/Warning: "Yes" (week-off day)
     - Green/Success: "No" (working day)
   - Ability to scroll through rows
   - Show total: "Preview — {count} rows"

4. **Validation & Save:**
   - User reviews preview
   - "Discard" button: Cancel and return to upload
   - "Save Schedule" button: 
     - Triggers backend batch insert
     - Shows loading state: "Saving…"
     - Success toast: "Schedule saved successfully"
     - Clears preview and returns to upload interface

**Error Handling:**
- Invalid date format: Skip row and highlight in red
- Missing required field: Show error message
- Duplicate entries: Ask for overwrite confirmation

**Constraints:**
- Max file size: 10MB
- Max rows: 10,000 per upload
- Cannot upload past dates (must be current month or future)

---

#### 2.4.2 Attendance Upload
**Purpose:** Record actual attendance and absences  

**Accepted Formats:**
- CSV (comma-separated values)
- JSON (array of objects)

**Data Schema:**
```
Attendance {
  userId: string              // Agent user ID
  date: YYYY-MM-DD           // Attendance date
  present: boolean           // true if agent was present
  leaveType?: 'Planned' | 'Unplanned'  // If absent, leave type
}
```

**Workflow:**

1. **Upload Interface:**
   - Similar to Schedule upload
   - Drag-and-drop zone
   - "Load Sample Data" button
   - Labeled for weekly attendance

2. **File Parsing:**
   - Parse CSV/JSON
   - Validate: userId, date, present, leaveType (if present=false)
   - Toast: "File parsed — {count} rows detected"

3. **Preview Mode:**
   - Table display with columns:
     - User (name)
     - Date (YYYY-MM-DD)
     - Present (icon + text: "Present" or "Absent")
     - Leave Type (Planned/Unplanned/—)
   - Color-coded Present status:
     - Green: Present (CheckCircle icon)
     - Red: Absent (XCircle icon)
   - Total rows shown: "Preview — {count} rows"

4. **Validation & Save:**
   - "Discard" button: Cancel
   - "Save Attendance" button:
     - Batch insert via repo
     - Show loading state: "Saving…"
     - Success toast: "Attendance saved successfully"
     - Return to upload interface

**Rules:**
- If present=true, leaveType is ignored
- If present=false, leaveType should be specified
- Can overlap with leave requests (admin must reconcile manually)

---

### 2.5 Schedule Management (Weekly View)

**Purpose:** Admin-level view of team schedules with editing capabilities  
**Context:** Admin > Schedule tab  

**Reuses:** WeeklyScheduleWorkspace component in "admin" mode

**Features (inherited from mode='admin'):**
- View full organization schedule by week
- Filter by department
- Edit agent shifts and week-offs
- Bulk operations on multiple agents
- Drag-and-drop schedule adjustments (if enabled)
- Publish schedule changes

**Differences from Supervisor Mode:**
- See all departments simultaneously (not just assigned department)
- Cannot see individual agent details (privacy)
- Can apply blanket changes across departments
- Cannot directly handle grievances (supervisors do)

---

### 2.6 Week-Off Swap Approvals

**Purpose:** Final approval layer for supervisor-initiated week-off swap requests  
**Context:** Admin > Week-Off Swaps tab  

**Why Two-Tier Approval?**
- **Supervisor Tier:** Initial review for team feasibility
- **Admin Tier:** Final compliance and coverage check

**Data Structure:**
```
WeekoffSwapRequest {
  id: string
  sourceGuideId: string        // Developer with week-off on sourceDate
  peerGuideId?: string         // Peer to swap with (if swap mode)
  sourceDate: YYYY-MM-DD       // Date with current week-off
  peerDate: YYYY-MM-DD         // Target week-off date
  requesterId: string          // Supervisor who raised request
  mode: 'WeekSwap' | 'WeekMove'
  scope: 'DayRange' | 'SingleDay'
  status: 'PendingAdmin' | 'Approved' | 'Rejected'
  comment?: string             // Supervisor notes on request
  history: Array<{
    actor: string              // User ID of approver
    action: 'Approved' | 'Rejected'
    at: ISO8601 timestamp
  }>
}
```

**Request Status Workflow:**

```
Supervisor Creates Request
             ↓
    PendingSupervisor
             ↓
  Supervisor Reviews/Approves
             ↓
      PendingAdmin
             ↓
     Admin Reviews
       ↙         ↘
    Approved    Rejected
```

**Admin Approval UI:**

**Dashboard Cards (Summary):**
| Card | Metric | Color |
|------|--------|-------|
| Pending Review | Count of PendingAdmin requests | Warning/Orange |
| Approved | Count of Approved requests | Success/Green |
| Rejected | Count of Rejected requests | Muted |

**Pending Requests List:**

**For Each Request, Display:**
- **Header Row:**
  - **Names:** "{SourceGuideName} and {PeerGuideName}" (if swap) or "{SourceGuideName}" (if move)
  - **Metadata:** "Requested by {SupervisorName} • {ModeLabel} • {ScopeLabel}"
  - **Status Badge:** "Pending Admin" (orange/warning)

- **Date Cards (2-column layout):**
  1. Left Card (Source):
     - Label: Guide name
     - Value: Date in formatDate style
  2. Right Card (Peer):
     - Label: Peer guide name (or "Target Week Off")
     - Value: Target date

- **Description Box:**
  - Human-readable summary of request
  - Example: "Swap week-off from March 7-13 to March 14-20"

- **Supervisor Comment (if present):**
  - Quoted text box with context/reasoning
  - Label: "Supervisor note:"

- **Action Buttons:**
  - "Approve" button (green/success):
    - Opens approval comment dialog
    - Triggers approval workflow
  - "Reject" button (red/destructive):
    - Opens rejection comment dialog
    - Triggers rejection workflow

**Approval/Rejection Dialog:**
- Modal with title "Approve Request" or "Reject Request"
- Comment field (optional textarea)
- Action buttons: Cancel / Confirm (Approve/Reject)

**Post-Approval:**
- Reload requests list
- Move approved request to "Reviewed" section
- Success toast with action confirmation
- Updated schedule reflects approval (if auto-publish enabled)

**Reviewed Requests Section:**
- Display all non-pending requests below pending list
- Sorted by most recent approval date (descending)
- Shows same structure as pending but with locked states
- Expand/collapse for archived view

---

## 3. Data Models & Entities

### 3.1 Core Entities
```typescript
// Shrinkage Rules
interface Rules {
  maxDailyPct: number;          // 0-100, default 10
  maxMonthlyPct: number;        // 0-100, default 25
  agentMonthlyLeaveCap: number; // 1-31, default 3
}

// Leave Window
interface LeaveWindow {
  open: boolean;                // Is window accepting applications?
  startDay: number;             // 1-31
  endDay: number;               // 1-31
}

// Holiday
interface Holiday {
  id: string;
  name: string;
  date: string;                 // YYYY-MM-DD
  type: 'National' | 'Festival' | 'Regional' | 'Company';
  allowedShrinkagePct?: number;
}

// Schedule
interface ScheduleDay {
  userId: string;
  date: string;                 // YYYY-MM-DD
  shiftStart: string;           // HH:MM
  shiftEnd: string;             // HH:MM
  weekOff: boolean;
}

// Attendance
interface Attendance {
  userId: string;
  date: string;                 // YYYY-MM-DD
  present: boolean;
  leaveType?: 'Planned' | 'Unplanned';
}

// Week-Off Swap Request
interface WeekoffSwapRequest {
  id: string;
  sourceGuideId: string;
  peerGuideId?: string;
  sourceDate: string;           // YYYY-MM-DD
  peerDate: string;             // YYYY-MM-DD
  requesterId: string;
  mode: 'WeekSwap' | 'WeekMove';
  scope: 'DayRange' | 'SingleDay';
  status: 'PendingAdmin' | 'Approved' | 'Rejected';
  comment?: string;
  weekStart: string;            // YYYY-MM-DD (start of week)
  history: Array<{
    actor: string;
    action: 'Approved' | 'Rejected';
    at: string;                 // ISO 8601
  }>;
}
```

---

## 4. UI/UX Specifications

### 4.1 Navigation Structure
```
Leave Guardian (Admin)
├── Analytics Dashboard (default)
├── Schedule
├── Configuration
│   ├── Leave Window
│   └── Shrinkage Rules
├── Master Data
│   └── Holidays
├── Data Management
│   ├── Upload Schedule
│   └── Upload Attendance
└── Week-Off Swaps (Approvals)
```

### 4.2 Color & Visual Language
- **Primary Action:** Blue (approve, save, add)
- **Success:** Green (approved, present, saved)
- **Warning:** Orange (pending, caution, warning)
- **Destructive:** Red (rejected, delete, absent)
- **Neutral:** Gray (disabled, default)
- **Info:** Cyan/Sky Blue (informational)

### 4.3 Responsive Design
- **Desktop (1920px+):** Full multi-column layouts
- **Tablet (768-1919px):** 2-column layouts, stacked modals
- **Mobile (<768px):** Single-column, stacked cards, bottom-sheet modals

### 4.4 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- ARIA labels on interactive elements
- Color-blind friendly palettes (complementary for icon pairs)
- Font sizes: Min 12px (body), 14px+ (headings)
- Contrast ratio: 4.5:1 for text

---

## 5. Permissions & Access Control

### 5.1 Role-Based Access (RBAC)
| Feature | Admin | Supervisor | Manager | Agent |
|---------|-------|-----------|---------|-------|
| Analytics Dashboard | ✓ (Full) | ✓ (Dept) | ✓ (Org) | ✗ |
| Schedule View | ✓ (All) | ✓ (Dept) | ✗ | ✗ |
| Configuration | ✓ (Full) | ✗ | ✗ | ✗ |
| Master Data (Edit) | ✓ | ✗ | ✗ | ✗ |
| Data Uploads | ✓ | ✗ | ✗ | ✗ |
| Week-Off Approvals | ✓ (Final) | ✓ (Initial) | ✗ | ✗ |
| Leave Decisions | ✗ | ✓ | ✗ | ✗ |

### 5.2 Data Access Rules
- **Own Department:** N/A (Admin sees all)
- **Other Departments:** All visible (no restrictions)
- **Sensitive Data:** Phone/email/personal details not shown to any user
- **Audit Trail:** Logged for all configuration changes

---

## 6. Business Rules & Validations

### 6.1 Leave Window Rules
- `startDay` must be 1-31
- `endDay` must be 1-31
- `startDay` < `endDay` (enforced by validation)
- Changes take effect immediately for new requests
- Existing pending requests unaffected

### 6.2 Shrinkage Rules
- `maxDailyPct`: 0-100, affects daily approval decisions
- `maxMonthlyPct`: 0-100, affects monthly planning
- `agentMonthlyLeaveCap`: 1-31, prevents individual over-allocation
- Rules applied globally; holidays can override

### 6.3 Holiday Rules
- One holiday per date (no duplicates)
- Must have name + date + type
- `allowedShrinkagePct` is optional (uses default if omitted)
- Can be added/edited/deleted independently
- Changes immediate but don't affect existing approvals

### 6.4 Schedule Upload Rules
- Each row requires: userId, date, shiftStart, shiftEnd, weekOff
- Dates must be YYYY-MM-DD format
- Times must be HH:MM format (24-hour)
- Cannot upload past dates
- Duplicate entries (userId + date) will overwrite
- Max 10,000 rows per upload

### 6.5 Attendance Upload Rules
- Each row requires: userId, date, present
- If present=false, leaveType should be specified
- Dates must match schedule dates (validation recommended but not enforced)
- Can retroactively record absences/leaves
- Max 10,000 rows per upload

### 6.6 Week-Off Swap Approval Rules
- Only PendingAdmin requests shown (no other statuses)
- Admin can approve or reject, but not modify request details
- Comment is optional
- Approval triggers schedule update automatically
- Approval history is immutable (audit trail)

---

## 7. Analytics & Reporting

### 7.1 Metrics Tracked
- Total leave requests by status
- Approval rate (approved / decided)
- Shrinkage % trending (planned vs actual)
- Department-wise leave distribution
- Peak-risk dates (high concurrent requests)
- Agent leave utilization

### 7.2 Export Capabilities (Future)
- Export as CSV (analytics summary)
- Export as PDF (formatted report)
- Email scheduled reports
- Integration with BI tools (Tableau, Power BI)

---

## 8. Integration Points

### 8.1 Internal Dependencies
- **useAppStore():** Access to global state (users, leaves, departments, etc.)
- **useToast():** Toast notifications for user feedback
- **WeeklyScheduleWorkspace:** Reused component for schedule management
- **Modal Component:** Reused for dialogs (holidays, approvals)

### 8.2 External Integrations (Future)
- CSV/JSON import from HR systems
- Attendance data from biometric systems
- Slack notifications for pending approvals
- Calendar sync for holidays

---

## 9. Performance & Scalability

### 9.1 Data Limits
- Max departments: 1,000
- Max agents: 50,000
- Max holidays: 500
- Max leave requests: Unlimited (archived)
- Max schedule entries: 50,000/month

### 9.2 Performance Targets
- Analytics dashboard load: < 2 seconds
- Department filter: < 500ms
- Export: < 5 seconds for 10K rows
- File upload: < 30 seconds for 10MB

### 9.3 Caching Strategy
- Cache department list (TTL: 1 hour)
- Cache leave requests (TTL: 5 minutes)
- Cache analytics summaries (TTL: 10 minutes)
- No cache for real-time approvals

---

## 10. Security & Compliance

### 10.1 Data Privacy
- All uploads stored securely (encrypted at rest)
- Access logs maintained for audit
- PII masked in exports (no phone/email)
- GDPR-compliant data retention (30-day purge for rejected requests)

### 10.2 Input Validation
- File upload validation (size, format, schema)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized inputs)
- CSRF protection (token validation)

### 10.3 Audit Trail
- All config changes logged with user + timestamp
- Approval history is immutable
- Uploads tracked with file size + row count
- Deletions (holidays) logged but not reversible

---

## 11. Error Handling & Edge Cases

### 11.1 Common Scenarios
| Scenario | Behavior |
|----------|----------|
| Invalid file format | Show error: "Invalid file format. Please use CSV or JSON." |
| Empty file | Show error: "File is empty. Please check your data." |
| Duplicate holidays | Show warning: "Holiday on this date already exists. Overwrite?" |
| Leave window closed | Action disabled, show: "Window is currently closed." |
| Failed upload | Show error with row details, offer retry |
| Network timeout | Queue for retry, show: "Upload failed. Retrying…" |

### 11.2 Concurrent Edits
- Last-write-wins for config changes
- User sees conflict warning if another admin changed rules during edit
- Reload required to see changes

---

## 12. Future Enhancements (Nice-to-Have)

1. **Bulk Holiday Import:** JSON/CSV batch import for holidays
2. **AI Recommendations:** Predictive shrinkage modeling
3. **Automation Rules:** Auto-approve/reject based on criteria
4. **Approval Workflows:** Multi-stage approvals for complex requests
5. **Audit Reports:** Automated monthly compliance reports
6. **Notifications:** Email/Slack alerts for pending approvals
7. **API:** RESTful API for external integration
8. **Mobile App:** Admin mobile dashboard for on-the-go approvals
9. **Analytics Export:** Download analytics as PDF/Excel
10. **Rollback:** Undo config changes version-by-version

---

## 13. Success Metrics

### 13.1 Adoption KPIs
- Admin login frequency: 5+ times/week
- Configuration changes: 1+/month
- Approval turnaround: < 24 hours
- Holiday accuracy: 100% (no missing holidays)

### 13.2 Operational KPIs
- Data upload success rate: > 95%
- Schedule conflict rate: < 2%
- Attendance accuracy: > 98%
- Rule enforcement rate: 100% (all requests follow rules)

### 13.3 User Satisfaction
- Admin NPS: > 8/10
- Feature adoption: > 80% of features used
- Support tickets: < 5/month related to admin features

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **Shrinkage** | Percentage of team on leave (unavailable) |
| **High-Risk Date** | Date with shrinkage exceeding maxDailyPct thresholdor multiple concurrent requests |
| **Week-Off** | Pre-planned non-working day (scheduled absence) |
| **Week-Off Swap** | Exchange of week-offs between two agents |
| **Week-Off Move** | Shift of week-off from one date to another (no peer) |
| **Approval Tier** | Stage in multi-step approval workflow |
| **Leave Window** | Date range when agents can submit requests (e.g., 1st-25th of month) |
| **Master Data** | Reference data managed centrally (holidays, departments, rules) |

---

## 15. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-13 | Initial PRD based on codebase analysis |

---

**Approved By:** Product Manager  
**Next Review Date:** 2026-07-13
