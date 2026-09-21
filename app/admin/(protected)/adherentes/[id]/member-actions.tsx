"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addNote,
  addPayment,
  archiveMember,
  cancelMembership,
  deleteNote,
  deletePayment,
  restoreMember,
  setEquipmentDelivered,
  trashMember,
  updateMemberFee,
  updateMemberInstallments,
  type ActionResult,
} from "@/app/admin/(protected)/actions";
import {
  DEFAULT_NOTE_AUTHOR,
  NOTE_AUTHORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  formatDate,
  formatEuros,
} from "@/lib/constants";
import {
  FEE_TYPES,
  FEE_TYPE_LABELS,
  INSTALLMENT_PLANS,
  installmentLabel,
  splitInstallments,
  type FeeType,
} from "@/lib/fees";

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

/**
 * Changement du type de cotisation.
 *
 * Trois choix, un montant annoncé sous chacun, une confirmation, et c'est
 * tout : ni motif obligatoire, ni catégorie de situation personnelle.
 */
export function ChangeFeeButton({
  memberId,
  currentFeeType,
  scale,
}: {
  memberId: string;
  currentFeeType: string;
  scale: Record<FeeType, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Modifier la cotisation
      </button>
    );
  }

  function apply(feeType: FeeType) {
    if (
      !confirm(
        `Passer cette adhérente en cotisation ${FEE_TYPE_LABELS[feeType].toLowerCase()} ? Montant dû : ${formatEuros(scale[feeType])}.`,
      )
    )
      return;

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("feeType", feeType);
      const result = await updateMemberFee(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="mt-4 rounded-2xl bg-brand-light/10 p-4">
      <p className="font-semibold text-brand-dark">Type de cotisation</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {FEE_TYPES.map((feeType) => {
          const active = currentFeeType === feeType;
          return (
            <button
              key={feeType}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() => apply(feeType)}
              className={`min-h-14 rounded-xl border-2 px-3 py-3 text-left transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-brand-light/50 bg-white text-brand-dark hover:border-brand"
              }`}
            >
              <span className="block text-sm font-bold">{FEE_TYPE_LABELS[feeType]}</span>
              <span className="block text-sm opacity-80">
                {formatEuros(scale[feeType])}
              </span>
            </button>
          );
        })}
      </div>
      <ErrorLine message={error} />
      <button
        type="button"
        className="mt-3 text-sm font-semibold text-brand-dark/60 underline"
        onClick={() => setOpen(false)}
        disabled={pending}
      >
        Fermer
      </button>
    </div>
  );
}

/** Échéancier. Le 3 fois n'apparaît qu'ici, jamais sur le site public. */
export function ChangeInstallmentsButton({
  memberId,
  currentPlan,
  feeAmountCents,
}: {
  memberId: string;
  currentPlan: number;
  feeAmountCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Modifier l’échéancier
      </button>
    );
  }

  function apply(plan: number) {
    const parts = splitInstallments(feeAmountCents, plan);
    if (
      !confirm(
        `Passer cette adhérente en ${installmentLabel(plan).toLowerCase()} ? Échéances : ${parts
          .map((part) => formatEuros(part))
          .join(" + ")}.`,
      )
    )
      return;

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("installments", String(plan));
      const result = await updateMemberInstallments(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="mt-4 rounded-2xl bg-brand-light/10 p-4">
      <p className="font-semibold text-brand-dark">Nombre d’échéances</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {INSTALLMENT_PLANS.map((plan) => {
          const active = currentPlan === plan;
          const parts = splitInstallments(feeAmountCents, plan);
          return (
            <button
              key={plan}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() => apply(plan)}
              className={`min-h-14 rounded-xl border-2 px-3 py-3 text-left transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-brand-light/50 bg-white text-brand-dark hover:border-brand"
              }`}
            >
              <span className="block text-sm font-bold">
                {plan === 1 ? "1 fois" : `${plan} fois`}
              </span>
              <span className="block text-sm opacity-80">
                {plan === 1
                  ? formatEuros(parts[0])
                  : parts.map((part) => formatEuros(part)).join(" + ")}
              </span>
            </button>
          );
        })}
      </div>
      <ErrorLine message={error} />
      <button
        type="button"
        className="mt-3 text-sm font-semibold text-brand-dark/60 underline"
        onClick={() => setOpen(false)}
        disabled={pending}
      >
        Fermer
      </button>
    </div>
  );
}

/**
 * Remise du kit.
 *
 * Deux états, un seul bouton : remettre, ou annuler la remise. Le bureau voit
 * d'un coup d'œil où il en est, sans ouvrir de formulaire.
 */
export function EquipmentAction({
  memberId,
  delivered,
  deliveredAt,
}: {
  memberId: string;
  delivered: boolean;
  /** Date ISO, pour éviter de faire traverser un objet Date au client. */
  deliveredAt: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(next: boolean) {
    if (
      !next &&
      !confirm("Annuler la remise de l’équipement ? La date enregistrée sera effacée.")
    )
      return;

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("delivered", String(next));
      const result = await setEquipmentDelivered(formData);
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div>
      {delivered ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-semibold text-emerald-800">
            Équipement remis
            {deliveredAt ? ` le ${formatDate(deliveredAt)}` : ""}
          </p>
          <button
            type="button"
            disabled={pending}
            className="min-h-11 text-sm font-semibold text-brand-dark/60 underline hover:text-brand"
            onClick={() => apply(false)}
          >
            {pending ? "…" : "Annuler la remise"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-brand-dark/70">Équipement non remis.</p>
          <button
            type="button"
            className="btn-ghost"
            disabled={pending}
            onClick={() => apply(true)}
          >
            {pending ? "Enregistrement…" : "Marquer l’équipement comme remis"}
          </button>
        </div>
      )}
      <ErrorLine message={error} />
    </div>
  );
}

/**
 * Archiver, mettre à la corbeille, restaurer.
 *
 * Les gestes qui retirent une fiche des listes sont volontairement
 * secondaires : pas de bouton plein, pas de rouge. Rien n'est supprimé, donc
 * rien ne justifie d'alarmer — mais chacun demande confirmation, parce qu'ils
 * font disparaître la fiche de l'écran où le bureau travaille.
 */
export function ArchiveActions({
  memberId,
  view,
}: {
  memberId: string;
  view: "current" | "archived" | "trashed";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: (formData: FormData) => Promise<ActionResult>,
    question: string | null,
  ) {
    if (question && !confirm(question)) return;
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("memberId", memberId);
      const result = await action(formData);
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  const secondary = "btn-ghost border-brand-dark/25 text-brand-dark/70";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {view !== "current" && (
        <button
          type="button"
          disabled={pending}
          className="btn-ghost"
          onClick={() => run(restoreMember, null)}
        >
          {pending ? "…" : "Restaurer"}
        </button>
      )}

      {view === "current" && (
        <button
          type="button"
          disabled={pending}
          className="btn-ghost"
          onClick={() =>
            run(
              archiveMember,
              "Archiver cette adhérente ?\n\nElle sera retirée des listes courantes mais son historique sera conservé.",
            )
          }
        >
          {pending ? "…" : "Archiver"}
        </button>
      )}

      {view !== "trashed" && (
        <button
          type="button"
          disabled={pending}
          className={secondary}
          onClick={() =>
            run(
              trashMember,
              "Mettre cette adhérente à la corbeille ?\n\nSes données seront conservées et pourront être restaurées.",
            )
          }
        >
          {pending ? "…" : "Mettre à la corbeille"}
        </button>
      )}

      {error && <span className="text-sm text-brand">{error}</span>}
    </div>
  );
}
