import { Switch, Route, Redirect } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/auth";

// Pages
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import SubmitIdea from "@/pages/submit-idea";
import MyIdeas from "@/pages/my-ideas";
import Admin from "@/pages/admin";
import UserManagement from "@/pages/user-management";
import AIEvaluator from "@/pages/ai-evaluator";
import NotFound from "@/pages/not-found";

// Add authorization header to all requests
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  const token = tokenStorage.get();
  
  if (token && init) {
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  } else if (token) {
    init = {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  
  return originalFetch.call(this, input, init);
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <AuthRoute>
          <Login />
        </AuthRoute>
      </Route>
      
      <Route path="/signup">
        <AuthRoute>
          <Signup />
        </AuthRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/submit">
        <ProtectedRoute>
          <SubmitIdea />
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-ideas">
        <ProtectedRoute>
          <MyIdeas />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <AdminRoute>
          <Admin />
        </AdminRoute>
      </Route>
      
      <Route path="/admin/users">
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      </Route>
      
      <Route path="/ai-evaluator">
        <ProtectedRoute>
          <AIEvaluator />
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initialize } = useAuth();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
