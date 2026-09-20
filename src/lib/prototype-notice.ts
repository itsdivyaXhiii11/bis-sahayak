/**
 * Shared "this is a prototype, not a live government channel" notice.
 *
 * The complaints/escalation/notifications feature layer (src/db/schema.ts)
 * stores citizen input locally and does nothing else with it — no row is
 * ever transmitted to BIS, CPGRAMS, or any real grievance system. Every
 * route and UI surface built on those tables must carry this notice so a
 * user never mistakes "submitted" for "filed with BIS." This mirrors the
 * existing rule for mock external integrations (src/lib/mock-integrations.ts):
 * label it clearly, never let a prototype pass as the real thing.
 */
export const PROTOTYPE_NOTICE =
  "This is a prototype feature of this assistant, not BIS's official grievance system. " +
  "Nothing you submit here is sent to BIS. For a real complaint, use the official channels below.";

export const PROTOTYPE_FLAG = { prototype: true, transmittedToBis: false } as const;
