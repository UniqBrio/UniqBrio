"use client";

import Script from "next/script";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAYMENTS_API_BASE =
  process.env.NEXT_PUBLIC_PAYMENTS_API_BASE ?? "https://agentpay.workfast.ai";

function cashfreeModeFromEnv(): "production" | "sandbox" {
  const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV ?? "")
    .toLowerCase()
    .trim();
  if (!env) return "production";
  if (env === "sandbox" || env === "test" || env === "development") {
    return "sandbox";
  }
  return "production";
}

function normalizeCashfreeMode(
  value: unknown
): "production" | "sandbox" | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase();
  if (v === "prod" || v === "production" || v === "live") return "production";
  if (v === "sandbox" || v === "test" || v === "development") return "sandbox";
  return null;
}

type CheckoutOptions = {
  paymentSessionId: string;
  redirectTarget: string;
};

type CashfreeFactory = (opts: { mode: "production" | "sandbox" }) => {
  checkout: (opts: CheckoutOptions) => void | Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

type SessionPayload = {
  paymentSessionId: string;
  /** When the backend knows which Cashfree env the order was created in, pass it so the SDK matches (avoids payment_session_id_invalid). */
  cashfreeMode: "production" | "sandbox";
};

function extractPaymentSessionPayload(raw: unknown): SessionPayload | null {
  const root =
    raw && typeof raw === "object" && "data" in raw && raw.data != null
      ? (raw as { data: unknown }).data
      : raw;
  if (!root || typeof root !== "object") return null;

  const o = root as Record<string, unknown>;
  const candidates = [
    o.payment_session_id,
    o.paymentSessionId,
    o.session_id,
    o.sessionId,
  ];
  let paymentSessionId = "";
  for (const c of candidates) {
    if (typeof c === "string") {
      paymentSessionId = c.trim();
      if (paymentSessionId) break;
    }
  }
  if (paymentSessionId.length < 8) return null;

  const modeRaw =
    o.cashfree_env ??
    o.cashfreeEnv ??
    o.cf_env ??
    o.environment ??
    o.env ??
    (raw && typeof raw === "object" && "cashfree_env" in raw
      ? (raw as Record<string, unknown>).cashfree_env
      : undefined);

  const cashfreeMode =
    normalizeCashfreeMode(modeRaw) ?? cashfreeModeFromEnv();

  return { paymentSessionId, cashfreeMode };
}

async function fetchPaymentSession(orderId: string): Promise<SessionPayload> {
  const url = `${PAYMENTS_API_BASE}/api/payments/get-payment-session/${encodeURIComponent(orderId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch payment session");
  }
  const data: unknown = await res.json();
  const payload = extractPaymentSessionPayload(data);
  if (!payload) {
    throw new Error("Payment session not found");
  }
  return payload;
}

export default function HostedCheckoutPage() {
  const params = useParams();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";

  const [session, setSession] = useState<SessionPayload | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.Cashfree === "function") {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setError("orderId required");
      setLoadingSession(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchPaymentSession(orderId);
        if (!cancelled) setSession(payload);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const openCheckout = useCallback(() => {
    if (openedRef.current || !session) return;
    const Cashfree = window.Cashfree;
    if (typeof Cashfree !== "function") return;

    try {
      openedRef.current = true;
      const cf = Cashfree({ mode: session.cashfreeMode });
      const checkoutOptions: CheckoutOptions = {
        paymentSessionId: session.paymentSessionId,
        redirectTarget: "_self",
      };

      const result = cf.checkout(checkoutOptions);
      const handleCheckoutResult = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        const r = value as { error?: { message?: string; code?: string } };
        if (r.error) {
          openedRef.current = false;
          setError(
            r.error.message ??
              r.error.code ??
              "Payment could not be started. Check Cashfree environment matches your order."
          );
        }
      };

      if (result != null && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<unknown>).then(handleCheckoutResult).catch((err) => {
          console.error("Cashfree checkout error", err);
          openedRef.current = false;
          setError("Could not start payment. Please refresh and try again.");
        });
      }
    } catch (err) {
      console.error("Cashfree checkout init error", err);
      openedRef.current = false;
      setError("Could not start payment. Please refresh and try again.");
    }
  }, [session]);

  useEffect(() => {
    if (!sdkReady || !session || openedRef.current) return;
    openCheckout();
  }, [sdkReady, session, openCheckout]);

  useEffect(() => {
    if (sdkReady || !session || openedRef.current) return;

    let attempts = 0;
    const maxAttempts = 40;
    const iv = setInterval(() => {
      attempts++;
      if (typeof window.Cashfree === "function") {
        clearInterval(iv);
        setSdkReady(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(iv);
        setError("Payment SDK failed to load. Check your connection and try again.");
      }
    }, 250);

    return () => clearInterval(iv);
  }, [sdkReady, session]);

  const onScriptLoad = useCallback(() => {
    setSdkReady(true);
  }, []);

  const handleRetry = useCallback(() => {
    if (!orderId) return;
    setError(null);
    openedRef.current = false;
    setSession(null);
    setLoadingSession(true);
    void fetchPaymentSession(orderId)
      .then((payload) => setSession(payload))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Something went wrong")
      )
      .finally(() => setLoadingSession(false));
  }, [orderId]);

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        {error ? (
          <div className="flex max-w-md flex-col items-center gap-4">
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              disabled={loadingSession || !orderId}
            >
              <RefreshCw
                className={cn(loadingSession && "animate-spin")}
                aria-hidden
              />
              {loadingSession ? "Retrying…" : "Retry"}
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-medium">Redirecting to payment…</h1>
            <p className="text-muted-foreground text-sm">
              {loadingSession
                ? "Preparing your session…"
                : "Please wait while we open the secure checkout."}
            </p>
          </>
        )}
        <noscript>
          <p className="text-sm">Please enable JavaScript to complete the payment.</p>
        </noscript>
      </main>
    </>
  );
}
