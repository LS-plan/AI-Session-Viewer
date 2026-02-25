import type {
  ProjectEntry,
  SessionIndexEntry,
  PaginatedMessages,
  SearchResult,
  TokenUsageSummary,
} from "../types";

function getToken(): string | null {
  return localStorage.getItem("asv_token");
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(url.toString(), { headers });

  if (resp.status === 401) {
    // Trigger auth prompt
    window.dispatchEvent(new CustomEvent("asv-auth-required"));
    throw new Error("Authentication required");
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }

  return resp.json();
}

async function apiDelete<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(url.toString(), { method: "DELETE", headers });

  if (resp.status === 401) {
    window.dispatchEvent(new CustomEvent("asv-auth-required"));
    throw new Error("Authentication required");
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }

  return resp.json();
}

export async function getProjects(source: string): Promise<ProjectEntry[]> {
  return apiFetch("/api/projects", { source });
}

export async function getSessions(
  source: string,
  projectId: string
): Promise<SessionIndexEntry[]> {
  return apiFetch("/api/sessions", { source, projectId });
}

export async function getMessages(
  source: string,
  filePath: string,
  page: number = 0,
  pageSize: number = 50,
  fromEnd: boolean = false
): Promise<PaginatedMessages> {
  return apiFetch("/api/messages", {
    source,
    filePath,
    page: String(page),
    pageSize: String(pageSize),
    fromEnd: String(fromEnd),
  });
}

export async function globalSearch(
  source: string,
  query: string,
  maxResults: number = 50
): Promise<SearchResult[]> {
  return apiFetch("/api/search", { source, query, maxResults: String(maxResults) });
}

export async function getStats(source: string): Promise<TokenUsageSummary> {
  return apiFetch("/api/stats", { source });
}

export async function deleteSession(
  filePath: string,
  source?: string,
  projectId?: string,
  sessionId?: string
): Promise<void> {
  const params: Record<string, string> = { filePath };
  if (source) params.source = source;
  if (projectId) params.projectId = projectId;
  if (sessionId) params.sessionId = sessionId;
  await apiDelete("/api/sessions", params);
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(new URL(path, window.location.origin).toString(), {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (resp.status === 401) {
    window.dispatchEvent(new CustomEvent("asv-auth-required"));
    throw new Error("Authentication required");
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }

  return resp.json();
}

export async function updateSessionMeta(
  source: string,
  projectId: string,
  sessionId: string,
  alias: string | null,
  tags: string[]
): Promise<void> {
  await apiPut("/api/sessions/meta", { source, projectId, sessionId, alias, tags });
}

export async function getAllTags(
  source: string,
  projectId: string
): Promise<string[]> {
  return apiFetch("/api/tags", { source, projectId });
}

export async function getCrossProjectTags(
  source: string
): Promise<Record<string, string[]>> {
  return apiFetch("/api/cross-tags", { source });
}

// Web mode: resume not available, use clipboard instead
export async function resumeSession(
  _source: string,
  _sessionId: string,
  _projectPath: string,
  _filePath?: string
): Promise<void> {
  // No-op in web mode; handled by UI directly
}

export async function getInstallType(): Promise<"installed" | "portable"> {
  return "installed"; // Not applicable in web mode
}
