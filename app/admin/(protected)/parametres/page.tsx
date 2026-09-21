import { getAdminSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

/**
 * Réglages de l'association.
 *
 * Cette page ne touche QUE la table `settings` : saison, tarifs, coordonnées
 * bancaires, identité du club. Aucune variable d'environnement n'y est lue ni
 * affichée — ni base de données, ni clé de paiement, ni clé d'envoi d'email,
 * ni secret de session. Ces valeurs vivent chez l'hébergeur, jamais dans une
 * page consultable.
 */
export default async function ParametresPage() {
  const settings = await getAdminSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-dark">Paramètres</h1>
        <p className="mt-1 text-brand-dark/70">
          Réglages de l’association. Tout est modifiable depuis cette page.
        </p>
      </header>

      <SettingsForm settings={settings} />

      <p className="text-sm text-brand-dark/60">
        Les clés techniques (base de données, paiement en ligne, envoi d’emails,
        session) sont configurées chez l’hébergeur et ne sont jamais affichées
        ici.
      </p>
    </div>
  );
}
