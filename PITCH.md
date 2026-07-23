# 🏢 HomeCircle
### The Smart, Secure, and Connected Gated Community Management Ecosystem

HomeCircle is a premium, universal mobile and web SaaS platform designed to modernize gated community security, guest entry, amenity booking, and resident services. Built on **Expo 55** and backed by a robust, real-time database architecture using **Supabase**, HomeCircle replaces paper logbooks, fragmented WhatsApp groups, and legacy intercom systems with a unified, high-performance solution.

---

## 🔑 Demo Credentials

To experience the platform's multi-role capabilities, you can log in using the pre-configured credentials below:

### 🛡️ Authorized Portals
| Role | Email Address | Password | Purpose & Access Scope |
| :--- | :--- | :--- | :--- |
| **Society Admin** | `admin@gmail.com` | `123456` | Complete society overview, verification management, amenity creation, global broadcasts, custom polls, and visitor reports. |
| **Resident (Flat Admin)** | `resident@gmail.com` | `123456` | Flat dashboard, add family members & vehicles, pre-approve guests (generates QR pass), raise/monitor complaints, book amenity slots. |
| **Security Guard** | `guard@gmail.com` | `123456` | Quick scanner dashboard to verify guest/resident QR passes, log vehicle entries, process spot guest requests, view duty shift parameters. |

### 🚗 Guest / Visitor Flow
To test the walk-up visitor workflow, register with **any email address** and select the destination target:
* **Society ID**: `HP001`
* **Tower**: `A`
* **Flat Number**: `101`

---

## 💡 Core Pillars & Feature Details

HomeCircle is divided into core functional workflows, ensuring secure validation, seamless operation, and community engagement.

### 🔒 1. Digital Security & Gate Control (QR Pass System)
No more manual entry registers. HomeCircle relies on cryptographically secure, time-bound QR passes.
* **Pre-Approved Guest Entry**: Residents generate temporary QR codes for family, friends, delivery services, or home services. These QR passes contain valid arrival times and flat details.
* **Gate Verification**: The Guard app features a high-speed scanner that parses the QR, matches the guest identity, validates flat details, checks vehicle registers, and logs entry instantly.
* **Real-time Access Notifications**: Residents receive instant notifications when their guests scan in or check out at the gate.

### ⚡ 2. Real-Time Guest Check-in (Interactive Approvals)
When unannounced visitors arrive, HomeCircle initiates a real-time permission request:
* **Digital Check-In**: Guests enter their details (Name, Phone, Relation, Purpose, and Duration) at the gate terminal or on the app.
* **Instant Push Action**: A push notification with custom action buttons (**Approve** or **Reject**) is fired directly to the respective Flat Admin's device.
* **Dynamic Adjustment**: Flat Admins can review the request, change the permitted visiting hours, or accept the entry instantly, immediately generating a QR pass for the visitor.

### 🏢 3. Comprehensive Society & Tower Administration
A structured hierarchy ensures administrative tasks are delegated appropriately:
* **Society Admins** configure the framework: define towers, map flat structures, register gate checkpoints, invite tower admins, and govern global society settings.
* **Tower Admins** handle tower-specific approvals, verify resident onboarding requests, address localized maintenance issues, and manage tower notifications.
* **Enforced Limits**: Define maximum family members and vehicle allocations per flat to maintain parking discipline and resource balance.

### 📅 4. Smart Amenity Booking System
Ensures fair use of common facilities (e.g. Gym, Swimming Pool, Tennis Court, Playground, Community Hall) with rule-based booking:
* **Capacities & Slots**: Define custom opening/closing hours, max slot durations, daily booking limits per resident, and active booking slots.
* **Real-Time Booking**: Residents view available timeslots and book instantly. The system dynamically validates capacity constraints before confirming slots.

### 📣 5. Notices, Announcements & Community Polls
Bridges the communication gap between admins and residents:
* **Targeted Broadcasts**: Admins publish announcements targeting the entire society, specific towers, or only security guards.
* **Interactive Polls**: Admins create polls (e.g. "Should we increase visitor parking charges?") where residents cast secure, single-instance votes.

