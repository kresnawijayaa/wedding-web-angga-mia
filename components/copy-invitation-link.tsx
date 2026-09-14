"use client";

import { useState } from "react";

export function CopyInvitationLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="admin-action-button" type="button" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }}>{copied ? "Copied ✓" : "Copy link"}</button>;
}
