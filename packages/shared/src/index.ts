export * from "./schemas/index.js";

/** Shared API envelope helpers */
export type ApiErrorBody = {
  error: string;
  message: string;
  statusCode: number;
};

export type ApiSuccess<T> = {
  data: T;
};

export type HealthResponse = {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
};
