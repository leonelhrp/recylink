import * as React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { HomePage } from '../components/HomePage';
import { LoginPage } from '../components/LoginPage';
import { RegisterPage } from '../components/RegisterPage';
import { EventsErrorBoundary } from '../components/EventsErrorBoundary';

const WebEvents = React.lazy(() => import('webEvents/Module'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function EventsFallback() {
  return (
    <div className="max-w-screen-md mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <React.Suspense fallback={<EventsFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/events/*"
                element={
                  <EventsErrorBoundary>
                    <WebEvents />
                  </EventsErrorBoundary>
                }
              />
            </Routes>
          </React.Suspense>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
