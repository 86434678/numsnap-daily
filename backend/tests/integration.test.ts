import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, createTestFile } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let submissionId: string;
  let photoUrl: string;

  describe("Daily Number", () => {
    test("Get today's target number", async () => {
      const res = await api("/api/daily-number");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.targetNumber).toBeDefined();
      expect(data.date).toBeDefined();
      expect(data.timeUntilReset).toBeDefined();
      expect(typeof data.targetNumber).toBe("number");
    });
  });

  describe("Authentication & User Setup", () => {
    test("Sign up test user", async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      expect(authToken).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });

  describe("Photo Upload", () => {
    test("Upload photo successfully", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.txt", "test photo content"));
      const res = await authenticatedApi("/api/upload-photo", authToken, {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.photoUrl).toBeDefined();
      photoUrl = data.photoUrl;
    });

    test("Upload photo without auth returns 401", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.txt", "test photo content"));
      const res = await api("/api/upload-photo", {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 401);
    });
  });

  describe("OCR Processing", () => {
    test("Process OCR with valid photo URL", async () => {
      const res = await authenticatedApi("/api/process-ocr", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.detectedNumber === null || typeof data.detectedNumber === "number").toBe(true);
    });

    test("Process OCR without photoUrl returns 400", async () => {
      const res = await authenticatedApi("/api/process-ocr", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);
    });

    test("Process OCR without auth returns 401", async () => {
      const res = await api("/api/process-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: "http://example.com/photo.jpg" }),
      });
      await expectStatus(res, 401);
    });
  });

  describe("Submissions", () => {
    test("Submit entry with valid data", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
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
      expect(data.submission.confirmedNumber).toBeDefined();
      expect(data.submission.isWinner).toBeDefined();
      submissionId = data.submission.id;
    });

    test("Submit entry without required photoUrl returns 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detectedNumber: 42,
          confirmedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Submit entry without auth returns 401", async () => {
      const res = await api("/api/submit-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: "http://example.com/photo.jpg",
          detectedNumber: 42,
          confirmedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 401);
    });

    test("Get user's submission history", async () => {
      const res = await authenticatedApi("/api/my-submissions", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0].id).toBeDefined();
        expect(data[0].date).toBeDefined();
        expect(data[0].photoUrl).toBeDefined();
        expect(data[0].confirmedNumber).toBeDefined();
        expect(data[0].isWinner).toBeDefined();
      }
    });

    test("Get submissions without auth returns 401", async () => {
      const res = await api("/api/my-submissions");
      await expectStatus(res, 401);
    });
  });

  describe("User Statistics", () => {
    test("Get user stats with valid auth", async () => {
      const res = await authenticatedApi("/api/my-stats", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.currentStreak).toBeDefined();
      expect(data.longestStreak).toBeDefined();
      expect(data.totalSubmissions).toBeDefined();
      expect(data.totalWins).toBeDefined();
      expect(Array.isArray(data.recentSubmissions)).toBe(true);
    });

    test("Get stats without auth returns 401", async () => {
      const res = await api("/api/my-stats");
      await expectStatus(res, 401);
    });
  });

  describe("Winners", () => {
    test("Get recent winners", async () => {
      const res = await api("/api/recent-winners");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0].userName).toBeDefined();
        expect(data[0].date).toBeDefined();
        expect(data[0].winningNumber).toBeDefined();
      }
    });

    test("Check winners (admin)", async () => {
      const res = await api("/api/check-winners");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.winners).toBeDefined();
      expect(Array.isArray(data.winners)).toBe(true);
      expect(data.totalWinners).toBeDefined();
      expect(typeof data.totalWinners).toBe("number");
    });
  });
});
