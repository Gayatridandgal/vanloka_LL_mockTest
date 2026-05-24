import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function TraineePortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { demoCredentials, isAuthenticated, login, user } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromPath = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={fromPath} replace />;
  }

  const demoHint = `${demoCredentials.name} / ${demoCredentials.mobile}`;

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const isNameMatch = name.trim().toLowerCase() === demoCredentials.name.toLowerCase();
      const isMobileMatch = mobile.replace(/\D/g, '').slice(-10) === demoCredentials.mobile;

      if (!isNameMatch || !isMobileMatch) {
        throw new Error('Invalid credentials');
      }

      login({ name, mobile });
      navigate('/', { replace: true });
    } catch (loginError) {
      console.log('Demo login failed:', loginError);
      setError(`Use the demo credentials: ${demoHint}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <header className="login-header">VanLoka MDS Mock Test Portal</header>

      <section className="login-card" aria-label="Login form">
        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-field">
            <span>Name</span>
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="login-field">
            <span>Mobile Number</span>
            <input autoComplete="tel" inputMode="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} />
          </label>
          <button className="btn primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Confirm / Login'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default TraineePortal;
