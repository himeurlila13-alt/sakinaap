# SakinApp — Contexte Global du Projet

## Identité du Projet

**SakinApp** est une Progressive Web App (PWA) de bien-être féminin islamique.
URL de production : https://sakinaap.com
Contact éditrice : sakina.evolution.contact@gmail.com
Éditrice : Lila Himeur

## Mission

**Persona unique** (positionnement validé, juillet 2026) : la femme musulmane qui veut
vivre ses prières, son dhikr et sa lecture du Coran avec régularité, se rapprocher
d'Allah, tout en suivant et comprenant son cycle.

Deux piliers réels :
- Sa vie spirituelle (prières, dhikr, Coran, 99 noms d'Allah)
- Le suivi de son cycle menstruel (4 phases : Hiver, Printemps, Été, Automne), avec
  les réalités islamiques du cycle (haidh, nifas, ghusl, pureté)

Alimentation et activité physique restent en tips contextuels ponctuels selon la
phase et l'humeur déclarées (pas de programme structuré, pas de recettes ni de
séances guidées — un coaching sport individualisé existe en offre téléphone séparée,
hors app). SakinApp n'est pas une app "bien-être holistique" multi-persona générique :
toute proposition qui s'adresse à un profil sport/nutrition/développement personnel
non-spirituel s'écarte du positionnement.

## Stack Technique

- **Frontend** : PWA — HTML5, CSS3, JavaScript Vanilla (pas de framework)
- **Backend** : Supabase — authentification par lien magique uniquement. Depuis le
  reset produit (août 2026), les données applicatives (cycle, prières, symptômes,
  objectifs, réglages) ne sont plus synchronisées côté serveur : le téléphone
  (localStorage) est l'unique source de vérité. Export/import manuel = seule sauvegarde.
- **Hébergement** : domaine sakinaap.com
- **Hors-ligne** : Service Worker + localStorage pour fonctionnement partiel sans connexion
- **Conformité** : RGPD — données de santé (cycle menstruel = données sensibles Art. 9 RGPD)

## Structure de l'App (Onglets)

1. **Accueil** — Dashboard personnalisé selon la phase du jour
2. **Cycle** — Roue des saisons, suivi des jours, journal
3. **Âme** — Noms d'Allah, dhikr, prières, Coran, livret islamique
4. **Objectifs** — Suivi des habitudes
5. **Moi** — Profil, paramètres, export/import des données

## Les 4 Phases du Cycle

| Phase | Saison | Emoji | Énergie |
|-------|--------|-------|---------|
| Menstruelle | Hiver | 🌙 | Repos, régénération, douceur |
| Folliculaire | Printemps | 🌿 | Renouveau, énergie croissante |
| Ovulatoire | Été | ☀️ | Pic d'énergie, sociabilité, force |
| Lutéale | Automne | 🍂 | Introspection, ralentissement |

## Valeurs de la Marque

- **Douceur** — jamais de culpabilité, toujours de la bienveillance
- **Spiritualité** — la foi comme force, pas comme contrainte
- **Empowerment** — la femme comprend et maîtrise son cycle
- **Globalité** — corps, âme et esprit sont liés
- **Accessibilité** — app gratuite pour toutes les sœurs, sans exception

## Ton Éditorial

- Tutoiement systématique ("tu", "ton", "ta")
- Chaleureux, intime, comme une amie bienveillante
- Formules d'accueil islamiques naturellement intégrées (As-salamu alaykum)
- Jamais médical, jamais froid, jamais culpabilisant
- Phrases courtes, aérées, émotionnelles

## Offres

**Aucun tier premium.** Décision produit (août 2026) : SakinApp n'a plus de modèle
freemium. Tout le contenu — suivi prières/dhikr/Coran, cycle, historique, duas
personnalisées, objectifs spirituels par phase, skincare, archive de lectures —
reste gratuit et débloqué pour toutes les utilisatrices, sans exception ni horizon
de réintroduction. Ne jamais proposer ou implémenter de logique de paywall, de
gating, d'écran d'upgrade, ni de mention "Premium" dans l'UI ou la copy, même à
titre de suggestion future.

## Conformité Légale

- Données de cycle = données de santé → Article 9 RGPD
- Aucun tracking publicitaire
- Stockage : localStorage sur l'appareil uniquement pour les données de cycle,
  prières, symptômes, objectifs et réglages. Supabase ne stocke que le compte
  d'authentification (e-mail) — aucune donnée de santé ou de pratique religieuse
  n'y transite depuis le reset produit (août 2026)
- Aucun paiement dans l'app — pas de données bancaires, pas de droit de
  rétractation applicable
- Juridiction : France / CNIL

## Règles Absolues pour Tous les Agents

1. Ne jamais formuler de conseil médical direct ("consulte ton médecin" si sujet sensible)
2. Ne jamais culpabiliser l'utilisatrice
3. Toujours respecter le ton bienveillant de la marque
4. Les données de santé sont sacrées — aucune fuite, aucun partage
5. Toute affirmation religieuse doit être sourcée ou signalée comme "à vérifier"