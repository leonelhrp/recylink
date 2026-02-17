import { EventCategory, EventStatus } from '@event-board/shared-types';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EventFiltersProps {
  category: EventCategory | '';
  status: EventStatus | '';
  search: string;
  onCategoryChange: (category: EventCategory | '') => void;
  onStatusChange: (status: EventStatus | '') => void;
  onSearchChange: (search: string) => void;
}

export function EventFilters({
  category,
  status,
  search,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
}: EventFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={category || 'all'}
        onValueChange={(val) => onCategoryChange(val === 'all' ? '' : (val as EventCategory))}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Object.values(EventCategory).map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status || 'all'}
        onValueChange={(val) => onStatusChange(val === 'all' ? '' : (val as EventStatus))}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.values(EventStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
