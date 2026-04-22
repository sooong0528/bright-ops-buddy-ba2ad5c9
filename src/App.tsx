import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inspection from "./pages/Inspection";
import Assistant from "./pages/Assistant";
import Reports from "./pages/Reports";
import Knowledge from "./pages/Knowledge";
import Users from "./pages/Users";
import Audit from "./pages/Audit";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inspection" element={<Inspection />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/users" element={<Users />} />
            <Route path="/audit" element={<Audit />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
