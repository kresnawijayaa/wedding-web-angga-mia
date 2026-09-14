"use client";

import { useEffect } from "react";

export default function InvitationError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("Invitation unavailable:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="invitation-error">
      <div className="access-monogram">A <i /> M</div>
      <div>
        <p className="eyebrow dark">A brief pause</p>
        <h1>Our story is<br/><em>still here.</em></h1>
        <p>Koneksi ke undangan sedang terputus sementara. Silakan coba kembali—tautan personal Anda tetap aman.</p>
        <button className="primary" type="button" onClick={retry}>Try again <span>↗</span></button>
      </div>
    </main>
  );
}
