import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./hooks/useAuth";

/* PUBLIC */
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import ResetPassword from "./pages/ResetPassword";

/* CORE */
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import ScheduleCalendar from "./pages/ScheduleCalendar";
import HolidayRequests from "./pages/HolidayRequests";
import Announcements from "./pages/Announcements";
import TimeSheet from "./pages/TimeSheet";
import WorkSession from "./pages/WorkSession";

/* EMPLOYEE */
import MySchedule from "./pages/MySchedule";
import MyHolidays from "./pages/MyHolidays";
import MyLocations from "./pages/MyLocations";

/* OTHER */
import Employees from "./pages/Employees";
import Locations from "./pages/Locations";
import Reports from "./pages/Reports";
import Performance from "./pages/Performance";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import Success from "./pages/Success";
import AppLayout from "./layout/AppLayout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PRIVATE */}
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
          <Route path="/work-session" element={<WorkSession />} />
          <Route path="/timesheet" element={<TimeSheet />} />

          {/* EMPLOYEE */}
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/my-holidays" element={<MyHolidays />} />
          <Route path="/my-locations" element={<MyLocations />} />

          {/* MANAGEMENT */}
          <Route
            path="/schedule"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Schedule />
              </RoleRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <ScheduleCalendar />
              </RoleRoute>
            }
          />

          <Route
            path="/holiday-requests"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <HolidayRequests />
              </RoleRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Announcements />
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

          <Route
            path="/reports"
            element={
              <RoleRoute roles={["admin"]}>
                <Reports />
              </RoleRoute>
            }
          />

          <Route
            path="/performance"
            element={
              <RoleRoute roles={["manager", "admin"]}>
                <Performance />
              </RoleRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <RoleRoute roles={["admin"]}>
                <Billing />
              </RoleRoute>
            }
          />

          <Route
            path="/billing-success"
            element={
              <RoleRoute roles={["admin"]}>
                <Success />
              </RoleRoute>
            }
          />

          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}