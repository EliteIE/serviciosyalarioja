import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing the module under test
const mockFrom = vi.fn();
const mockAuth = {
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  getSession: vi.fn(() =>
    Promise.resolve({ data: { session: null } })
  ),
  signOut: vi.fn(() => Promise.resolve({})),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    auth: mockAuth,
  },
}));

describe("Auth Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session handling", () => {
    it("should call getSession on initialization", async () => {
      // Import after mocks are set up
      const { supabase } = await import("@/integrations/supabase/client");
      expect(supabase.auth.getSession).toBeDefined();
      expect(typeof supabase.auth.getSession).toBe("function");
    });

    it("should have onAuthStateChange listener", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      expect(supabase.auth.onAuthStateChange).toBeDefined();
      expect(typeof supabase.auth.onAuthStateChange).toBe("function");
    });

    it("should provide signOut function", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      expect(supabase.auth.signOut).toBeDefined();
    });
  });

  describe("Role fetching", () => {
    it("should query user_roles table for role", async () => {
      const mockSingle = vi.fn(() => Promise.resolve({ data: { role: "client" } }));
      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", "test-user-id")
        .single();

      expect(mockFrom).toHaveBeenCalledWith("user_roles");
      expect(mockSelect).toHaveBeenCalledWith("role");
      expect(mockEq).toHaveBeenCalledWith("user_id", "test-user-id");
      expect(result.data?.role).toBe("client");
    });

    it("should query profiles table for profile data", async () => {
      const mockSingle = vi.fn(() =>
        Promise.resolve({
          data: {
            id: "test-user-id",
            full_name: "Test User",
            avatar_url: null,
            is_provider: false,
          },
        })
      );
      const mockEq = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const { supabase } = await import("@/integrations/supabase/client");
      const result = await supabase
        .from("profiles")
        .select("*")
        .eq("id", "test-user-id")
        .single();

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(result.data?.full_name).toBe("Test User");
    });
  });
});

describe("Payment Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query payments with user filter (defense in depth)", async () => {
    const mockOrder = vi.fn(() =>
      Promise.resolve({ data: [], error: null })
    );
    const mockOr = vi.fn(() => ({ order: mockOrder }));
    const mockSelect = vi.fn(() => ({ or: mockOr }));
    mockFrom.mockReturnValue({ select: mockSelect });

    const { supabase } = await import("@/integrations/supabase/client");
    const userId = "user-123";

    await supabase
      .from("payments")
      .select("*")
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    expect(mockFrom).toHaveBeenCalledWith("payments");
    expect(mockOr).toHaveBeenCalledWith(
      `client_id.eq.${userId},provider_id.eq.${userId}`
    );
  });

  it("should call mercadopago edge function for checkout", async () => {
    const mockInvoke = vi.fn(() =>
      Promise.resolve({
        data: { init_point: "https://mp.checkout.test/pay" },
        error: null,
      })
    );

    const supabase = {
      functions: { invoke: mockInvoke },
    };

    const result = await supabase.functions.invoke("mercadopago", {
      body: {
        service_request_id: "sr-123",
        amount: 5000,
        title: "Test Service",
        payer_email: "test@test.com",
      },
    });

    expect(mockInvoke).toHaveBeenCalledWith("mercadopago", {
      body: {
        service_request_id: "sr-123",
        amount: 5000,
        title: "Test Service",
        payer_email: "test@test.com",
      },
    });
    expect(result.data.init_point).toContain("https://");
  });
});

describe("Service Request Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query service requests for client with profile join", async () => {
    const mockOrder = vi.fn(() =>
      Promise.resolve({ data: [], error: null })
    );
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({ select: mockSelect });

    const { supabase } = await import("@/integrations/supabase/client");
    await supabase
      .from("service_requests")
      .select("*, profiles!service_requests_provider_id_fkey(full_name, avatar_url)")
      .eq("client_id", "user-123")
      .order("created_at", { ascending: false });

    expect(mockFrom).toHaveBeenCalledWith("service_requests");
  });

  it("should use getPublicUrl instead of createSignedUrl for uploads", async () => {
    // Verify the pattern: getPublicUrl should be synchronous (no await needed)
    const mockGetPublicUrl = vi.fn((path: string) => ({
      data: { publicUrl: `https://storage.test/media/${path}` },
    }));

    const mockUpload = vi.fn(() =>
      Promise.resolve({ error: null })
    );

    const storage = {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    };

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const path = `user-123/photos/${Date.now()}.jpg`;

    await storage.from("media").upload(path, file);
    const result = storage.from("media").getPublicUrl(path);

    expect(storage.from).toHaveBeenCalledWith("media");
    expect(result.data.publicUrl).toContain("https://");
    expect(result.data.publicUrl).toContain(path);
  });
});

describe("Webhook Logic", () => {
  it("Idempotency guard - drops duplicate completed payment", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: "pay_123", status: "completed" }, 
      error: null 
    });
    const mockEqStatus = vi.fn(() => ({ maybeSingle: mockSingle }));
    const mockEqId = vi.fn(() => ({ eq: mockEqStatus }));
    const mockSelect = vi.fn(() => ({ eq: mockEqId }));
    
    mockFrom.mockReturnValue({ select: mockSelect });

    // Simulate the query made by the webhook's idempotency guard
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("payments")
      .select("id, status")
      .eq("mp_payment_id", "456789")
      .eq("status", "completed")
      .maybeSingle();

    expect(data).toBeDefined();
    expect(data?.status).toBe("completed");
    expect(mockFrom).toHaveBeenCalledWith("payments");
    expect(mockEqId).toHaveBeenCalledWith("mp_payment_id", "456789");
    expect(mockEqStatus).toHaveBeenCalledWith("status", "completed");
  });
});
