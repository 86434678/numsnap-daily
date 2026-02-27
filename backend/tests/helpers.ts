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
 */
export async function signUpTestUser(): Promise<TestUser> {
  const id = crypto.randomUUID();
  const email = `testuser+${id}@example.com`;
  const res = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email,
      password: "TestPassword123!",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to sign up test user (${res.status}): ${body}`);
  }

  const signupData = (await res.json()) as any;

  // Log the signup response structure for debugging
  console.log("Signup response keys:", Object.keys(signupData));
  console.log("Session value:", signupData.session);
  if (signupData.session && typeof signupData.session === "object") {
    console.log("Session keys:", Object.keys(signupData.session));
  }

  // Extract token from signup response
  let sessionToken = "";

  // Try multiple possible formats
  if (signupData.session) {
    if (typeof signupData.session === "string") {
      sessionToken = signupData.session;
    } else if (signupData.session.token) {
      sessionToken = signupData.session.token;
    } else if (signupData.session.sessionToken) {
      sessionToken = signupData.session.sessionToken;
    }
  }

  // Also try direct token field
  if (!sessionToken && signupData.token) {
    sessionToken = signupData.token;
  }

  // If still no token, try logging in
  if (!sessionToken) {
    console.log("No token in signup response, attempting login...");
    const loginRes = await api("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "TestPassword123!",
      }),
    });

    if (loginRes.ok) {
      const loginData = (await loginRes.json()) as any;
      console.log("Login response keys:", Object.keys(loginData));

      if (loginData.session) {
        if (typeof loginData.session === "string") {
          sessionToken = loginData.session;
        } else if (loginData.session.token) {
          sessionToken = loginData.session.token;
        }
      }
      console.log("Token extracted from login:", sessionToken ? "success" : "failed");
    } else {
      console.error("Login failed:", loginRes.status, await loginRes.text());
    }
  }

  if (!sessionToken) {
    throw new Error(`Failed to extract session token. Signup response: ${JSON.stringify(signupData).substring(0, 300)}`);
  }

  const testUser: TestUser = {
    token: sessionToken,
    user: signupData.user,
  };

  // Mark user as verified for testing (bypass email verification requirement)
  try {
    const verifyRes = await api("/api/debug/mark-verified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: signupData.user.id }),
    });

    if (!verifyRes.ok) {
      const verifyError = await verifyRes.text();
      console.error(`Failed to mark user as verified (${verifyRes.status}):`, verifyError);
    } else {
      console.log("User marked as verified for testing");
    }
  } catch (error) {
    console.error("Failed to mark user as verified:", error);
    // Continue anyway - this endpoint might not exist
  }

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
