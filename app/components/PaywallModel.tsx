"use client";

import { useState } from "react";
import { TEMPLATES, type TemplateId, formatNaira } from "@/lib/useCredits";

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Called when the user completes a (simulated) payment.
   * Receives the selected template so the parent can retry the fix.
   */
  onPaid: (template: TemplateId) => void;
  /** Optional feature context — "cv" or "cover-letter" */
  feature?: "cv" | "cover-letter";
  /** Pre-selected template from the parent */
  defaultTemplate?: TemplateId;
}

export function PaywallModal({
  open,
  onClose,
  onPaid,
  feature = "cv",
  defaultTemplate = "classic",
}: Props) {
  const [selected, setSelected] = useState<TemplateId>(defaultTemplate);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const info = TEMPLATES[selected];
  const featureLabel = feature === "cv" ? "CV fix" : "cover letter";

  async function handlePay() {
    setLoading(true);
    // Simulate payment processing (Paystack / 9PSB to be wired later)
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    onPaid(selected);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-navy ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-grotesk text-lg font-bold text-white">
                Choose your template
              </h3>
              <p className="text-xs text-stone mt-1">
                Pay once per {featureLabel}. No subscriptions.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone hover:bg-white/5 hover:text-white transition"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="p-5 space-y-4">
          {/* Free */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              Free
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["classic", "minimal"] as TemplateId[]).map((id) => (
                <TemplateOption
                  key={id}
                  id={id}
                  selected={selected === id}
                  onSelect={() => setSelected(id)}
                />
              ))}
            </div>
          </div>

          {/* Standard */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              Standard · ₦1,000 per fix
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["modern", "executive"] as TemplateId[]).map((id) => (
                <TemplateOption
                  key={id}
                  id={id}
                  selected={selected === id}
                  onSelect={() => setSelected(id)}
                />
              ))}
            </div>
          </div>

          {/* Premium */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              💎 Premium · ₦1,500 per fix
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "creative",
                  "corporate",
                  "academic",
                  "japa",
                  "tech",
                ] as TemplateId[]
              ).map((id) => (
                <TemplateOption
                  key={id}
                  id={id}
                  selected={selected === id}
                  onSelect={() => setSelected(id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="p-5 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone">Total</span>
            <span className="font-grotesk text-2xl font-extrabold text-cyan">
              {info.priceNaira === 0
                ? "Free"
                : formatNaira(info.priceNaira)}
            </span>
          </div>

          <button
            onClick={handlePay}
            disabled={loading || info.priceNaira === 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue font-grotesk font-bold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing...
              </>
            ) : info.priceNaira === 0 ? (
              <>You've used your free fixes</>
            ) : (
              <>💳 Pay {formatNaira(info.priceNaira)} & Continue</>
            )}
          </button>

          <p className="text-center text-[11px] text-stone">
            🔒 Secure payment · Card, bank transfer, USSD
          </p>

          <p className="text-center text-[10px] text-gray-500">
            Payments via Paystack coming soon. Clicking "Pay" simulates a
            successful payment for testing.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template option card
// ---------------------------------------------------------------------------
function TemplateOption({
  id,
  selected,
  onSelect,
}: {
  id: TemplateId;
  selected: boolean;
  onSelect: () => void;
}) {
  const info = TEMPLATES[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl p-3 text-left transition ${
        selected
          ? "bg-blue/20 ring-2 ring-cyan"
          : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          {info.tier === "premium" && "💎 "}
          {info.name}
        </span>
        <span
          className={`text-[10px] font-semibold ${
            info.priceNaira === 0 ? "text-emerald" : "text-cyan"
          }`}
        >
          {info.priceNaira === 0 ? "FREE" : `₦${info.priceNaira}`}
        </span>
      </div>
      <div className="text-[10px] text-stone mt-1">{info.bestFor}</div>
    </button>
  );
}
