import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { OpsDataProvider } from "@/lib/opsDataStore";
import Dashboard from "./pages/Dashboard";
import Inspection from "./pages/Inspection";
import InspectionAdmin from "./pages/InspectionAdmin";
import FaultAnalysis from "./pages/FaultAnalysis";
import FaultAnalysisDetail from "./pages/FaultAnalysisDetail";
import Assistant from "./pages/Assistant";
import Reports from "./pages/Reports";
import Knowledge from "./pages/Knowledge";
import Assets from "./pages/Assets";
import ObservationConfig from "./pages/ObservationConfig";
import Users from "./pages/Users";
import Audit from "./pages/Audit";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OpsDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inspection" element={<Inspection />} />
              <Route path="/inspection-admin" element={<InspectionAdmin />} />
              <Route path="/fault-analysis" element={<FaultAnalysis />} />
              <Route path="/fault-analysis/:id" element={<FaultAnalysisDetail />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/observation-config" element={<ObservationConfig />} />
              <Route path="/users" element={<Users />} />
              <Route path="/audit" element={<Audit />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </OpsDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
