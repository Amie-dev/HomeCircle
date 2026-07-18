checked my this project and build baas in superbace all and menage alltate i past prd check all @supabse  all all requets table and rls
This is becoming a **real production system**, so instead of thinking in screens, think in **workflows**. Since you're using **Supabase (BaaS)**, the backend should be organized around modules, database tables, RLS policies, triggers, and push notifications.

Below is a complete **Admin System Specification** that covers everything you described and is suitable as a project blueprint.

---

# Portl Admin Workflow (Complete System Design)

## 1. System Hierarchy

```
Platform

└── Society
      │
      ├── Society Admin
      │
      ├── Tower A
      │      ├── Tower Admin
      │      ├── Flat A101
      │      ├── Flat A102
      │      └── ...
      │
      ├── Tower B
      │      ├── Tower Admin
      │      ├── Flat B101
      │      └── ...
      │
      ├── Security Guards
      │
      ├── Residents
      │
      ├── Amenities
      │
      ├── Visitor Logs
      │
      └── Community Services
```

---

# User Roles

| Role            | Description                         |
| --------------- | ----------------------------------- |
| Guest           | Temporary visitor requesting access |
| Resident Member | Family member living in a flat      |
| Flat Admin      | Owner or primary resident of a flat |
| Tower Admin     | Manages one tower                   |
| Society Admin   | Manages the entire society          |
| Security Guard  | Handles visitor entry/exit          |

---

# Society Admin Workflow

## Step 1 — Register as Society Admin

Fields

* Full Name
* Email
* Phone
* Password
* Profile Photo
* Identity Proof

Status

```
Pending Verification
```

↓

Verified by Platform

↓

Become Society Admin

---

## Step 2 — Create Society

Fields

* Society Name
* Society Code (Unique)
* Address
* State
* City
* PIN Code
* Latitude
* Longitude
* Society Logo
* Description

Example

```
Green Valley Residency

Code

GVR-2026
```

Only one Society Admin can create/manage the society initially. Additional Society Admins can be invited later.

---

## Step 3 — Configure Society

Society Admin configures:

* Towers
* Flats
* Parking
* Amenities
* Maintenance Rules
* Visitor Rules
* Vehicle Limits
* Flat Member Limits

---

# Tower Management

Society Admin can

* Create Tower
* Edit Tower
* Delete Tower
* Assign Tower Admin

Example

```
Tower A

Tower B

Tower C
```

Each tower has:

```
Tower

↓

Many Flats
```

---

# Flat Management

Each Flat contains:

```
Flat Number

Tower

Floor

Maximum Members

Maximum Vehicles

Status
```

Example

```
Flat

A-101

Members

6

Vehicles

2
```

Flat limits control:

* Maximum family members
* Maximum vehicles
* Booking permissions

---

# Society Amenities

Admin creates amenities.

Examples

* Gym
* Swimming Pool
* Playground
* Community Hall
* Club House
* Tennis Court
* Parking Hall

Each amenity contains

```
Name

Description

Opening Time

Closing Time

Maximum Capacity

Booking Slot Duration

Maximum Booking Per Day

Booking Enabled
```

---

# Booking Rules

Example

Swimming Pool

```
Capacity

20

Booking

30 Minutes

Opening

6 AM

Closing

9 PM
```

If full

↓

Booking denied

Otherwise

↓

Booking confirmed

---

# Resident Registration Workflow

User signs up.

Role

```
Flat Admin
```

User submits

* Society Code
* Tower
* Flat
* Personal Details
* Identity Proof

↓

Request created

↓

Tower Admin or Society Admin reviews

↓

Approve or Reject

---

# Flat Admin Verification

After verification

Flat Admin becomes active.

Automatic actions

* Generate Resident QR
* Enable Dashboard
* Send Push Notification
* Grant Flat Permissions

---

# Flat Member Management

Flat Admin can add members.

Example

```
Father

Mother

Brother

Sister

Spouse

Child
```

Validation

```
Current Members

4

Maximum

6

Remaining

2
```

Cannot exceed flat limit.

---

# Vehicle Management

Flat Admin can register vehicles.

Fields

* Vehicle Type
* Vehicle Number
* Brand
* Color
* Owner

Validation

```
Vehicle Limit

2

Already Registered

2

↓

Cannot Add More
```

---

# QR Identity System

Every approved resident receives

Permanent QR

Contains

* Resident ID
* Flat ID
* Society ID
* QR Expiry
* Verification Status

Guard scans

↓

Resident details displayed

---

# Society Notifications

Society Admin can create

* Notices
* Announcements
* Emergencies
* Maintenance Alerts

Target Audience

* Entire Society
* Tower
* Selected Flats
* Guards

Push Notification

↓

Resident opens notice

---

# Poll System

Society Admin creates polls.

Example

