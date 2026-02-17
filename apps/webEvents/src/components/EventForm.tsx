import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { EventCategory, EventStatus } from '@event-board/shared-types';
import { useCreateEvent } from '../hooks/useEvents';
import { getCoverUrl } from '../lib/getCoverUrl';
import { Image } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { DatePicker } from './ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  date: z.date({ message: 'Date is required' }),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  category: z.enum(
    Object.values(EventCategory) as [EventCategory, ...EventCategory[]],
    { message: 'Please select a category' },
  ),
  organizer: z.string().min(1, 'Organizer is required'),
  status: z.enum(
    Object.values(EventStatus) as [EventStatus, ...EventStatus[]],
  ).optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventForm() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: EventStatus.DRAFT,
      time: '19:00',
      title: '',
      description: '',
      location: '',
      organizer: '',
    },
  });

  const watchTitle = watch('title');
  const watchCategory = watch('category');
  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    const t = watchTitle || 'event';
    const c = watchCategory || 'general';
    setCoverUrl(getCoverUrl(t, c));
  }, [watchTitle, watchCategory]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateValue = new Date(data.date);
      dateValue.setHours(hours, minutes, 0, 0);

      await createEvent.mutateAsync({
        title: data.title,
        description: data.description,
        date: dateValue.toISOString(),
        location: data.location,
        category: data.category as EventCategory,
        organizer: data.organizer,
        status: data.status as EventStatus | undefined,
      });
      navigate('/events');
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          {/* Left: Cover preview */}
          <div>
            <div className="aspect-square rounded-xl bg-secondary overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Event cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Auto-generated preview
            </p>
          </div>

          {/* Right: Form — Variant C minimal flat */}
          <div>
            {createEvent.error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg mb-4">
                {createEvent.error instanceof Error
                  ? createEvent.error.message
                  : 'Failed to create event'}
              </div>
            )}

            {/* Title */}
            <div className="mb-8">
              <input
                {...register('title')}
                className="w-full text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 bg-transparent outline-none"
                placeholder="Event Name"
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Date</Label>
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Pick a date"
                      />
                    )}
                  />
                  {errors.date && (
                    <p className="text-xs text-destructive mt-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Time</Label>
                  <Input type="time" {...register('time')} />
                  {errors.time && (
                    <p className="text-xs text-destructive mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Location</Label>
                <Input {...register('location')} placeholder="Offline location or virtual link" />
                {errors.location && (
                  <p className="text-xs text-destructive mt-1">{errors.location.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Description</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Who should come? What's the event about?"
                  className="min-h-[100px]"
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Category</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EventCategory).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Draft" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EventStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Organizer */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Organizer</Label>
                <Input {...register('organizer')} placeholder="Organizer name" />
                {errors.organizer && (
                  <p className="text-xs text-destructive mt-1">{errors.organizer.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || createEvent.isPending}
              className="w-full mt-8"
              size="lg"
            >
              {isSubmitting || createEvent.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
