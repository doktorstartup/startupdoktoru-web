"use client";

import { useCallback, useEffect, useState } from "react";

// Hafif üyelik (v1): e-posta ile giriş → ödenmiş siparişlerden erişim.
// Oturum ve ders ilerlemesi localStorage'da tutulur.

const SESSION_KEY = "ds_member";

export type MemberSession = { email: string; owned: string[] };

function readSession(): MemberSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MemberSession) : null;
  } catch {
    return null;
  }
}

export function useMember() {
  const [member, setMember] = useState<MemberSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = readSession();
    if (!s) {
      setLoading(false);
      return;
    }
    setMember(s); // önbellekteki erişimi hemen göster
    // Her açılışta erişimi sunucudan TEKRAR doğrula (sonradan açılan erişim de görünsün).
    fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: s.email }),
    })
      .then((r) => r.json())
      .then((data) => {
        const updated: MemberSession = { email: s.email, owned: data.owned || [] };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        } catch {
          /* yoksa geç */
        }
        setMember(updated);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string): Promise<{ ok: boolean; found: boolean }> => {
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const session: MemberSession = { email: email.trim().toLowerCase(), owned: data.owned || [] };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setMember(session);
      return { ok: true, found: !!data.found };
    } catch {
      return { ok: false, found: false };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* yoksa geç */
    }
    setMember(null);
  }, []);

  const hasAccess = useCallback(
    (productId: string) => !!member?.owned.includes(productId),
    [member]
  );

  return { member, owned: member?.owned || [], loading, login, logout, hasAccess };
}

// ─── Ders ilerlemesi (localStorage, e-posta bazlı) ───

function progressKey(email: string) {
  return `ds_progress_${email}`;
}

type Progress = { completed: string[]; last: string | null };

export function getProgress(email: string): Progress {
  if (typeof window === "undefined") return { completed: [], last: null };
  try {
    const raw = localStorage.getItem(progressKey(email));
    return raw ? (JSON.parse(raw) as Progress) : { completed: [], last: null };
  } catch {
    return { completed: [], last: null };
  }
}

export function saveProgress(email: string, p: Progress) {
  try {
    localStorage.setItem(progressKey(email), JSON.stringify(p));
  } catch {
    /* yoksa geç */
  }
}

export function tagInterest(email: string, productId: string) {
  try {
    fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, productId }),
    }).catch(() => {});
  } catch {
    /* sessizce geç */
  }
}
