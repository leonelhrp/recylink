import { Link } from 'react-router-dom';
import { CalendarDays, Users, Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-screen-md mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            EventBoard
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            Discover and create events for your team. Workshops, meetups, talks
            and social gatherings — all in one place.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/events">
              <Button size="lg">Browse Events</Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: 'Workshops',
              desc: 'Hands-on learning sessions for skill development.',
              icon: CalendarDays,
            },
            {
              title: 'Meetups',
              desc: 'Team gatherings to share ideas and connect.',
              icon: Users,
            },
            {
              title: 'Talks',
              desc: 'Knowledge sharing presentations from experts.',
              icon: Mic,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-card border rounded-xl p-6 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
