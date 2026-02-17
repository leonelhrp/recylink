import { useParams, Link } from 'react-router-dom';
import { EventCategory } from '@event-board/shared-types';
import { useEvent } from '../hooks/useEvents';
import { ArrowLeft, MapPin, User } from 'lucide-react';
import { StatusBadge } from './ui/status-badge';
import { Separator } from './ui/separator';
import { getCoverUrl } from '../lib/getCoverUrl';

const categoryColors: Record<EventCategory, string> = {
  [EventCategory.WORKSHOP]: 'bg-blue-50 text-blue-700',
  [EventCategory.MEETUP]: 'bg-green-50 text-green-700',
  [EventCategory.TALK]: 'bg-purple-50 text-purple-700',
  [EventCategory.SOCIAL]: 'bg-orange-50 text-orange-700',
};

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id || '');

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="h-48 bg-muted rounded-xl mb-6" />
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
          <div className="bg-card border rounded-xl p-6">
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error instanceof Error ? error.message : 'Event not found'}
        </div>
        <Link to="/events" className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = eventDate.getDate();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back nav */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
        {/* Left column */}
        <div>
          {/* Cover image */}
          <div className="aspect-video rounded-xl bg-secondary overflow-hidden mb-6">
            <img
              src={getCoverUrl(event.title, event.category, { width: 800, height: 400 })}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl font-bold text-foreground leading-tight">
            {event.title}
          </h1>

          {/* Organizer */}
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hosted By</p>
              <p className="text-sm font-medium text-foreground">{event.organizer}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            <StatusBadge status={event.status} className="text-[10px]" />
          </div>

          {/* Description */}
          <Separator className="my-6" />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">About Event</h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right column: Info card */}
        <div>
          <div className="bg-card border rounded-xl p-6 sticky top-20">
            {/* Date */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-14 bg-secondary border rounded-lg flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground leading-none">{monthShort}</span>
                <span className="text-lg font-bold text-foreground leading-none mt-0.5">{dayNum}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-14 bg-secondary border rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{event.location}</p>
              </div>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{event.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Organizer</span>
                <span className="font-medium text-foreground">{event.organizer}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
