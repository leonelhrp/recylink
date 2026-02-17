import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center">
      <div className="max-w-screen-lg mx-auto px-4 py-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-4">
              EventBoard
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              Delighthat events{' '}
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                start here.
              </span>
            </h1>
            <p className="mt-5 text-base text-muted-foreground max-w-md leading-relaxed">
              Create an event page, invite your team and manage registrations.
              Organize a memorable event today.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to={isAuthenticated ? '/events/new' : '/register'}>
                <Button size="lg" className="rounded-full px-6">
                  {isAuthenticated ? 'Create Event' : 'Create your first event'}
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/events">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-6"
                  >
                    Explore Events
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="hidden md:flex! justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 rounded-full" />
              <div className="absolute inset-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">E</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      EventBoard
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Workshop: Economia Circular
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hosted by Recylink
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-pink-500 font-medium">Mar 15</span>
                    <span>10:00 AM to 1:00 PM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Centro de Innovacion UC, Santiago
                  </div>
                  <div className="mt-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg text-center">
                    Register Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
