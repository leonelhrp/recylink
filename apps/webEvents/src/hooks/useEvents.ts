import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ICreateEventDto,
  IFilterEventsDto,
} from '@event-board/shared-types';
import { eventsApi } from '../services/events-api';

export function useEvents(filters: IFilterEventsDto = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getAll(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateEventDto) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
