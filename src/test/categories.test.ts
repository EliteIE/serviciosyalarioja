import { describe, it, expect, vi, beforeEach } from "vitest";
import { CATEGORIES, STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS } from "@/constants/categories";

describe("Categories Constants", () => {
  it("should have at least 5 categories defined", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it("each category should have required fields", () => {
    CATEGORIES.forEach((cat) => {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
      expect(cat).toHaveProperty("icon");
      expect(cat).toHaveProperty("description");
      expect(typeof cat.id).toBe("string");
      expect(typeof cat.name).toBe("string");
      expect(typeof cat.slug).toBe("string");
      expect(cat.slug).not.toContain(" ");
    });
  });

  it("category slugs should be unique", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("category IDs should be unique", () => {
    const ids = CATEGORIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("Status Labels", () => {
  const expectedStatuses = [
    "nuevo",
    "presupuestado",
    "aceptado",
    "en_progreso",
    "finalizado_prestador",
    "completado",
    "cancelado",
  ];

  it("should have labels for all expected statuses", () => {
    expectedStatuses.forEach((status) => {
      expect(STATUS_LABELS).toHaveProperty(status);
      expect(typeof STATUS_LABELS[status]).toBe("string");
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    });
  });

  it("should have colors for all expected statuses", () => {
    expectedStatuses.forEach((status) => {
      expect(STATUS_COLORS).toHaveProperty(status);
      expect(typeof STATUS_COLORS[status]).toBe("string");
    });
  });

  it("status labels should be in Spanish", () => {
    expect(STATUS_LABELS.nuevo).toMatch(/nuev/i);
    expect(STATUS_LABELS.completado).toMatch(/complet/i);
    expect(STATUS_LABELS.cancelado).toMatch(/cancel/i);
  });
});

describe("Urgency Labels", () => {
  it("should have labels for all urgency levels", () => {
    expect(URGENCY_LABELS).toHaveProperty("baja");
    expect(URGENCY_LABELS).toHaveProperty("media");
    expect(URGENCY_LABELS).toHaveProperty("alta");
  });

  it("urgency labels should be in Spanish", () => {
    expect(URGENCY_LABELS.baja).toBe("Baja");
    expect(URGENCY_LABELS.media).toBe("Media");
    expect(URGENCY_LABELS.alta).toBe("Alta");
  });
});
