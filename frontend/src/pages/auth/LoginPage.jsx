import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle, Eye, EyeOff, Shield, Clock, Users } from 'lucide-react';

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
      <div className="hidden lg:flex lg:w-[480px] relative flex-col justify-between p-10 text-white overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #0f766e 0%, #115e59 40%, #134e4a 100%)' }}
      >
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <span className="text-sm font-bold tracking-tight">W</span>
            </div>
            <span className="tracking-tight">Workly</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="animate-slide-up">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight mb-3">
              Employee Management<br />made simple.
            </h1>
            <p className="text-white/65 text-[15px] leading-relaxed max-w-sm">
              Manage your workforce, track attendance, process payroll, and streamline HR operations — all in one place.
            </p>
          </div>

          <div className="flex gap-6 pt-2 animate-slide-up delay-2">
            <div className="flex items-center gap-2 text-white/50">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Role-based access</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Real-time tracking</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <Users className="h-4 w-4" />
              <span className="text-xs">Team management</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-white/30 animate-fade-in">
          © 2026 Workly · Meridian Technologies
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-[hsl(var(--secondary))]/40">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 text-lg font-semibold mb-8 text-[hsl(var(--foreground))]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white">
              <span className="text-sm font-bold tracking-tight">W</span>
            </div>
            <span className="tracking-tight">Workly</span>
          </div>

          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1 tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Enter your credentials to access the dashboard.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 animate-slide-down">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slide-up delay-1">
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]"
                placeholder="Enter your username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="animate-slide-up delay-2">
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="animate-slide-up delay-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-press"
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
            </div>
          </form>

          <p className="mt-6 text-xs text-center text-[hsl(var(--muted-foreground))] animate-fade-in delay-4">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
