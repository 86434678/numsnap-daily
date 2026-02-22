import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, createTestFile } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let submissionId: string;
  let photoUrl: string;

  describe("Daily Number", () => {
    test("Get today's target number without reveal", async () => {
      const res = await api("/api/daily-number");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
      expect(data.targetNumber === null || typeof data.targetNumber === "number").toBe(true);
      expect(data.date).toBeDefined();
      expect(data.timeUntilReset).toBeDefined();
      expect(typeof data.timeUntilReset).toBe("number");
      expect(data.revealTimePST).toBeDefined();
      expect(data.currentTimePST).toBeDefined();
    });

    test("Get today's target number with reveal=false", async () => {
      const res = await api("/api/daily-number?reveal=false");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
      expect(data.targetNumber === null || typeof data.targetNumber === "number").toBe(true);
      expect(data.date).toBeDefined();
      expect(data.timeUntilReset).toBeDefined();
    });

    test("Get today's target number with reveal=true", async () => {
      const res = await api("/api/daily-number?reveal=true");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
      expect(data.targetNumber === null || typeof data.targetNumber === "number").toBe(true);
      expect(data.date).toBeDefined();
    });
  });

  describe("Authentication & User Setup", () => {
    test("Sign up test user", async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe("string");
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });

  describe("Photo Upload", () => {
    test("Upload photo successfully", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.jpg", "test photo content"));
      const res = await authenticatedApi("/api/upload-photo", authToken, {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.photoUrl).toBeDefined();
      expect(typeof data.photoUrl).toBe("string");
      photoUrl = data.photoUrl;
    });

    test("Upload photo without auth returns 401", async () => {
      const form = new FormData();
      form.append("file", createTestFile("test.jpg", "test photo content"));
      const res = await api("/api/upload-photo", {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 401);
    });

    test("Upload photo with missing file returns 400", async () => {
      const form = new FormData();
      const res = await authenticatedApi("/api/upload-photo", authToken, {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 400);
    });

    test("Upload oversized photo returns 413", async () => {
      const form = new FormData();
      // Create a file larger than typical limits (10MB+ should trigger 413)
      const largeContent = new Array(11 * 1024 * 1024).fill("x").join("");
      form.append("file", createTestFile("large.jpg", largeContent));
      const res = await authenticatedApi("/api/upload-photo", authToken, {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 400, 413);
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

    test("Process OCR with empty photoUrl returns 400", async () => {
      const res = await authenticatedApi("/api/process-ocr", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: "",
        }),
      });
      await expectStatus(res, 400);
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
      expect(typeof data.submission.id).toBe("string");
      expect(data.submission.confirmedNumber).toBeDefined();
      expect(typeof data.submission.confirmedNumber).toBe("number");
      expect(data.submission.isWinner).toBeDefined();
      expect(typeof data.submission.isWinner).toBe("boolean");
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

    test("Submit entry without required detectedNumber returns 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
          confirmedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Submit entry without required confirmedNumber returns 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
          detectedNumber: 42,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Submit entry without required latitude returns 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
          detectedNumber: 42,
          confirmedNumber: 42,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Submit entry without required longitude returns 400", async () => {
      const res = await authenticatedApi("/api/submit-entry", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: photoUrl,
          detectedNumber: 42,
          confirmedNumber: 42,
          latitude: 40.7128,
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
      expect(data.currentTimePST).toBeDefined();
      expect(Array.isArray(data.submissions)).toBe(true);
      if (data.submissions.length > 0) {
        expect(data.submissions[0].id).toBeDefined();
        expect(data.submissions[0].date).toBeDefined();
        expect(data.submissions[0].photoUrl).toBeDefined();
        expect(data.submissions[0].confirmedNumber).toBeDefined();
        expect(data.submissions[0].isWinner).toBeDefined();
      }
    });

    test("Get submissions without auth returns 401", async () => {
      const res = await api("/api/my-submissions");
      await expectStatus(res, 401);
    });
  });

  describe("Reveal Result", () => {
    test("Get reveal result after submission", async () => {
      const res = await authenticatedApi("/api/reveal-result", authToken);
      await expectStatus(res, 200, 400);
      const data = await res.json();
      if (res.status === 200) {
        expect(data.isMatch).toBeDefined();
        expect(typeof data.isMatch).toBe("boolean");
        expect(data.userNumber).toBeDefined();
        expect(typeof data.userNumber).toBe("number");
        expect(data.targetNumber).toBeDefined();
        expect(data.submissionTime).toBeDefined();
        expect(data.userName).toBeDefined();
      } else {
        expect(data.error).toBeDefined();
      }
    });

    test("Get reveal result without auth returns 401", async () => {
      const res = await api("/api/reveal-result");
      await expectStatus(res, 401);
    });

    test("Get reveal result without submission returns 400", async () => {
      const { token } = await signUpTestUser();
      const res = await authenticatedApi("/api/reveal-result", token);
      await expectStatus(res, 400);
    });
  });

  describe("User Statistics", () => {
    test("Get user stats with valid auth", async () => {
      const res = await authenticatedApi("/api/my-stats", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(typeof data.currentStreak).toBe("number");
      expect(typeof data.longestStreak).toBe("number");
      expect(typeof data.totalSubmissions).toBe("number");
      expect(typeof data.totalWins).toBe("number");
      expect(Array.isArray(data.recentSubmissions)).toBe(true);
      if (data.recentSubmissions.length > 0) {
        expect(data.recentSubmissions[0].date).toBeDefined();
        expect(data.recentSubmissions[0].photoUrl).toBeDefined();
        expect(data.recentSubmissions[0].confirmedNumber).toBeDefined();
        expect(data.recentSubmissions[0].isWinner).toBeDefined();
      }
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
        expect(typeof data[0].userName).toBe("string");
        expect(data[0].date).toBeDefined();
        expect(typeof data[0].date).toBe("string");
        expect(data[0].winningNumber).toBeDefined();
        expect(typeof data[0].winningNumber).toBe("number");
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
      if (data.winners.length > 0) {
        expect(data.winners[0].userId).toBeDefined();
        expect(data.winners[0].userName).toBeDefined();
        expect(data.winners[0].photoUrl).toBeDefined();
        expect(data.winners[0].confirmedNumber).toBeDefined();
      }
    });
  });
});
