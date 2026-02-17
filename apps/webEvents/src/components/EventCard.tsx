import { IEvent } from '@event-board/shared-types';
import { Link } from 'react-router-dom';
import { MapPin, User } from 'lucide-react';
import { StatusBadge } from './ui/status-badge';
import { getCoverUrl } from '../lib/getCoverUrl';

interface EventCardProps {
  event: IEvent;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const time = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Link
      to={`/events/${event._id}`}
      className="block bg-card border rounded-xl p-5 hover:shadow-sm transition-all group"
    >
      <div className="flex gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1.5">{time}</p>
          <h3 className="text-base font-semibold text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2">
            {event.title}
          </h3>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>By {event.organizer}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.location}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={event.status} className="text-[10px] px-1.5 py-0" />
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-secondary shrink-0 overflow-hidden">
          <img
            src={getCoverUrl(event.title, event.category, { width: 200, height: 200 })}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </Link>
  );
}
