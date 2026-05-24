import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import MockTest from './pages/MockTest';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import TraineePortal from './pages/TraineePortal';
import RequireAuth from './components/RequireAuth';
import './styles/theme.css';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route
              path="/"
              element={(
                <RequireAuth>
                  <Home />
                </RequireAuth>
              )}
            />
            <Route path="/login" element={<TraineePortal />} />
            <Route path="/trainee" element={<Navigate to="/login" replace />} />
            <Route
              path="/test"
              element={(
                <RequireAuth>
                  <MockTest />
                </RequireAuth>
              )}
            />
            <Route
              path="/results"
              element={(
                <RequireAuth>
                  <Results />
                </RequireAuth>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
