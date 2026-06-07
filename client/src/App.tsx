// App is the root component. It sets up:
//   1. AuthProvider — so any component can call useAuth() and get user state.
//   2. Routing — URL determines which page renders.
//   3. Protected routes — /chat redirects to /login if not authenticated.

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    // AuthProvider goes ABOVE the router so every page has access to useAuth.
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/*
            Wrap the Chat element in ProtectedRoute. If the user isn't
            logged in, ProtectedRoute redirects to /login instead of
            rendering Chat. This is the canonical React Router v6 pattern
            for auth-gated routes.
          */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;