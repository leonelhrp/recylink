import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const offset = -now.getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '';
  const tz = `GMT${sign}${offset}`;

  return `${time} ${tz}`;
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentTime = useCurrentTime();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [{ to: '/events', label: 'Events', icon: CalendarDays }];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-1.5 mr-2">
              <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background text-xs font-bold">E</span>
              </div>
            </Link>
            <div className="hidden sm:flex! items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    location.pathname === to ||
                      (to === '/events' &&
                        location.pathname.startsWith('/events'))
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Time + Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums hidden sm:block!">
              {currentTime}
            </span>

            {isAuthenticated ? (
              <>
                <Link
                  to="/events/new"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                >
                  <Plus className="w-4 h-4 sm:hidden!" />
                  <span className="hidden sm:inline!">Create Event</span>
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-ring transition-all"
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border rounded-xl shadow-lg p-1 z-50">
                      <div className="px-3 py-2 border-b mb-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/events"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex! items-center gap-1"
                >
                  Explore
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
