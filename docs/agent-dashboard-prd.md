# Agent Dashboard PRD

## Document Purpose
This document defines the product requirements for the Agent Dashboard. It is written for product, design, engineering, operations, QA, and business stakeholders. The goal is to describe what the dashboard should achieve and what features it must provide, without going into frontend, backend, or code-level implementation details.

## Document Status
- Status: Draft
- Last updated: 2026-04-03
- Product area: Agent Experience

## Product Summary
The Agent Dashboard is the main landing experience for an agent in the leave management system. It should give a quick, trustworthy summary of the agent's leave situation, highlight actions that need attention, and guide the agent to the right next step.

The dashboard is not meant to replace full workflows such as applying for leave or reviewing full leave history. Its role is to provide clarity, urgency, and direction.

## Problem Statement
Agents often need to answer a few simple questions as soon as they enter the system:
- What is the status of my leave requests?
- How much leave do I have remaining this month?
- Is anything waiting for my action?
- Where do I go next?

When this information is scattered across different parts of the product, agents spend more time navigating, may miss time-sensitive actions, and have lower confidence in the leave process.

## Goals
- Give agents an immediate understanding of their current leave status
- Surface actions that need attention, especially time-sensitive ones
- Reduce effort for common next steps
- Improve transparency and confidence in the leave process

## Non-Goals
- Replacing the full leave application flow
- Replacing the full leave history or summary experience
- Supporting supervisor, manager, or admin workflows from this dashboard
- Managing policy configuration, leave rules, or quota settings from this dashboard

## Primary User
- Agent

## Secondary Stakeholders
- Supervisors who depend on timely agent actions
- Operations teams monitoring leave process efficiency
- Product, design, and engineering teams responsible for the agent experience

## User Needs
- I want to know whether any of my leave requests are still pending.
- I want to know how much leave I have left this month.
- I want to quickly see any request that needs my response.
- I want a simple path to apply for leave, review my leave history, or manage swaps.
- I want confidence that the system is showing me the latest, relevant information.

## Scope

### In Scope
- Agent-facing dashboard overview
- Summary of leave-related status and counts
- Visibility into pending requests
- Visibility into monthly leave balance
- Quick access to major leave tasks
- Recent leave-related activity
- Incoming leave swap requests that require agent action

### Out of Scope
- Full leave application details
- Full leave summary and detailed record management
- Supervisor approval workflows beyond agent participation
- Admin or manager reporting
- Leave policy administration

## Experience Principles
- Clarity first: the most important information should be visible immediately.
- Action-oriented: the dashboard should help the agent know what to do next.
- Trustworthy: statuses, counts, and alerts should feel accurate and easy to understand.
- Lightweight: the dashboard should summarize, not overwhelm.

## Core Features

### 1. Dashboard Overview
The dashboard should provide a clear introduction to the agent's current context.

Requirements:
- Show the agent's identity clearly.
- Show the relevant working context, such as department and current period.
- Present a concise summary so the agent can immediately understand what the dashboard is about.

### 2. Leave Summary Metrics
The dashboard should provide a high-level snapshot of the agent's leave record at a glance.

The summary should help the agent quickly understand:
- Total leave requests
- Approved requests
- Pending requests
- Rejected requests
- Leave swaps

Requirements:
- Metrics should be easy to scan and compare.
- Labels should be written in simple business language.
- The summary should help the agent understand the overall state without reading detailed records.

### 3. Pending Requests
The dashboard should show leave requests that are still in progress.

Requirements:
- Clearly identify requests that are still waiting for action.
- Make it understandable whether a request is waiting on a peer or a supervisor.
- Highlight time-sensitive approvals when relevant.
- Show a meaningful empty state when there are no pending requests.
- Offer a clear path to the fuller leave details experience.

### 4. Monthly Leave Balance
The dashboard should show the agent's current-month leave balance in a simple and understandable way.

Requirements:
- Show leave already used in the current month.
- Show leave remaining in the current month.
- Show the monthly limit.
- Present balance information in a way that supports quick decision-making.

### 5. Quick Actions
The dashboard should give agents direct access to their most common next steps.

Required quick actions:
- Apply for leave
- View leave summary
- Manage or initiate leave swaps

Requirements:
- Quick actions should be easy to find and clearly named.
- These actions should reduce the need for agents to search the product for common tasks.

### 6. Recent Activity
The dashboard should provide a recent activity view so agents can understand what has happened lately.

