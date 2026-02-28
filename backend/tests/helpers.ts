import { afterAll } from "bun:test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

/**
 * Strip Content-Type: application/json when there's no body.
 */
function sanitizeOptions(options?: RequestInit): RequestInit | undefined {
  if (!options?.headers || options.body) return options;
  const headers = new Headers(options.headers);
  if (headers.get("content-type")?.includes("application/json")) {
    headers.delete("content-type");
  }
  const entries = [...headers.entries()];
  return {
    ...options,
    headers: entries.length > 0 ? Object.fromEntries(entries) : undefined,
  };
}

/**
 * Make a request to the API under test.
 */
export async function api(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, sanitizeOptions(options));
}

/**
 * Make an authenticated request to the API under test.
 */
export async function authenticatedApi(
  path: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
  const sanitized = sanitizeOptions(options);
  return fetch(`${BASE_URL}${path}`, {
    ...sanitized,
    headers: {
      ...sanitized?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface TestUser {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Sign up a test user and return the token and user object.
 * This handles the full auth flow: signup -> verify email -> login
 */
export async function signUpTestUser(): Promise<TestUser> {
  const id = crypto.randomUUID();
  const email = `testuser+${id}@example.com`;
  const password = "TestPassword123!";

  // Step 1: Sign up
  const signupRes = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email,
      password,
    }),
  });

  if (!signupRes.ok) {
    const body = await signupRes.text();
    throw new Error(`Failed to sign up test user (${signupRes.status}): ${body}`);
  }

  const signupData = (await signupRes.json()) as any;
  const userId = signupData.user?.id || signupData.id;

  if (!userId) {
    throw new Error(`Failed to extract user ID from signup response: ${JSON.stringify(signupData)}`);
  }

  // Step 2: Auto-verify email (in test environment, we bypass verification)
  // Try to mark the user as verified via the debug endpoint if it exists
  try {
    await api("/api/debug/mark-verified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.warn("Could not auto-verify email (debug endpoint may not exist):", error);
  }

  // Step 3: Login to get a valid session token
  const loginRes = await api("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!loginRes.ok) {
    const body = await loginRes.text();
    throw new Error(`Failed to login test user (${loginRes.status}): ${body}`);
  }

  const loginData = (await loginRes.json()) as any;

  // Extract token from login response
  let token = loginData.session?.token || loginData.token;
  if (!token) {
    throw new Error(`Failed to extract token from login response: ${JSON.stringify(loginData)}`);
  }

  const testUser: TestUser = {
    token,
    user: {
      id: userId,
      name: signupData.user?.name || "Test User",
      email: signupData.user?.email || email,
      emailVerified: signupData.user?.emailVerified !== false,
      image: signupData.user?.image || null,
      createdAt: signupData.user?.createdAt || new Date().toISOString(),
      updatedAt: signupData.user?.updatedAt || new Date().toISOString(),
    },
  };

  // Auto-register cleanup so the test file doesn't need to
  afterAll(async () => {
    await deleteTestUser(testUser.token);
  });

  return testUser;
}

/**
 * Assert response status and include response body in error on mismatch.
 * Use instead of expect(res.status).toBe(x) for better error messages.
 */
export async function expectStatus(res: Response, ...expected: number[]): Promise<void> {
  if (!expected.includes(res.status)) {
    let body = await res.clone().text().catch(() => "(unable to read body)");
    if (body.length > 500) body = body.slice(0, 500) + "...";
    const path = new URL(res.url).pathname + new URL(res.url).search;
    console.error(`${path} — Expected ${expected.join("|")}, got ${res.status} — ${body}`);
    throw ``;
  }
}

/**
 * Delete the test user (cleanup).
 */
export async function deleteTestUser(token: string): Promise<void> {
  await authenticatedApi("/api/auth/delete-user", token, {
    method: "POST",
  });
}

/**
 * Create a dummy file for multipart upload testing.
 * Returns a File object that can be appended to FormData.
 */
export function createTestFile(filename = "test.txt", content = "test file content", type = "text/plain"): File {
  return new File([content], filename, { type });
}

const WS_URL = BASE_URL.replace(/^http/, "ws");

/**
 * Connect to a WebSocket endpoint. Resolves when the connection is open.
 */
export async function connectWebSocket(path: string): Promise<WebSocket> {
  const url = new URL(path, WS_URL);
  const ws = new WebSocket(url.toString());
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error(`WebSocket connection failed: ${url}`));
    setTimeout(() => { ws.close(); reject(new Error("WebSocket connection timeout")); }, 5000);
  });
}

/**
 * Connect to an authenticated WebSocket endpoint.
 * Sends the token as the first message and waits for the authentication response.
 */
export async function connectAuthenticatedWebSocket(path: string, token: string): Promise<WebSocket> {
  const ws = await connectWebSocket(path);
  ws.send(token);
  const response = await waitForMessage(ws);
  const data = JSON.parse(response);
  if (data.error) {
    ws.close();
    throw new Error(`WebSocket auth failed: ${data.error}`);
  }
  return ws;
}

/**
 * Wait for the next message on a WebSocket.
 */
export function waitForMessage(ws: WebSocket, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    ws.onmessage = (event) => resolve(String(event.data));
    setTimeout(() => reject(new Error("WebSocket message timeout")), timeout);
  });
}
