import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Upgrade from './pages/Upgrade';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Performance from './pages/Performance';
import Success from './pages/Success';
import Employees from './pages/Employees';
import Locations from './pages/Locations';
import Reports from './pages/Reports';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import ScheduleCalendar from "./pages/ScheduleCalendar";

import WorkSession from './pages/WorkSession';

function App() {
  return (
    <Router>
      <Routes> 

        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/calendar" element={<ScheduleCalendar />} />

        <Route path="/employees" element={<Employees />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/performance" element={<Performance />} />

        <Route path="/work-session" element={<WorkSession />} />
        <Route path="/success" element={<Success />} />

      </Routes>
    </Router>
  );
}

export default App;