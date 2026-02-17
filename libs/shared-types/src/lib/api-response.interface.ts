export interface IApiResponse<T> {
  data: T;
  message?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
