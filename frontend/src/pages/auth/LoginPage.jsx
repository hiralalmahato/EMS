import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-[hsl(var(--primary))] flex-col justify-between p-10 text-white">
        <div>
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20">
              <span className="text-sm font-bold">EM</span>
            </div>
            Workly
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-snug mb-3">
            Employee Management<br />made simple.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Manage your workforce, track attendance, process payroll, and streamline HR operations — all in one place.
          </p>
        </div>
        <p className="text-xs text-white/40">© 2026 Workly. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-[hsl(var(--secondary))]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 text-lg font-semibold mb-8 text-[hsl(var(--foreground))]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-white">
              <span className="text-sm font-bold">EM</span>
            </div>
            Workly
          </div>

          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1">Sign in</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Enter your credentials to access the dashboard.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
                placeholder="Enter your username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 pr-9 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]/90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-[hsl(var(--muted-foreground))]">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
