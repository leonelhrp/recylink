import {
  IEvent,
  ICreateEventDto,
  IFilterEventsDto,
} from '@event-board/shared-types';

const API_BASE_URL = process.env.NX_API_URL || 'http://localhost:3000/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export function buildQueryString(filters: IFilterEventsDto): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const eventsApi = {
  getAll: (filters: IFilterEventsDto = {}) =>
    request<IEvent[]>(`/events${buildQueryString(filters)}`),
  getById: (id: string) => request<IEvent>(`/events/${id}`),
  create: (data: ICreateEventDto) =>
    request<IEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
