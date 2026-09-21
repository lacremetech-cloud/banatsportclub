"use client";

import { useEffect, useState } from "react";

/**
 * Bouton « copier » pour une valeur qu'on recopie à la main autrement :
 * un IBAN, une référence de virement, un numéro de téléphone.
 *
 * `navigator.clipboard` n'existe pas partout — il demande un contexte
 * sécurisé, et certains navigateurs mobiles anciens ne l'exposent pas. La
 * méthode historique sert alors de filet, plutôt que de laisser le bouton
 * sans effet.
 */
export function CopyButton({
  value,
  label = "Copier",
  copiedLabel = "Copié ✓",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    setFailed(false);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      }
      setCopied(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={
        className ??
        "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-brand-light/60 bg-white px-3 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand hover:text-brand"
      }
    >
      {failed ? "Copie impossible" : copied ? copiedLabel : label}
    </button>
  );
}
