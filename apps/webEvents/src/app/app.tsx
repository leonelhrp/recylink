import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventList } from '../components/EventList';
import { EventForm } from '../components/EventForm';
import { EventDetail } from '../components/EventDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route index element={<EventList />} />
        <Route
          path="new"
          element={
            <RequireAuth>
              <EventForm />
            </RequireAuth>
          }
        />
        <Route path=":id" element={<EventDetail />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
