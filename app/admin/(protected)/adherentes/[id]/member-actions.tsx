"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addNote,
  addPayment,
  cancelMembership,
  deleteNote,
  deletePayment,
} from "@/app/admin/(protected)/actions";
import {
  DEFAULT_NOTE_AUTHOR,
  NOTE_AUTHORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  formatEuros,
} from "@/lib/constants";

/** Actions de la fiche adhérente. Confirmations natives, pas de modale maison. */

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-xl bg-brand-light/25 px-4 py-2.5 text-sm text-brand-dark">
      {message}
    </p>
  );
}

export function AddPaymentForm({
  memberId,
  suggestedEuros,
}: {
  memberId: string;
  suggestedEuros: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        + Ajouter un paiement
      </button>
    );
  }

  return (
    <form
      className="mt-4 grid gap-4 rounded-2xl bg-brand-light/10 p-4 sm:grid-cols-2"
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await addPayment(formData);
          if (result.ok) {
            setOpen(false);
            router.refresh();
          } else {
            setError(result.message);
          }
        })
      }
    >
      <input type="hidden" name="memberId" value={memberId} />

      <div>
        <label className="label" htmlFor="amountEuros">
          Montant (€)
        </label>
        <input
          id="amountEuros"
          name="amountEuros"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={suggestedEuros}
          className="field"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="method">
          Mode de règlement
        </label>
        <select id="method" name="method" defaultValue="cash" className="field">
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="paidOn">
          Date du paiement
        </label>
        <input
          id="paidOn"
          name="paidOn"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="field"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Note (facultatif)
        </label>
        <input id="notes" name="notes" type="text" className="field" />
      </div>

      <div className="sm:col-span-2">
        <ErrorLine message={error} />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le paiement"}
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

export function DeletePaymentButton({
  memberId,
  paymentId,
  amountCents,
}: {
  memberId: string;
  paymentId: string;
  amountCents: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-semibold text-brand-dark/60 underline hover:text-brand"
      onClick={() => {
        if (!confirm(`Supprimer ce paiement de ${formatEuros(amountCents)} ?`)) return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("paymentId", paymentId);
          formData.set("memberId", memberId);
          await deletePayment(formData);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}

export type NoteRow = {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
};

export function NotesSection({
  memberId,
  notes,
}: {
  memberId: string;
  notes: NoteRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-brand-dark/60">Aucune note pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-brand-light/30 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-brand-dark/60">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(note.createdAt))}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-dark/60 underline hover:text-brand"
                  onClick={() => {
                    if (!confirm("Supprimer cette note ?")) return;
                    startTransition(async () => {
                      const formData = new FormData();
                      formData.set("noteId", note.id);
                      formData.set("memberId", memberId);
                      await deleteNote(formData);
                      router.refresh();
                    });
                  }}
                >
                  Supprimer
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-brand-dark">{note.content}</p>
              <p className="mt-2 text-sm font-medium text-brand">
                {note.authorName ?? DEFAULT_NOTE_AUTHOR}
              </p>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form
          className="space-y-4 rounded-2xl bg-brand-light/10 p-4"
          action={(formData) =>
            startTransition(async () => {
              setError(null);
              const result = await addNote(formData);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              } else {
                setError(result.message);
              }
            })
          }
        >
          <input type="hidden" name="memberId" value={memberId} />
          <div>
            <label className="label" htmlFor="content">
              Note
            </label>
            <textarea id="content" name="content" rows={3} className="field" required />
          </div>
          <div>
            <label className="label" htmlFor="authorName">
              Auteur
            </label>
            <input
              id="authorName"
              name="authorName"
              list="note-authors"
              defaultValue={DEFAULT_NOTE_AUTHOR}
              className="field"
            />
            <datalist id="note-authors">
              {NOTE_AUTHORS.map((author) => (
                <option key={author} value={author} />
              ))}
            </datalist>
          </div>
          <ErrorLine message={error} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer la note"}
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
        </form>
      ) : (
        <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
          + Ajouter une note
        </button>
      )}
    </div>
  );
}

export function CancelMembershipButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="btn-ghost border-brand-dark/30 text-brand-dark/80"
      onClick={() => {
        if (
          !confirm(
            "Annuler cette adhésion ? La fiche, les paiements, les présences et les notes seront conservés.",
          )
        )
          return;
        startTransition(async () => {
          const formData = new FormData();
          formData.set("memberId", memberId);
          await cancelMembership(formData);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Annuler l’adhésion"}
    </button>
  );
}
