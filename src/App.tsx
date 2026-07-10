import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inspection from "./pages/Inspection";
import AbnormalRecords from "./pages/AbnormalRecords";
import InspectionAdmin from "./pages/InspectionAdmin";
import Assistant from "./pages/Assistant";
import Reports from "./pages/Reports";
import Knowledge from "./pages/Knowledge";
import Users from "./pages/Users";
import Audit from "./pages/Audit";
import Assets from "./pages/Assets";
import Analysis from "./pages/Analysis";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login";
import { users, type UserItem } from "@/lib/mockData";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "smartops-current-user";

function storedUser(): UserItem | null {
  const userId = localStorage.getItem(AUTH_STORAGE_KEY);
  return users.find((user) => user.id === userId && user.status === "启用") ?? null;
}

const App = () => {
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => storedUser());

  const login = (user: UserItem) => {
    localStorage.setItem(AUTH_STORAGE_KEY, user.id);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login onLogin={login} />} />
            <Route element={currentUser ? <AppLayout currentUser={currentUser} onLogout={logout} /> : <Navigate to="/login" replace />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inspection" element={<Inspection />} />
              <Route path="/inspection/abnormal" element={<AbnormalRecords />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/inspection-admin" element={<InspectionAdmin />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/users" element={<Users />} />
              <Route path="/audit" element={<Audit />} />
            </Route>
            <Route path="*" element={currentUser ? <NotFound /> : <Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
