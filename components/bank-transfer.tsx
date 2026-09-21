import { CopyButton } from "@/components/copy-button";
import { formatEuros } from "@/lib/constants";
import type { BankDetails } from "@/lib/settings";

/**
 * Informations de virement.
 *
 * Deux exigences pratiques gouvernent ce bloc :
 *
 * 1. Le montant affiché est TOUJOURS ce qu'il reste réellement à verser —
 *    l'échéance en cours d'abord, le solde ensuite. Jamais le tarif général,
 *    jamais un montant déjà réglé.
 *
 * 2. Un IBAN se recopie mal sur un téléphone. Les deux valeurs que la famille
 *    doit reporter dans son application bancaire — l'IBAN et la référence —
 *    ont donc leur bouton de copie. Sans la référence, le bureau ne peut pas
 *    rattacher le virement à l'inscription.
 */
export function BankTransferDetails({
  memberNumber,
  amountCents,
  remainingCents,
  installments,
  bank,
}: {
  memberNumber: string;
  /** Ce qu'il faut virer maintenant : l'échéance en cours. */
  amountCents: number;
  /** Ce qu'il reste dû au total, échéances suivantes comprises. */
  remainingCents: number;
  installments: number;
  bank: BankDetails;
}) {
  const hasMoreLater = remainingCents > amountCents;

  return (
    <div className="rounded-2xl border-2 border-brand-light/50 bg-white p-5">
      <h3 className="font-bold text-brand-dark">Paiement par virement</h3>

      <p className="mt-2 text-brand-dark/80">
        Montant à virer :{" "}
        <strong className="text-lg text-brand-dark">{formatEuros(amountCents)}</strong>
      </p>
      {hasMoreLater && (
        <p className="mt-1 text-sm text-brand-dark/60">
          {installments > 1
            ? `Échéance en cours. Il restera ensuite ${formatEuros(
                remainingCents - amountCents,
              )} à régler.`
            : `Reste à régler au total : ${formatEuros(remainingCents)}.`}
        </p>
      )}

      <div className="mt-4 rounded-xl bg-brand-light/20 px-4 py-3">
        <p className="text-sm text-brand-dark/70">
          Référence à indiquer obligatoirement dans le libellé
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="font-mono text-lg font-bold text-brand-dark">{memberNumber}</p>
          <CopyButton value={memberNumber} label="Copier la référence" />
        </div>
      </div>

      {bank.iban ? (
        <dl className="mt-4 space-y-3 text-sm">
          {bank.holder && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-brand-dark/60">Bénéficiaire</dt>
              <dd className="font-medium text-brand-dark">{bank.holder}</dd>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-brand-dark/60">IBAN</dt>
            <dd className="font-mono font-medium text-brand-dark">{bank.iban}</dd>
            <CopyButton value={bank.iban} label="Copier l’IBAN" />
          </div>
          {bank.bic && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-brand-dark/60">BIC</dt>
              <dd className="font-mono font-medium text-brand-dark">{bank.bic}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-brand-dark/70">
          Les coordonnées bancaires vous seront communiquées par le bureau.
        </p>
      )}

      <p className="mt-4 text-sm text-brand-dark/60">
        Sans cette référence, le bureau ne peut pas rattacher votre virement à
        l’inscription.
      </p>
    </div>
  );
}
