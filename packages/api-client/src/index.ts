import type {
  ApiErrorBody,
  Budget,
  CreateBudget,
  CreateDebt,
  CreateLead,
  CreateUser,
  Debt,
  HealthResponse,
  Lead,
  User,
} from "@motter/shared";

export type ApiClientOptions = {
  /** Base URL of the API, e.g. http://localhost:4000 */
  baseUrl: string;
  /** Optional bearer token for authenticated calls */
  getAccessToken?: () => string | null | Promise<string | null>;
  fetchImpl?: typeof fetch;
};

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly body: ApiErrorBody | null;

  constructor(message: string, statusCode: number, body: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Typed fetch client for the Motter Budget API.
 * Intended for the website (apps/web) and a future mobile app (apps/mobile).
 */
export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const base = options.baseUrl.replace(/\/$/, "");

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    const token = options.getAccessToken
      ? await options.getAccessToken()
      : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetchImpl(`${base}${path}`, { ...init, headers });
    const json = await parseJsonSafe(res);

    if (!res.ok) {
      const errBody =
        json && typeof json === "object" && "error" in (json as object)
          ? (json as ApiErrorBody)
          : null;
      throw new ApiClientError(
        errBody?.message ?? `Request failed: ${res.status} ${res.statusText}`,
        res.status,
        errBody
      );
    }

    return json as T;
  }

  return {
    health: () => request<HealthResponse>("/v1/health"),

    // Auth stubs — real auth not implemented yet
    signup: (body: CreateUser) =>
      request<{ data: User }>("/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ data: { accessToken: string; user: User } }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    // Budgets
    listBudgets: () => request<{ data: Budget[] }>("/v1/budgets"),
    createBudget: (body: CreateBudget) =>
      request<{ data: Budget }>("/v1/budgets", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    // Debts
    listDebts: () => request<{ data: Debt[] }>("/v1/debts"),
    createDebt: (body: CreateDebt) =>
      request<{ data: Debt }>("/v1/debts", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    // Leads
    createLead: (body: CreateLead) =>
      request<{ data: Lead }>("/v1/leads", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
