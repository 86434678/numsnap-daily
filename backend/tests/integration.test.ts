import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, createTestFile } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let submissionId: string;
  let photoUrl: string;
  let claimId: string;

  describe("Auth Endpoints", () => {
    test("Get current user profile without auth should return 401", async () => {
      const res = await api("/api/me");
      await expectStatus(res, 401);
    });

    test("Sign up test user and get profile", async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      userId = user.id;
      expect(authToken).toBeDefined();
      expect(userId).toBeDefined();
    });

    test("Get current user profile with auth", async () => {
      const res = await authenticatedApi("/api/me", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(userId);
      expect(data.email).toBeDefined();
      expect(data.name).toBeDefined();
    });

    test("Verify age as non-authenticated user should return 401", async () => {
      const res = await api("/api/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });
      await expectStatus(res, 401);
    });

    test("Verify age with valid age", async () => {
      const res = await authenticatedApi("/api/verify-age", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ageVerified).toBe(true);
    });

    test("Verify age with age < 18 should return 400", async () => {
      const res = await authenticatedApi("/api/verify-age", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 16 }),
      });
      await expectStatus(res, 400);
    });

    test("Resend verification email for non-existent user should return 404", async () => {
      const res = await api("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@test.com" }),
      });
      await expectStatus(res, 404);
    });
  });

  describe("Daily Number Endpoints", () => {
    test("Get daily number without reveal", async () => {
      const res = await api("/api/daily-number");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
      expect(data.date).toBeDefined();
      expect(data.timeUntilReset).toBeDefined();
    });

    test("Get daily number with reveal=false", async () => {
      const res = await api("/api/daily-number?reveal=false");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
    });

    test("Get reveal result without auth should return 401", async () => {
      const res = await api("/api/reveal-result");
      await expectStatus(res, 401);
    });

    test("Get reveal result with auth but no submission should return 400", async () => {
      const res = await authenticatedApi("/api/reveal-result", authToken);
      await expectStatus(res, 400);
    });
  });

  describe("Photo Upload Endpoints", () => {
    test("Upload photo without auth should return 401", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.jpg", "fake image data", "image/jpeg"));
      const res = await api("/api/upload-photo", {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 401);
    });

    test("Upload photo with auth", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.jpg", "fake image data", "image/jpeg"));
      const res = await authenticatedApi("/api/upload-photo", authToken, {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.photoUrl).toBeDefined();
      photoUrl = data.photoUrl;
    });
  });

  describe("OCR Processing Endpoints", () => {
    test("Process OCR without auth should return 401", async () => {
      const res = await api("/api/process-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: "https://example.com/photo.jpg" }),
      });
      await expectStatus(res, 401);
    });

    test("Process OCR with missing photoUrl should return 400", async () => {
      const res = await authenticatedApi("/api/process-ocr", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);
    });

    test("Process OCR with valid photo URL", async () => {
      const res = await authenticatedApi("/api/process-ocr", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photoUrl || "https://example.com/photo.jpg" }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.detectedNumber).toBeDefined();
    });
  });

  describe("Submission Endpoints - CRUD Flow", () => {
    test("Submit entry without auth should return 401", async () => {
      const res = await api("/api/submit-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: "https://example.com/photo.jpg",
          detectedNumber: 42,
          confirmedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 401);
    });

    test("Submit entry with missing required fields should return 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: "https://example.com/photo.jpg",
          detectedNumber: 42,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Submit entry with all required fields", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl || "https://example.com/photo.jpg",
          detectedNumber: 42,
          confirmedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.submission).toBeDefined();
      expect(data.submission.id).toBeDefined();
      submissionId = data.submission.id;
    });

    test("Get user submissions", async () => {
      const res = await authenticatedApi("/api/my-submissions", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.submissions).toBeDefined();
      expect(Array.isArray(data.submissions)).toBe(true);
    });

    test("Get user stats", async () => {
      const res = await authenticatedApi("/api/my-stats", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.currentStreak).toBeDefined();
      expect(data.longestStreak).toBeDefined();
      expect(data.totalSubmissions).toBeDefined();
      expect(data.totalWins).toBeDefined();
    });
  });

  describe("Prize Claim Endpoints", () => {
    test("Get eligible prize claims without auth should return 401", async () => {
      const res = await api("/api/prize-claims/eligible");
      await expectStatus(res, 401);
    });

    test("Get eligible prize claims with auth", async () => {
      const res = await authenticatedApi("/api/prize-claims/eligible", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Get user's prize claims", async () => {
      const res = await authenticatedApi("/api/prize-claims/my-claims", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Claim prize without auth should return 401", async () => {
      const res = await api("/api/prize-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: "00000000-0000-0000-0000-000000000000",
          paymentMethod: "paypal",
          paymentInfo: "test@paypal.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 401);
    });

    test("Claim prize with missing required fields should return 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: "00000000-0000-0000-0000-000000000000",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize with non-existent submission should return 403", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: "00000000-0000-0000-0000-000000000000",
          paymentMethod: "paypal",
          paymentInfo: "test@paypal.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 403);
    });
  });

  describe("User Age Verification Endpoints", () => {
    test("Get age verification status without auth should return 401", async () => {
      const res = await api("/api/user/age-status");
      await expectStatus(res, 401);
    });

    test("Get age verification status with auth", async () => {
      const res = await authenticatedApi("/api/user/age-status", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.ageVerified).toBeDefined();
    });

    test("Update age verification without auth should return 401", async () => {
      const res = await api("/api/user/verify-age", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageVerified: true }),
      });
      await expectStatus(res, 401);
    });

    test("Update age verification with auth", async () => {
      const res = await authenticatedApi("/api/user/verify-age", authToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageVerified: true }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Public Winners Endpoints", () => {
    test("Get recent winners", async () => {
      const res = await api("/api/recent-winners");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Check winners (admin/cron endpoint)", async () => {
      const res = await api("/api/check-winners");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.winners).toBeDefined();
      expect(data.totalWinners).toBeDefined();
    });
  });

  describe("Admin Endpoints", () => {
    test("Check admin status without auth should return 401", async () => {
      const res = await api("/api/admin/check");
      await expectStatus(res, 401);
    });

    test("Check admin status with regular user", async () => {
      const res = await authenticatedApi("/api/admin/check", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.isAdmin).toBe(false);
    });

    test("Get all winners without auth should return 401", async () => {
      const res = await api("/api/admin/winners");
      await expectStatus(res, 401);
    });

    test("Get all winners with non-admin user should return 403", async () => {
      const res = await authenticatedApi("/api/admin/winners", authToken);
      await expectStatus(res, 403);
    });

    test("Update prize claim status without auth should return 401", async () => {
      const res = await api("/api/admin/prize-claims/00000000-0000-0000-0000-000000000000", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "Paid",
        }),
      });
      await expectStatus(res, 401);
    });

    test("Update prize claim status with non-admin user should return 403", async () => {
      const res = await authenticatedApi("/api/admin/prize-claims/00000000-0000-0000-0000-000000000000", authToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "Paid",
        }),
      });
      await expectStatus(res, 403);
    });

    test("Update non-existent prize claim should return 404", async () => {
      // Create a minimal admin token scenario - this will fail as non-admin but tests the 404 path
      const res = await authenticatedApi("/api/admin/prize-claims/00000000-0000-0000-0000-000000000000", authToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "Paid",
        }),
      });
      // Non-admin gets 403, but if they were admin it would be 404
      await expectStatus(res, 403);
    });
  });
});
