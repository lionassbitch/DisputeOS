import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createAuthContext(role: "user" | "admin" = "user"): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-123");
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("dashboard.stats", () => {
  it("requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.stats()).rejects.toThrow();
  });
});

describe("candidates.approve", () => {
  it("requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.candidates.approve({ id: 1 })).rejects.toThrow();
  });
});

describe("candidates.reject", () => {
  it("requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.candidates.reject({ id: 1 })).rejects.toThrow();
  });
});

describe("letters.generate", () => {
  it("requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.letters.generate({ candidateId: 1 })).rejects.toThrow();
  });
});

describe("admin.stats", () => {
  it("requires admin role", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("does not throw for admin users", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    // This will fail due to no DB, but shouldn't throw FORBIDDEN
    try {
      await caller.admin.stats();
    } catch (e: any) {
      // Should not be a FORBIDDEN error
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("admin.users", () => {
  it("requires admin role", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users()).rejects.toThrow();
  });
});

describe("mail.send", () => {
  it("requires authentication", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.mail.send({
        letterId: 1,
        recipientName: "Test",
        recipientAddress: "123 Main St",
      })
    ).rejects.toThrow();
  });
});
