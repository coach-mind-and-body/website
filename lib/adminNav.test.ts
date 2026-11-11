import { describe, expect, it } from "vitest";
import { LEGACY_ADMIN_TABS, resolveAdminSearch } from "./adminNav";

const OLD_TABS = [
  "overview",
  "sprint",
  "contacts",
  "applicants",
  "intakes",
  "programs",
  "crm-automations",
  "newsletters",
  "snackhack",
  "challenge",
  "fpu",
  "fpugroup",
  "programbuilder",
  "engagement",
  "food",
  "pageeditor",
  "blog",
  "deposits",
  "filelibrary",
  "settings",
];

describe("resolveAdminSearch", () => {
  it("sends every retired tab to its new home", () => {
    expect(resolveAdminSearch("tab=sprint").search).toBe("tab=overview&focus=month");
    expect(resolveAdminSearch("tab=contacts").search).toBe("tab=people&source=contacts&screen=contacts");
    expect(resolveAdminSearch("tab=applicants").search).toBe(
      "tab=people&source=applicants&screen=applicants"
    );
    expect(resolveAdminSearch("tab=intakes").search).toBe("tab=people&source=intakes&screen=intakes");
    expect(resolveAdminSearch("tab=snackhack").search).toBe(
      "tab=people&source=snackhack&screen=snackhack"
    );
    expect(resolveAdminSearch("tab=crm-automations").search).toBe("tab=marketing&section=crm");
    expect(resolveAdminSearch("tab=newsletters").search).toBe("tab=marketing&section=newsletters");
    expect(resolveAdminSearch("tab=challenge").search).toBe(
      "tab=programs&program=challenge&section=signups"
    );
    expect(resolveAdminSearch("tab=fpu").search).toBe("tab=programs&program=fpu&section=coaching");
    expect(resolveAdminSearch("tab=fpugroup").search).toBe("tab=programs&program=fpu&section=signups");
    expect(resolveAdminSearch("tab=programbuilder").search).toBe(
      "tab=programs&program=reclaim&section=content"
    );
    expect(resolveAdminSearch("tab=pageeditor").search).toBe("tab=programs&program=fpu&section=page");
    expect(resolveAdminSearch("tab=food").search).toBe("tab=library&section=food");
    expect(resolveAdminSearch("tab=filelibrary").search).toBe("tab=library&section=files");
    expect(resolveAdminSearch("tab=blog").search).toBe("tab=marketing&section=blog");
  });

  it("leaves the sections that stayed put", () => {
    for (const tab of ["overview", "programs", "engagement", "deposits", "settings"]) {
      const resolved = resolveAdminSearch(`tab=${tab}`);
      expect(resolved.changed).toBe(false);
      expect(resolved.tab).toBe(tab);
    }
  });

  it("covers the previous pill list", () => {
    for (const tab of OLD_TABS) {
      const resolved = resolveAdminSearch(`tab=${tab}&gcal=connected`);
      expect(resolved.tab).toBeTruthy();
      expect(resolved.search).toContain("gcal=connected");
      if (LEGACY_ADMIN_TABS[tab]) expect(resolved.changed).toBe(true);
    }
  });

  it("keeps an unknown tab from rewriting the query", () => {
    const resolved = resolveAdminSearch("tab=nope");
    expect(resolved.changed).toBe(false);
    expect(resolved.tab).toBe("overview");
    expect(resolved.search).toBe("tab=nope");
  });
});
