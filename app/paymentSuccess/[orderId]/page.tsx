"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const ORDER_API_BASE =
  process.env.NEXT_PUBLIC_PAYMENT_ORDER_API_BASE ??
  "https://agentpay.workfast.ai";

const LOGO_SRC =
  process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_LOGO_SRC ?? "/uniqbrio-logo.svg";

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(amount: unknown, currency?: string | null): string {
  if (typeof amount !== "number") return "—";
  const safeCurrency = currency || "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function ensureImagesLoaded(rootElement: HTMLElement): Promise<void> {
  const images = Array.from(rootElement.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          return img.decode().catch(() => {});
        }
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const cleanup = () => {
          img.removeEventListener("load", cleanup);
          img.removeEventListener("error", cleanup);
          resolve();
        };
        img.addEventListener("load", cleanup);
        img.addEventListener("error", cleanup);
      });
    })
  );
}

type CustomerDetails = {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
};

type OrderData = {
  order_id?: string;
  cf_order_id?: string;
  order_status?: string;
  order_amount?: number;
  order_currency?: string;
  created_at?: string;
  customer_details?: CustomerDetails;
};

type OrderApiPayload = {
  success?: boolean;
  data?: OrderData | null;
};

type LoadStatus = "idle" | "loading" | "success" | "error";

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = useMemo(() => {
    const value = params?.orderId;
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const controller = new AbortController();
    const load = async () => {
      setStatus("loading");
      setErrorMessage("");
      setOrder(null);

      try {
        const url = `${ORDER_API_BASE}/api/payments/order/${encodeURIComponent(orderId)}`;
        const response = await fetch(url, { signal: controller.signal });
        const payload = (await response.json()) as OrderApiPayload;

        if (!payload?.success) {
          setStatus("error");
          setErrorMessage("Unable to fetch order details. Please try again.");
          return;
        }

        setOrder(payload.data ?? null);
        setStatus("success");
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setStatus("error");
        setErrorMessage("Unable to fetch order details. Please try again.");
      }
    };

    void load();
    return () => controller.abort();
  }, [orderId]);

  const handleExportPdf = useCallback(async () => {
    if (isExportingPdf) return;
    if (!receiptRef.current) return;

    setIsExportingPdf(true);
    const originalTitle = document.title;

    try {
      document.title = "payment-receipt";

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await ensureImagesLoaded(receiptRef.current);

      const canvas = await html2canvas(receiptRef.current, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: null,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scale = pageWidth / imgWidth;
      const scaledHeight = imgHeight * scale;

      let heightLeft = scaledHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("payment-receipt.pdf");
    } finally {
      document.title = originalTitle;
      setIsExportingPdf(false);
    }
  }, [isExportingPdf]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.card} ref={receiptRef}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <Image
                src={LOGO_SRC}
                alt="Uniqbrio"
                width={140}
                height={40}
                className={styles.logo}
                priority
                unoptimized
              />
            </div>

            <div className={styles.headerMain}>
              <div className={styles.iconWrap} aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 7L9.5 17.5L4 12"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className={styles.headerText}>
                <h1 className={styles.title}>Payment successful</h1>
                <p className={styles.subtitle}>
                  Thanks! Your payment is confirmed. Order details are shown
                  below.
                </p>
              </div>
            </div>

            {!isExportingPdf && (
              <div className={styles.actions} data-html2canvas-ignore="true">
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void handleExportPdf()}
                  disabled={status !== "success" || isExportingPdf}
                >
                  Export PDF
                </button>
              </div>
            )}
          </header>

          <section className={styles.body}>
            <div className={styles.summary}>
              <div className={styles.summaryTop}>
                <div className={styles.badge}>
                  Status: {order?.order_status || "—"}
                </div>
                <div className={styles.amount}>
                  {formatMoney(order?.order_amount, order?.order_currency)}
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.item}>
                  <div className={styles.label}>Order ID</div>
                  <div className={styles.valueMono}>
                    {order?.order_id || orderId || "—"}
                  </div>
                </div>
                <div className={styles.item}>
                  <div className={styles.label}>Cashfree Order ID</div>
                  <div className={styles.value}>{order?.cf_order_id || "—"}</div>
                </div>
                <div className={styles.item}>
                  <div className={styles.label}>Created</div>
                  <div className={styles.value}>
                    {formatDateTime(order?.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.detailsCard}>
              {status === "loading" && (
                <div className={styles.state}>
                  <div className={styles.spinner} aria-hidden="true" />
                  <div>
                    <div className={styles.stateTitle}>
                      Fetching order details
                    </div>
                    <div className={styles.stateSubtitle}>
                      This should only take a moment.
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className={styles.state}>
                  <div className={styles.errorIcon} aria-hidden="true">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 9V13"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 17H12.01"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.stateTitle}>Couldn’t load order</div>
                    <div className={styles.stateSubtitle}>
                      {errorMessage || "Please try again later."}
                    </div>
                    <div className={styles.hint}>
                      URL orderId:{" "}
                      <span className={styles.valueMono}>{orderId}</span>
                    </div>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className={styles.columns}>
                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Customer</h2>
                    <div className={styles.kv}>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Name</div>
                        <div className={styles.kvValue}>
                          {order?.customer_details?.customer_name || "—"}
                        </div>
                      </div>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Phone</div>
                        <div className={styles.kvValue}>
                          {order?.customer_details?.customer_phone || "—"}
                        </div>
                      </div>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Email</div>
                        <div className={styles.kvValue}>
                          {order?.customer_details?.customer_email || "—"}
                        </div>
                      </div>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Customer ID</div>
                        <div className={styles.kvValue}>
                          {order?.customer_details?.customer_id || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Need help?</h2>
                    <div className={styles.kv}>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Email</div>
                        <div className={styles.kvValue}>
                          <a
                            className={styles.inlineLink}
                            href="mailto:support@uniqbrio.com"
                          >
                            support@uniqbrio.com
                          </a>
                        </div>
                      </div>
                      <div className={styles.kvRow}>
                        <div className={styles.kvKey}>Mobile</div>
                        <div className={styles.kvValue}>
                          <a
                            className={styles.inlineLink}
                            href="tel:+918056329742"
                          >
                            +91-8056329742
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className={styles.metaNote}>
                      Share your order ID when contacting support for faster
                      assistance.
                    </div>
                  </div>
                </div>
              )}

              {status === "idle" && (
                <div className={styles.state}>
                  <div className={styles.stateTitle}>Waiting for order ID</div>
                  <div className={styles.stateSubtitle}>
                    Open this page as /paymentSuccess/&lt;orderId&gt;.
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
