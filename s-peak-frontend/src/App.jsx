import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/login";
import SignUp from "./pages/auth/signup";
import Landing from "./pages/auth/landing";
import Dashboard from "./pages/auth/dashboard/dashboard";
import History from "./pages/auth/dashboard/history"
import Profile from "./pages/auth/dashboard/profile"
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
            {/* NEW: these two routes didn't exist before — that's why History/Profile were unreachable */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
    
  );
}

export default App;