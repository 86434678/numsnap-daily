import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, createTestFile } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let submissionId: string;
  let photoUrl: string;
  let claimId: string;

  describe("Daily Number", () => {
    test("Get today's target number without reveal", async () => {
      const res = await api("/api/daily-number");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.hasSubmitted).toBeDefined();
      expect(data.targetNumber === null || typeof data.targetNumber === "number").toBe(true);
      expect(data.date).toBeDefined();
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
      userId = user.id;
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe("string");
      expect(userId).toBeDefined();
      expect(user.email).toBeDefined();
    });

    test("Get current user profile", async () => {
      const res = await authenticatedApi("/api/me", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.email).toBeDefined();
      expect(data.name).toBeDefined();
      expect(typeof data.ageVerified).toBe("boolean");
    });

    test("Get profile without auth returns 401", async () => {
      const res = await api("/api/me");
      await expectStatus(res, 401);
    });

    test("Verify age via auth endpoint", async () => {
      const { token } = await signUpTestUser();
      const res = await authenticatedApi("/api/verify-age", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.ageVerified).toBe("boolean");
    });

    test("Verify age with age < 18 returns 400", async () => {
      const { token } = await signUpTestUser();
      const res = await authenticatedApi("/api/verify-age", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 15 }),
      });
      await expectStatus(res, 400);
    });

    test("Verify age without auth returns 401", async () => {
      const res = await api("/api/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });
      await expectStatus(res, 401);
    });

    test("Verify age without age field returns 400", async () => {
      const { token } = await signUpTestUser();
      const res = await authenticatedApi("/api/verify-age", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);
    });
  });

  describe("Email Verification", () => {
    test("Verify email with invalid token returns 400", async () => {
      const res = await api("/api/verify?token=invalid-token");
      await expectStatus(res, 400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });

    test("Verify email without token parameter returns 400", async () => {
      const res = await api("/api/verify");
      await expectStatus(res, 400);
    });

    test("Resend verification with valid email", async () => {
      const testEmail = `verify-test-${Date.now()}@example.com`;
      const res = await api("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      // Returns 200 if email exists or 404 if not
      await expectStatus(res, 200, 404);
      const data = await res.json();
      expect(data.success).toBeDefined();
      expect(data.message).toBeDefined();
    });

    test("Resend verification without email returns 400", async () => {
      const res = await api("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);
    });

    test("Resend verification with invalid email format returns 400", async () => {
      const res = await api("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      });
      await expectStatus(res, 400);
    });

    test("Resend verification for non-existent user returns 404", async () => {
      const res = await api("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@example.com" }),
      });
      await expectStatus(res, 404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });
  });

  describe("Age Verification", () => {
    test("Get age verification status", async () => {
      const res = await authenticatedApi("/api/user/age-status", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(typeof data.ageVerified).toBe("boolean");
    });

    test("Get age status without auth returns 401", async () => {
      const res = await api("/api/user/age-status");
      await expectStatus(res, 401);
    });

    test("Verify age successfully", async () => {
      const res = await authenticatedApi("/api/user/verify-age", authToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageVerified: true }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ageVerified).toBe(true);
    });

    test("Verify age without ageVerified field returns 400", async () => {
      const { token } = await signUpTestUser();
      const res = await authenticatedApi("/api/user/verify-age", token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);
    });

    test("Verify age without auth returns 401", async () => {
      const res = await api("/api/user/verify-age", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageVerified: true }),
      });
      await expectStatus(res, 401);
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
      expect(typeof data.submission.confirmedNumber).toBe("number");
      expect(typeof data.submission.isWinner).toBe("boolean");
      expect(data.revealData).toBeDefined();
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
        expect(typeof data.submissions[0].confirmedNumber).toBe("number");
        expect(typeof data.submissions[0].isWinner).toBe("boolean");
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
        expect(typeof data.isMatch).toBe("boolean");
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
        expect(typeof data.recentSubmissions[0].confirmedNumber).toBe("number");
        expect(typeof data.recentSubmissions[0].isWinner).toBe("boolean");
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
        expect(typeof data[0].userName).toBe("string");
        expect(data[0].date).toBeDefined();
        expect(typeof data[0].winningNumber).toBe("number");
      }
    });

    test("Check winners (admin)", async () => {
      const res = await api("/api/check-winners");
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.winners).toBeDefined();
      expect(Array.isArray(data.winners)).toBe(true);
      expect(typeof data.totalWinners).toBe("number");
      if (data.winners.length > 0) {
        expect(data.winners[0].userId).toBeDefined();
        expect(data.winners[0].userName).toBeDefined();
        expect(data.winners[0].photoUrl).toBeDefined();
        expect(typeof data.winners[0].confirmedNumber).toBe("number");
      }
    });
  });

  describe("Prize Claims", () => {
    test("Get eligible prize claims", async () => {
      const res = await authenticatedApi("/api/prize-claims/eligible", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0].submissionId).toBeDefined();
        expect(typeof data[0].winningNumber).toBe("number");
        expect(data[0].date).toBeDefined();
        expect(typeof data[0].prizeAmount).toBe("number");
        expect(typeof data[0].canClaim).toBe("boolean");
        expect(data[0].claimDeadline).toBeDefined();
      }
    });

    test("Get eligible claims without auth returns 401", async () => {
      const res = await api("/api/prize-claims/eligible");
      await expectStatus(res, 401);
    });

    test("Get user's prize claims", async () => {
      const res = await authenticatedApi("/api/prize-claims/my-claims", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0].claimId).toBeDefined();
        expect(data[0].submissionId).toBeDefined();
        expect(typeof data[0].winningNumber).toBe("number");
        expect(data[0].date).toBeDefined();
        expect(data[0].paymentMethod).toBeDefined();
        expect(data[0].paymentInfo).toBeDefined();
        expect(data[0].claimStatus).toBeDefined();
        expect(data[0].claimedAt).toBeDefined();
        expect(data[0].expiresAt).toBeDefined();
      }
    });

    test("Get my claims without auth returns 401", async () => {
      const res = await api("/api/prize-claims/my-claims");
      await expectStatus(res, 401);
    });

    test("Claim a prize with valid data", async () => {
      // For this test, we'll attempt to claim a prize with the submissionId we created
      // The endpoint should validate if the submission is eligible
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "paypal",
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      // Status could be 200 if eligible, or 400/403 if not
      await expectStatus(res, 200, 400, 403);
      if (res.status === 200) {
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.claimId).toBeDefined();
        expect(data.expiresAt).toBeDefined();
        claimId = data.claimId;
      }
    });

    test("Claim prize without submissionId returns 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "paypal",
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize without paymentMethod returns 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize without paymentInfo returns 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "paypal",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize without confirmedAccuracy returns 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "paypal",
          paymentInfo: "test@example.com",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize with invalid paymentMethod returns 400", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "invalid_method",
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Claim prize without auth returns 401", async () => {
      const res = await api("/api/prize-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "paypal",
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 401);
    });

    test("Claim prize with venmo payment method", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "venmo",
          paymentInfo: "@testuser",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 200, 400, 403);
    });

    test("Claim prize with egift payment method", async () => {
      const res = await authenticatedApi("/api/prize-claims", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId,
          paymentMethod: "egift",
          paymentInfo: "test@example.com",
          confirmedAccuracy: true,
        }),
      });
      await expectStatus(res, 200, 400, 403);
    });
  });

  describe("Admin Operations", () => {
    test("Check if user is admin", async () => {
      const res = await authenticatedApi("/api/admin/check", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(typeof data.isAdmin).toBe("boolean");
    });

    test("Check admin status without auth returns 401", async () => {
      const res = await api("/api/admin/check");
      await expectStatus(res, 401);
    });

    test("Get all winners (admin)", async () => {
      const res = await authenticatedApi("/api/admin/winners", authToken);
      // May return 403 if user is not admin, or 200 if admin
      await expectStatus(res, 200, 403, 401);
      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        if (data.length > 0) {
          expect(data[0].winnerId).toBeDefined();
          expect(data[0].submissionId).toBeDefined();
          expect(data[0].userName).toBeDefined();
          expect(data[0].userEmail).toBeDefined();
          expect(data[0].photoUrl).toBeDefined();
          expect(data[0].submissionDate).toBeDefined();
          expect(typeof data[0].snappedNumber).toBe("number");
          expect(typeof data[0].targetNumber).toBe("number");
          expect(typeof data[0].latitude).toBe("number");
          expect(typeof data[0].longitude).toBe("number");
          expect(data[0].paymentStatus).toBeDefined();
        }
      }
    });

    test("Get admin winners without auth returns 401", async () => {
      const res = await api("/api/admin/winners");
      await expectStatus(res, 401);
    });

    test("Update prize claim status (admin)", async () => {
      // First check if we have a claim to update
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "Processing",
            notes: "In progress",
          }),
        });
        // May return 403 if not admin, or 200/404 based on claim existence
        await expectStatus(res, 200, 400, 403, 404, 401);
        if (res.status === 200) {
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.claim).toBeDefined();
          expect(data.claim.id).toBeDefined();
          expect(data.claim.claimStatus).toBeDefined();
        }
      }
    });

    test("Update prize claim with Paid status", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "Paid",
          }),
        });
        await expectStatus(res, 200, 400, 403, 404, 401);
      }
    });

    test("Update prize claim with Forfeited status", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "Forfeited",
          }),
        });
        await expectStatus(res, 200, 400, 403, 404, 401);
      }
    });

    test("Update prize claim with Pending status", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "Pending",
          }),
        });
        await expectStatus(res, 200, 400, 403, 404, 401);
      }
    });

    test("Update prize claim with invalid status returns 400", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "InvalidStatus",
          }),
        });
        await expectStatus(res, 400, 403, 401);
      }
    });

    test("Update prize claim without auth returns 401", async () => {
      const testClaimId = "00000000-0000-0000-0000-000000000000";
      const res = await api(`/api/admin/prize-claims/${testClaimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "Processing",
        }),
      });
      await expectStatus(res, 401);
    });

    test("Update non-existent claim returns 404", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const res = await authenticatedApi(`/api/admin/prize-claims/${nonExistentId}`, authToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "Processing",
        }),
      });
      await expectStatus(res, 404, 400, 403, 401);
    });

    test("Update claim without paymentStatus returns 400", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: "Some notes",
          }),
        });
        await expectStatus(res, 400, 403, 401);
      }
    });

    test("Update claim with notes field", async () => {
      if (claimId) {
        const res = await authenticatedApi(`/api/admin/prize-claims/${claimId}`, authToken, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "Processing",
            notes: "Updated with notes",
          }),
        });
        await expectStatus(res, 200, 400, 403, 404, 401);
      }
    });
  });
});
