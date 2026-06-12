import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RoomsProvider } from "@/context/RoomsContext";
import { PresenceProvider } from "@/context/PresenceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/NotFound";
import "@/App.css";

function App() {
  return (
    // ThemeProvider goes OUTERMOST (after ErrorBoundary) so theme is
    // available everywhere — even on auth pages where users aren't logged in yet.
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RoomsProvider>
            <PresenceProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
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
            </PresenceProvider>
          </RoomsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;