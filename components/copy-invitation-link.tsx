"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyInvitationLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="admin-action-button" type="button" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }}>{copied ? <><Check aria-hidden="true"/>Copied</> : <><Copy aria-hidden="true"/>Copy link</>}</button>;
}
