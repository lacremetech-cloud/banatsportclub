"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addAccountingEntry,
  deleteAccountingEntry,
} from "@/app/admin/(protected)/actions";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  formatEuros,
} from "@/lib/constants";

type EntryType = "INCOME" | "EXPENSE";

const CONFIG: Record<
  EntryType,
  { button: string; title: string; categories: readonly string[]; placeholder: string }
> = {
  INCOME: {
    button: "+ Ajouter une recette",
    title: "Nouvelle recette",
    categories: INCOME_CATEGORIES,
    placeholder: "Don de la mairie",
  },
  EXPENSE: {
    button: "+ Ajouter une dépense",
    title: "Nouvelle dépense",
    categories: EXPENSE_CATEGORIES,
    placeholder: "Achat de tapis",
  },
};

function today(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/**
 * Saisie d'un mouvement manuel.
 *
 * Un seul formulaire pour les deux sens : seules la liste des catégories et
 * les libellés changent. Le moyen de paiement n'est proposé que pour une
 * dépense, où il sert vraiment au bureau.
 */
export function AddEntryForm({ type }: { type: EntryType }) {
  const router = useRouter();
  const config = CONFIG[type];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        {config.button}
      </button>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-brand-light/40 bg-white p-5 sm:grid-cols-2"
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await addAccountingEntry(formData);
          if (result.ok) {
            setOpen(false);
            router.refresh();
          } else {
            setError(result.message);
          }
        })
      }
    >
      <input type="hidden" name="type" value={type} />

      <h3 className="text-lg font-bold text-brand-dark sm:col-span-2">{config.title}</h3>

      <div>
        <label className="label" htmlFor={`${type}-entryDate`}>
          Date
        </label>
        <input
          id={`${type}-entryDate`}
          name="entryDate"
          type="date"
          defaultValue={today()}
          className="field"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor={`${type}-amountEuros`}>
          Montant (€)
        </label>
        <input
          id={`${type}-amountEuros`}
          name="amountEuros"
          type="number"
          step="0.01"
          min="0.01"
          className="field"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor={`${type}-category`}>
          Catégorie
        </label>
        <select
          id={`${type}-category`}
          name="category"
          defaultValue={config.categories[0]}
          className="field"
        >
          {config.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${type}-label`}>
          Intitulé
        </label>
        <input
          id={`${type}-label`}
          name="label"
          type="text"
          placeholder={config.placeholder}
          className="field"
          required
        />
      </div>

      {type === "EXPENSE" && (
        <div>
          <label className="label" htmlFor={`${type}-paymentMethod`}>
            Moyen de paiement (facultatif)
          </label>
          <select
            id={`${type}-paymentMethod`}
            name="paymentMethod"
            defaultValue=""
            className="field"
          >
            <option value="">Non précisé</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={PAYMENT_METHOD_LABELS[method]}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={type === "EXPENSE" ? "" : "sm:col-span-2"}>
        <label className="label" htmlFor={`${type}-note`}>
          Note (facultatif)
        </label>
        <input id={`${type}-note`} name="note" type="text" className="field" />
      </div>

      <div className="sm:col-span-2">
        {error && (
          <p className="mb-3 rounded-xl bg-brand-light/25 px-4 py-2.5 text-sm text-brand-dark">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            className="btn-ghost justify-center py-3"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Annuler
          </button>
        </div>
      </div>
    </form>
  );
}

/** Suppression d'une saisie manuelle. Ne concerne jamais une cotisation. */
export function DeleteEntryButton({
  entryId,
  label,
  amountCents,
}: {
  entryId: string;
  label: string;
  amountCents: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-11 px-2 text-sm font-semibold text-brand-dark/60 underline hover:text-brand"
      onClick={() => {
        if (!confirm(`Supprimer « ${label} » (${formatEuros(Math.abs(amountCents))}) ?`))
          return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("entryId", entryId);
          await deleteAccountingEntry(formData);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