```
Should Parking Charges Increase?

Yes

No
```

Residents vote once.

---

# Events

Society Admin creates

* Cultural Events
* Meetings
* Sports
* Festivals

Residents register.

Capacity control.

Waitlist support.

---

# Maintenance Fees

Admin creates

* Monthly Maintenance
* Water Bill
* Parking Charges
* Special Assessment

Resident sees

* Due
* Paid
* Upcoming

Payment history stored.

---

# Complaint Management

Resident raises complaint.

Categories

* Lift
* Water
* Electricity
* Security
* Cleaning
* Parking

Notification sent to

* Tower Admin
* Society Admin

Complaint lifecycle

```
Open

↓

Assigned

↓

In Progress

↓

Resolved

↓

Closed
```

---

# Visitor Management

Flat Admin creates

Pre-approved visitor.

Fields

* Visitor Name
* Phone
* Purpose
* Relation
* Vehicle Number
* Visit Date
* Valid Until

↓

Generate QR

↓

Push Notification

↓

Visitor receives QR

---

# Visitor Categories

* Family
* Guest
* Friend
* Delivery
* Service Provider
* Cab
* Maid
* Driver
* Technician

---

# Visitor Verification

Guard scans QR.

System verifies

* Flat Exists
* QR Valid
* Expiry Time
* Vehicle Number
* Approval Status

↓

Entry Allowed

↓

Entry Log Created

↓

Resident notified

---

# Visitor Logs

Society Admin can see

* Visitor
* Flat
* Guard
* Entry Time
* Exit Time
* Purpose
* Vehicle
* Status

Filters

* Today
* Week
* Month
* Tower
* Flat

---

# Security Guard Workflow

Guard registers.

Fields

* Name
* Phone
* Email
* ID Proof
* Society Code

↓

Request sent

↓

Society Admin reviews

↓

Approve

↓

Assign Gate

↓

Assign Shift

↓

Guard activated

---

# Guard Dashboard

Guard can

* Register Visitor
* Scan QR
* Verify Vehicle
* Entry
* Exit
* Search Resident
* View Duty Notices
* Visitor History

Profile shows

* Duty Time
* Assigned Gate
* Attendance
* Entry Count
* Exit Count

---

# Guest Workflow

Guest creates account once.

Fields

* Name
* Email
* Phone
* Profile Photo
* Vehicle (Optional)

Stored permanently.

Guest enters

* Society Code
* Tower
* Flat
* Relation
* Purpose
* Duration

↓

Request sent

↓

Flat Admin notified

↓

Approve or Reject

Flat Admin may

* Change visit duration
* Update purpose
* Reject request

↓

Guest receives push notification

↓

QR generated automatically

↓

Guard scans QR

↓

Entry approved

---

# Push Notification Flow

## Flat Admin Request

User requests Flat Admin role

↓

Tower Admin / Society Admin notified

↓

Approve / Reject

↓

Applicant notified

---

## Guard Registration

Guard registers

↓

Society Admin notified

↓

Approve / Reject

↓

Guard notified

---

## Guest Request

Guest requests visit

↓

Flat Admin notified

↓

Approve / Reject

↓

Guest notified

---

## Complaint

Resident raises complaint

↓

Tower Admin / Society Admin notified

↓

Status updates sent to resident

---

## Booking

Resident books amenity

↓

Booking confirmed

↓

Reminder before booking starts

---

# Admin Dashboard Modules

* Society Management
* Towers
* Flats
* Tower Admins
* Flat Admin Approvals
* Residents
* Family Members
* Vehicles
* Amenities
* Booking Management
* Visitor Management
* Visitor Logs
* QR Management
* Security Guards
* Guard Shift Management
* Complaints
* Notices
* Polls
* Events
* Maintenance & Billing
* Push Notifications
* Reports & Analytics
* Settings
* Audit Logs

---

## Recommended Supabase Backend Modules

Organize your backend around these tables and services:

* `profiles` (all users and roles)
* `societies`
* `towers`
* `flats`
* `flat_members`
* `vehicles`
* `amenities`
* `amenity_bookings`
* `visitor_passes`
* `visitor_logs`
* `guard_assignments`
* `complaints`
* `notices`
* `polls`
* `poll_votes`
* `events`
* `event_registrations`
* `maintenance_invoices`
* `maintenance_payments`
* `notifications`
* `approval_requests`
* `audit_logs`

Use **Supabase Auth** for authentication, **PostgreSQL** for relational data, **Row Level Security (RLS)** for role-based permissions, **Database Triggers** to create notifications and audit entries automatically, **Realtime** for live updates (visitor approvals, complaint status, etc.), and **Edge Functions** where server-side logic is required (for example, sending push notifications or validating complex workflows).

This architecture is scalable enough to support multiple societies while keeping permissions and workflows isolated for each society.

