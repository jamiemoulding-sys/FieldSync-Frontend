// src/App.js
// FINAL PAID PLATFORM VERSION
// 14 day trial -> auto lock after expiry
// Admin forced to billing
// Staff shown expired page
// Central protection for whole app
// ✅ Added plan tier protection
// ✅ Nothing removed

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

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
import Notifications from "./pages/Notifications";

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

/* ===================================================== */

function ScreenLoader() {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
      Loading...
    </div>
  );
}

function ExpiredPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#020617] p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">
          Subscription Expired
        </h1>

        <p className="text-gray-400 text-sm">
          Your company trial has ended.
          Please contact your admin.
        </p>
      </div>
    </div>
  );
}

/* ===================================================== */

function VisibilityRefresh() {
  const { reloadUser } = useAuth();

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        reloadUser();
      }
    };

    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    window.addEventListener(
      "focus",
      onVisible
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisible
      );

      window.removeEventListener(
        "focus",
        onVisible
      );
    };
  }, [reloadUser]);

  return null;
}

/* ===================================================== */

function ProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading)
    return <ScreenLoader />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !user.hasPremiumAccess
  ) {
    if (
      user.role === "admin"
    ) {
      return (
        <Navigate
          to="/billing"
          replace
        />
      );
    }

    return <ExpiredPage />;
  }

  return children;
}

/* ===================================================== */

function RoleRoute({
  roles,
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading)
    return <ScreenLoader />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !user.hasPremiumAccess
  ) {
    if (
      user.role === "admin"
    ) {
      return (
        <Navigate
          to="/billing"
          replace
        />
      );
    }

    return <ExpiredPage />;
  }

  if (
    !roles.includes(
      user.role
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

/* ===================================================== */
/* NEW PLAN ROUTE */

function PlanRoute({
  plans,
  children,
}) {
  const {
    user,
    loading,
    trialActive,
    plan,
  } = useAuth();

  if (loading)
    return <ScreenLoader />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !user.hasPremiumAccess
  ) {
    return (
      <Navigate
        to="/billing"
        replace
      />
    );
  }

  /* trial unlocks all */
  if (trialActive) {
    return children;
  }

  if (
    plans.includes(plan)
  ) {
    return children;
  }

  return (
    <Navigate
      to="/billing"
      replace
    />
  );
}

/* ===================================================== */

function PublicOnly({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading)
    return <ScreenLoader />;

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

/* ===================================================== */

export default function App() {
  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    const t =
      setTimeout(
        () =>
          setReady(true),
        150
      );

    return () =>
      clearTimeout(t);
  }, []);

  if (!ready)
    return <ScreenLoader />;

  return (
    <Router>
      <VisibilityRefresh />

      <Routes>
        {/* PUBLIC */}

        <Route
          path="/"
          element={
            <PublicOnly>
              <Landing />
            </PublicOnly>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        <Route
          path="/set-password"
          element={
            <SetPassword />
          }
        />

        <Route
          path="/accept-invite"
          element={
            <SetPassword />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />

        {/* BILLING */}

        <Route
          path="/billing"
          element={<Billing />}
        />

        <Route
          path="/billing-success"
          element={<Success />}
        />

        {/* PRIVATE */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/work-session"
            element={
              <WorkSession />
            }
          />

          <Route
            path="/notifications"
            element={
              <Notifications />
            }
          />

          <Route
            path="/my-schedule"
            element={
              <MySchedule />
            }
          />

          <Route
            path="/my-holidays"
            element={
              <MyHolidays />
            }
          />

          <Route
            path="/my-locations"
            element={
              <MyLocations />
            }
          />

          {/* STARTER+ */}
          <Route
            path="/timesheet"
            element={
              <PlanRoute
                plans={[
                  "starter",
                  "pro",
                  "business",
                ]}
              >
                <TimeSheet />
              </PlanRoute>
            }
          />

          {/* MANAGER+ */}

          <Route
            path="/schedule"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <Schedule />
              </RoleRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <ScheduleCalendar />
              </RoleRoute>
            }
          />

          <Route
            path="/holiday-requests"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <HolidayRequests />
              </RoleRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <Announcements />
              </RoleRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <Employees />
              </RoleRoute>
            }
          />

          <Route
            path="/locations"
            element={
              <RoleRoute
                roles={[
                  "manager",
                  "admin",
                ]}
              >
                <Locations />
              </RoleRoute>
            }
          />

          {/* PRO+ */}

          <Route
            path="/performance"
            element={
              <PlanRoute
                plans={[
                  "pro",
                  "business",
                ]}
              >
                <RoleRoute
                  roles={[
                    "manager",
                    "admin",
                  ]}
                >
                  <Performance />
                </RoleRoute>
              </PlanRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PlanRoute
                plans={[
                  "pro",
                  "business",
                ]}
              >
                <RoleRoute
                  roles={[
                    "admin",
                  ]}
                >
                  <Reports />
                </RoleRoute>
              </PlanRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}