import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import MasterEntryPage from "./pages/MasterEntryPage";
import ExpensesPage from "./pages/ExpensesPage";
import { authService } from "./lib/auth";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Layout />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            >
              <Route index element={<DashboardPage />} />
            </Route>
            <Route 
              path="/master-entry" 
              element={
                isAuthenticated ? (
                  <Layout />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            >
              <Route index element={<MasterEntryPage />} />
            </Route>
            <Route 
              path="/expenses" 
              element={
                isAuthenticated ? (
                  <Layout />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            >
              <Route index element={<ExpensesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
