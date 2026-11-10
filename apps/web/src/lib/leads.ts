/**
 * Browser lead-submission adapter.
 *
 * If NEXT_PUBLIC_LEAD_ENDPOINT is set at build time, POSTs the payload
 * and resolves only on 2xx. If it is unset, returns { mode: "local" }
 * so the UI can unlock the download without pretending the email was saved.
 */
export type LeadPayload = {
  email: string;
  firstName?: string;
  source: string;
  consent: true;
  ts: string;
};

export type LeadResult =
  | { mode: "local" }
  | { mode: "remote"; status: number };

export function getLeadEndpoint(): string {
  return (process.env.NEXT_PUBLIC_LEAD_ENDPOINT || "").trim();
}

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  const endpoint = getLeadEndpoint();
  if (!endpoint) return { mode: "local" };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Lead endpoint returned ${res.status}`);
  }
  return { mode: "remote", status: res.status };
}
