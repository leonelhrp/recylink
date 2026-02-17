import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  EventCategory,
  EventStatus,
  IEvent,
  IFilterEventsDto,
} from '@event-board/shared-types';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';
import { cn } from '../lib/utils';

type Tab = 'upcoming' | 'past';

function groupEventsByDate(events: IEvent[]): Map<string, IEvent[]> {
  const groups = new Map<string, IEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  for (const event of sorted) {
    const dateKey = new Date(event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const group = groups.get(dateKey) || [];
    group.push(event);
    groups.set(dateKey, group);
  }
  return groups;
}

function formatDateLabel(dateStr: string): { day: string; weekday: string } {
  const date = new Date(dateStr);
  return {
    day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

export function EventList() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [search, setSearch] = useState('');

  const filters: IFilterEventsDto = useMemo(
    () => ({
      ...(category && { category }),
      ...(status && { status }),
      ...(search && { search }),
    }),
    [category, status, search],
  );

  const { data: events, isLoading, error } = useEvents(filters);
  const isAuthenticated = !!localStorage.getItem('access_token');

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return tab === 'upcoming' ? eventDate >= now : eventDate < now;
    });
  }, [events, tab]);

  const grouped = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  if (error) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-12">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {(['upcoming', 'past'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                tab === t
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <EventFilters
          category={category}
          status={status}
          search={search}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
        />
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-8 animate-pulse">
              <div className="w-20 shrink-0">
                <div className="h-4 bg-muted rounded w-14 mb-1" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
              <div className="flex-1">
                <div className="bg-card border rounded-xl p-5">
                  <div className="h-3 bg-muted rounded w-16 mb-3" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateKey, dateEvents]) => {
            const { day, weekday } = formatDateLabel(dateEvents[0].date);
            return (
              <div key={dateKey} className="flex gap-8">
                {/* Date column */}
                <div className="w-20 shrink-0 pt-5">
                  <p className="text-sm font-medium text-foreground">{day}</p>
                  <p className="text-xs text-muted-foreground">{weekday}</p>
                </div>

                {/* Timeline dot + line */}
                <div className="flex flex-col items-center shrink-0 pt-6">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1 w-px bg-border mt-2" />
                </div>

                {/* Events */}
                <div className="flex-1 space-y-3 pb-2">
                  {dateEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            {search || category || status
              ? 'No events match your filters.'
              : tab === 'upcoming'
                ? 'No upcoming events.'
                : 'No past events.'}
          </p>
          {isAuthenticated && (
            <Link
              to="/events/new"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-foreground hover:underline"
            >
              Create your first event
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