### 🛠️ 6. Complaint & Ticket Lifecycle
Streamlines internal maintenance and issue tracking:
* **Categorized Tickets**: Residents report issues with Lift, Water, Electricity, Security, or Cleaning directly from their dashboard.
* **Notification Routing**: Ticket creation alerts the respective Tower or Society Admin instantly.
* **Status Tracking**: The system tracks tickets through a clean lifecycle (`Open` ➜ `Assigned` ➜ `In Progress` ➜ `Resolved` ➜ `Closed`) with notifications at each milestone.

---

## 📸 Visual Tour & Workflows

### 1. Onboarding & Authentication
The landing flow introduces the multi-role ecosystem, guiding users through role-specific registration, society setup, and quick authentication.

| Get Started | Select Role | App Overview | Login | Register |
| :---: | :---: | :---: | :---: | :---: |
| ![Get Started](./assets/appScreen/well/get-start.jpeg) | ![Select Role](./assets/appScreen/well/folow.jpeg) | ![Overview](./assets/appScreen/well/flow-screen.jpeg) | ![Login](./assets/appScreen/well/logIn.jpeg) | ![Register](./assets/appScreen/well/register.jpeg) |

---

### 2. Guest Pass Request
Visitors can quickly fill details, upload/choose purposes, select duration (e.g. 1 hour, 1 day), and request digital QR entry passes which instantly alert the Flat Admin.

| Create Request | Select Visitor Profile | Request History |
| :---: | :---: | :---: |
| ![Request Pass](./assets/appScreen/guest-pass-request/request-pass.jpeg) | ![Visitor Profile](./assets/appScreen/guest-pass-request/requet-pass-profile.jpeg) | ![History](./assets/appScreen/guest-pass-request/request-history.jpeg) |

---

### 3. Resident Portal
Residents are greeted with a beautiful dashboard to manage their household members, vehicles, visitors history, and view active amenities and community notices.

| Resident Home | Visitor Passes | Pass Logs | Community Portal | Profile Dashboard | Settings & Limits |
| :---: | :---: | :---: | :---: | :---: | :---: |
| ![Home](./assets/appScreen/resident/home.jpeg) | ![Visitor Pass](./assets/appScreen/resident/visiter-app.jpeg) | ![Visitor History](./assets/appScreen/resident/visitor-history.jpeg) | ![Community](./assets/appScreen/resident/community.jpeg) | ![Profile](./assets/appScreen/resident/profile.jpeg) | ![Profile Settings](./assets/appScreen/resident/profile02.jpeg) |

---

### 4. Security Guard App
Guards scan visitor QR codes or look up resident records at the gate. The dashboard displays instant validation feedback (expired/valid) and syncs entry logs.

| Guard Home | Register Visitor | Visitor Details | Notice Board | Duty Profile |
| :---: | :---: | :---: | :---: | :---: |
| ![Home](./assets/appScreen/guard/home.jpeg) | ![Register](./assets/appScreen/guard/visitor.jpeg) | ![Details](./assets/appScreen/guard/visitor-detials.jpeg) | ![Notices](./assets/appScreen/guard/notices.jpeg) | ![Profile](./assets/appScreen/guard/profile.jpeg) |

---

### 5. Society Admin Dashboard
Admins manage society resources, view visitor counts, publish community announcements, configure polls, and access performance reports.

| Admin Dashboard | Management Tools | Active Notices | Create Polls | Verification Reports | Resident List | Settings Panel | Advanced Config |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| ![Home 01](./assets/appScreen/admin/home01.jpeg) | ![Home 02](./assets/appScreen/admin/home02.jpeg) | ![Notices](./assets/appScreen/admin/notices.jpeg) | ![Polls](./assets/appScreen/admin/notices-poll.jpeg) | ![Reports](./assets/appScreen/admin/report.jpeg) | ![Residents](./assets/appScreen/admin/resident.jpeg) | ![Settings 01](./assets/appScreen/admin/setting01.jpeg) | ![Settings 02](./assets/appScreen/admin/setting02.jpeg) |

---

## ⚡ Technical Architecture Highlights

* **Cross-Platform Compatibility**: Runs seamlessly on iOS, Android, and Web via Expo SDK 55.
* **Row-Level Security (RLS)**: Enforced tables keep each society's data private and secure.
* **Zustand & React Query**: Handles local caching, real-time list validation, and memory-efficient global states.
* **Expo Notifications**: Handles low-latency push notification triggers for access approvals, announcement alerts, and status changes.
