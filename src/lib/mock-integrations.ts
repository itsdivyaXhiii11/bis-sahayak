/**
 * Mock external-integration layer (parity with A's mocked BIS/Gov/payment
 * clients). Every function here is a deterministic, clearly-labeled
 * fake — `source: "mock"` on every return value — with NO network calls
 * out to any real BIS, government, or payment endpoint. This exists to
 * demonstrate the shape these integrations would take (request/response
 * contracts a real integration would need to satisfy), not to perform
 * real licence lookups, identity verification, or payments.
 *
 * If this is ever wired to a real provider, the `source: "mock"` literal
 * type below should make every call site that needs updating a type
 * error — intentional friction against silently shipping fake data as
 * real.
 */

function fakeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export interface MockResult<T> {
  source: "mock";
  note: string;
  data: T;
}

const MOCK_NOTE =
  "Simulated response — no real BIS, government, or payment system was contacted. For real status, use the official portal linked in this app.";

export function mockBisLicenceLookup(licenceId: string): MockResult<{
  licenceId: string;
  status: "active" | "suspended" | "expired" | "not_found";
  productCategory: string;
  standardNumber: string;
  validUpto: string;
}> {
  if (!licenceId || licenceId.trim().length < 3) {
    return {
      source: "mock",
      note: MOCK_NOTE,
      data: { licenceId, status: "not_found", productCategory: "", standardNumber: "", validUpto: "" },
    };
  }
  // Deterministic pseudo-status from the id so repeated lookups are stable.
  const hash = [...licenceId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = ["active", "suspended", "expired"] as const;
  return {
    source: "mock",
    note: MOCK_NOTE,
    data: {
      licenceId,
      status: statuses[hash % statuses.length],
      productCategory: "Household electrical appliances",
      standardNumber: "IS 302 Part 2/Sec 15:2009",
      validUpto: "2027-03-31",
    },
  };
}

export function mockApplicationStatus(applicationRef: string): MockResult<{
  applicationRef: string;
  stage: "submitted" | "document_verification" | "factory_inspection" | "testing" | "approved" | "rejected";
  lastUpdated: string;
}> {
  const stages = ["submitted", "document_verification", "factory_inspection", "testing", "approved"] as const;
  const hash = [...applicationRef].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    source: "mock",
    note: MOCK_NOTE,
    data: {
      applicationRef,
      stage: stages[hash % stages.length],
      lastUpdated: new Date().toISOString().slice(0, 10),
    },
  };
}

export function mockUdyamVerify(udyamNumber: string): MockResult<{ udyamNumber: string; valid: boolean; enterpriseName: string; category: string }> {
  const valid = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(udyamNumber.trim());
  return {
    source: "mock",
    note: MOCK_NOTE,
    data: { udyamNumber, valid, enterpriseName: valid ? "Sample Registered Enterprise" : "", category: valid ? "Micro" : "" },
  };
}

export function mockGstinVerify(gstin: string): MockResult<{ gstin: string; valid: boolean; legalName: string; status: string }> {
  const valid = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.trim());
  return {
    source: "mock",
    note: MOCK_NOTE,
    data: { gstin, valid, legalName: valid ? "Sample Registered Entity Pvt Ltd" : "", status: valid ? "Active" : "Not found" },
  };
}

export function mockDigilockerFetch(documentType: string): MockResult<{ documentType: string; documentId: string; issued: boolean }> {
  return {
    source: "mock",
    note: MOCK_NOTE + " No DigiLocker consent flow actually ran.",
    data: { documentType, documentId: fakeId("DL"), issued: true },
  };
}

export function mockCreatePaymentOrder(amountInPaise: number, purpose: string): MockResult<{ orderId: string; amountInPaise: number; purpose: string; status: "created" }> {
  return {
    source: "mock",
    note: MOCK_NOTE + " No money moves.",
    data: { orderId: fakeId("ORDER"), amountInPaise, purpose, status: "created" },
  };
}

export function mockVerifyPayment(orderId: string): MockResult<{ orderId: string; status: "paid" | "pending" | "failed" }> {
  return {
    source: "mock",
    note: MOCK_NOTE,
    data: { orderId, status: "paid" },
  };
}
