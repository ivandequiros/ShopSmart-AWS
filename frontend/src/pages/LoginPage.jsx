import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/orders';

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirectTo} replace />;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
      navigate(redirectTo, { replace: true });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout-layout">
      <form onSubmit={submit}>
        <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'NEW CUSTOMER'}</p>
        <h1>{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
        <p><small>Classroom demo: use a fictional name and a test email only.</small></p>

        <StatusMessage type="error">{error}</StatusMessage>

        {mode === 'register' && (
          <label>
            Full name
            <input name="name" value={form.name} onChange={updateField} minLength="2" maxLength="80" required />
          </label>
        )}

        <label>
          Email address
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={updateField}
            minLength={mode === 'register' ? 8 : 1}
            maxLength="128"
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p>
          {mode === 'login' ? 'No account yet? ' : 'Already registered? '}
          <button
            type="button"
            className="link-button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in instead'}
          </button>
        </p>
      </form>
    </section>
  );
}