Examples of activity may include:
- Leave approvals
- Leave rejections
- Leave cancellations
- Recorded unplanned leave events

Requirements:
- Activity should be shown in chronological order, with the most recent first.
- Each activity item should be easy to interpret without extra context.
- If no activity exists, the dashboard should show a clear empty state.

### 7. Incoming Swap Requests
The dashboard should surface leave swap requests that require a response from the agent.

Requirements:
- Show who made the request.
- Show the relevant dates involved in the swap.
- Indicate the current state of the request.
- Highlight any timing-related warning or risk that may affect the swap.
- Make it easy for the agent to open the request and review it.

### 8. Swap Review and Confirmation
The dashboard should allow the agent to review and confirm an incoming swap request when appropriate.

Requirements:
- The review experience should clearly explain the request.
- The agent should be able to add an optional comment before confirming.
- Confirmation should require an explicit final step to avoid accidental approval.
- Invalid swap scenarios should be blocked with a clear explanation.
- After confirmation, the request should move forward in the approval process.

### 9. Empty States and Feedback
The dashboard should communicate clearly when no information is available in a module and should confirm the result of important actions.

Requirements:
- Each major module should have a purposeful empty state.
- Success messages should confirm completed actions.
- Error messages should explain what went wrong and why.

## Business Rules
- The dashboard should show information relevant to the signed-in agent.
- Monthly leave balance should reflect the leave allowance defined by business policy.
- Pending requests should include items that are still waiting for an approval or response.
- Incoming swap requests should only appear when the agent is the person expected to respond.
- Invalid swap combinations must not be allowed to proceed.
- Time-sensitive items should be highlighted when they are approaching important policy deadlines.
- Important agent actions should be recorded in the leave process history.

## User Stories
- As an agent, I want to understand my current leave situation as soon as I open the system.
- As an agent, I want to know whether any of my requests are still waiting for approval.
- As an agent, I want to see how much leave I have remaining this month before I take action.
- As an agent, I want to quickly open the leave task I need most without searching through the system.
- As an agent, I want to review and respond to an incoming leave swap request from the dashboard.
- As an agent, I want the system to explain alerts and blocked actions clearly so I know what to do next.

## Success Metrics
- Reduction in time taken for an agent to identify pending leave items
- Increase in usage of dashboard quick actions for common leave tasks
- Faster response time for incoming swap requests
- Reduction in missed or delayed agent responses to pending swap requests
- Reduction in support or clarification requests related to leave status visibility

## Dependencies
- Accurate leave request records
- Accurate user and department information
- Up-to-date leave policy and monthly allowance rules
- Reliable attendance or operational data for unplanned leave activity
- Consistent approval workflow records and status tracking

## Risks
- If labels are unclear, agents may misunderstand summary counts versus monthly balance.
- If alerts are too subtle, agents may miss time-sensitive items.
- If the dashboard becomes too dense, it may stop being useful as a quick summary.
- If status definitions are not consistent across the product, trust in the dashboard may decrease.

## Open Questions
1. Should summary metrics reflect lifetime activity, current period activity, or both?
2. Should the dashboard support rejecting incoming swap requests, or only reviewing and approving them?
3. How prominently should overdue or urgent requests be displayed compared with standard pending items?
4. Should the dashboard include deeper policy guidance, or should it remain focused on action and summary only?
5. How much historical activity is useful before the dashboard starts feeling cluttered?

## Acceptance Criteria
1. An agent can open the dashboard and quickly understand their current leave situation.
2. The dashboard clearly shows leave summary metrics in a way that is easy to scan.
3. The dashboard highlights pending requests and makes their status understandable.
4. The dashboard shows monthly leave balance clearly enough to support decision-making.
5. The dashboard provides obvious access to the most common leave-related tasks.
6. The dashboard shows recent leave-related activity in a useful, understandable way.
7. Incoming swap requests that require action are visible on the dashboard.
8. An agent can review and confirm an eligible incoming swap request from the dashboard.
9. Invalid swap scenarios are blocked with clear feedback.
10. The dashboard provides meaningful empty states and action feedback where needed.

## Glossary
- Agent: The employee using the dashboard to manage their own leave-related tasks.
- Pending request: A leave request that has not yet completed the approval process.
- Leave balance: The amount of leave used and remaining within the current month or policy period.
- Swap request: A request between agents to exchange leave dates.
- Time-sensitive alert: A warning shown when a request is approaching an important policy deadline or operational cutoff.
