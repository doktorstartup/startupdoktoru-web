"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Üyelik: Supabase Auth (email+şifre / Google). Erişim (owned) ödenmiş siparişlerden
// e-posta eşleşmesiyle gelir. Ders ilerlemesi localStorage'da (e-posta bazlı).

export type MemberSession = { email: string; owned: string[] };

async function fetchOwned(email: string): Promise<string[]> {
  try {
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.owned || [];
  } catch {
    return [];
  }
}

// Üye oturum açtığında lead + karşılama serisini garantile. Sunucu tarafı idempotent
// (lead/enrollment çift oluşmaz, mail tekrar gitmez); burada tarayıcı başına bir kez çağırırız.
function ensureWelcome(user: User) {
  if (typeof window === "undefined" || !user?.email) return;
  try {
    const email = user.email.toLowerCase();
    const key = `ds_welcomed_${email}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const meta = (user.user_metadata || {}) as { full_name?: string; name?: string };
    const name = meta.full_name || meta.name || "";
    const source = user.app_metadata?.provider || "auth";
    fetch("/api/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, source }),
    }).catch(() => {});
  } catch {
    /* sessizce geç */
  }
}

export function useMember() {
  const [member, setMember] = useState<MemberSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = async (user: User | undefined | null) => {
      const email = user?.email;
      if (!email) {
        if (active) {
          setMember(null);
          setLoading(false);
        }
        return;
      }
      const owned = await fetchOwned(email);
      if (active) {
        setMember({ email: email.toLowerCase(), owned });
        setLoading(false);
      }
      ensureWelcome(user); // karşılama/CRM garantisi (özellikle Google ile girenler)
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { ok: !error, error: error?.message };
  }, []);

  const signUp = useCallback(
    async ({ name, email, phone, password }: { name: string; email: string; phone: string; password: string }) => {
      const normalized = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { name, phone } },
      });
      if (error) return { ok: false, error: error.message };

      // CRM lead + karşılama maili
      try {
        await supabase.from("ds_leads").insert([
          { name, email: normalized, phone: phone || null, source: "signup", status: "NEW", score: 15, stage: "NEW_LEAD" },
        ]);
      } catch {
        /* lead eklenemese de akışı bozma */
      }
      fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, name }),
      }).catch(() => {});

      // data.session yoksa "Confirm email" açık demektir → doğrulama bekleniyor.
      return { ok: true, needsConfirm: !data.session };
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    // Doğrudan /portal/course'a dön — /portal ara-yönlendirmesi OAuth kodunu düşürüyor.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal/course` },
    });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/portal/course`,
    });
    return { ok: !error, error: error?.message };
  }, []);

  const logout = useCallback(async () => {
    // scope 'local': oturumu hemen yerelden sil (sunucu round-trip'ine takılmaz)
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      /* yine de devam et */
    }
    setMember(null);
  }, []);

  const hasAccess = useCallback((productId: string) => !!member?.owned.includes(productId), [member]);

  return { member, owned: member?.owned || [], loading, signIn, signUp, signInWithGoogle, resetPassword, logout, hasAccess };
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
