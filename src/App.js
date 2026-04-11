import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./hooks/useAuth";

/* 🌐 PUBLIC */
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

/* 🧠 CORE APP */
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import ScheduleCalendar from "./pages/ScheduleCalendar";
import HolidayRequests from "./pages/HolidayRequests";
import Announcements from "./pages/Announcements";

/* 📊 BUSINESS */
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import Billing from "./pages/Billing";

/* 👥 MANAGEMENT */
import Employees from "./pages/Employees";
import Locations from "./pages/Locations";

/* 👤 USER */
import Profile from "./pages/Profile";

/* 💸 SYSTEM */
import Upgrade from "./pages/Upgrade";
import Success from "./pages/Success";
import WorkSession from "./pages/WorkSession";

/* 🧱 LAYOUT */
import AppLayout from "./layout/AppLayout";

//
// =======================
// 🔐 PROTECTED ROUTE
// =======================
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

//
// =======================
// 🔒 ROLE ROUTE
// =======================
function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

//
// =======================
// 🚀 APP
// =======================
function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* ================= PRIVATE APP ================= */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          {/* CORE */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendar" element={<ScheduleCalendar />} />
          <Route path="/work-session" element={<WorkSession />} />

          {/* 🔒 ANNOUNCEMENTS (MANAGER + ADMIN ONLY) */}
          <Route
            path="/announcements"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Announcements />
              </RoleRoute>
            }
          />

          {/* 🔒 MANAGER + ADMIN */}
          <Route
            path="/holiday-requests"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <HolidayRequests />
              </RoleRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Employees />
              </RoleRoute>
            }
          />

          <Route
            path="/locations"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Locations />
              </RoleRoute>
            }
          />

          {/* 🔒 BUSINESS */}
          <Route
            path="/performance"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Performance />
              </RoleRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Reports />
              </RoleRoute>
            }
          />

          {/* 🔒 ADMIN ONLY */}
          <Route
            path="/billing"
            element={
              <RoleRoute roles={["admin"]}>
                <Billing />
              </RoleRoute>
            }
          />

          {/* ACCOUNT */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/success" element={<Success />} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;