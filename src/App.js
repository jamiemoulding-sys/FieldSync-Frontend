import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🌐 PUBLIC
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

// 🧠 CORE APP
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import ScheduleCalendar from "./pages/ScheduleCalendar";
import HolidayRequests from "./pages/HolidayRequests";

// 📊 BUSINESS
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import Billing from "./pages/Billing";

// 👥 MANAGEMENT
import Employees from "./pages/Employees";
import Locations from "./pages/Locations";

// 👤 USER
import Profile from "./pages/Profile";

// 💸 SYSTEM
import Upgrade from "./pages/Upgrade";
import Success from "./pages/Success";
import WorkSession from "./pages/WorkSession";

// 🧱 NEW LAYOUT
import AppLayout from "./layout/AppLayout";

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* ================= APP (WITH LAYOUT) ================= */}
        <Route element={<AppLayout />}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendar" element={<ScheduleCalendar />} />
          <Route path="/holiday-requests" element={<HolidayRequests />} />

          <Route path="/performance" element={<Performance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/billing" element={<Billing />} />

          <Route path="/employees" element={<Employees />} />
          <Route path="/locations" element={<Locations />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/work-session" element={<WorkSession />} />
          <Route path="/success" element={<Success />} />

        </Route>

      </Routes>
    </Router>
  );
}

export default App;