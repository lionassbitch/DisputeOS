import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import Disputes from "./pages/Disputes";
import Letters from "./pages/Letters";
import MailQueue from "./pages/MailQueue";
import DeadlineCalendar from "./pages/DeadlineCalendar";
import Compliance from "./pages/Compliance";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import AdminPipeline from "./pages/AdminPipeline";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/reports" component={Reports} />
        <Route path="/disputes" component={Disputes} />
        <Route path="/letters" component={Letters} />
        <Route path="/mail" component={MailQueue} />
        <Route path="/calendar" component={DeadlineCalendar} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/audit" component={AdminAudit} />
        <Route path="/admin/pipeline" component={AdminPipeline} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
