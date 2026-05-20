# SakinApp — Contexte Global du Projet

## Identité du Projet

**SakinApp** est une Progressive Web App (PWA) de bien-être féminin islamique.
URL de production : https://sakinaap.com
Contact éditrice : sakina.evolution.contact@gmail.com
Éditrice : Lila Himeur

## Mission

Accompagner la femme musulmane dans son bien-être holistique en reliant :
- Le suivi de son cycle menstruel (4 phases : Hiver, Printemps, Été, Automne)
- Sa vie spirituelle (prières, dhikr, Coran, 99 noms d'Allah)
- Son alimentation adaptée à chaque phase
- Son activité physique adaptée à chaque phase
- Sa gestion émotionnelle quotidienne
- Les réalités islamiques du cycle (haidh, nifas, ghusl, pureté)

## Stack Technique

- **Frontend** : PWA — HTML5, CSS3, JavaScript Vanilla (pas de framework)
- **Backend** : Supabase (authentification par lien magique, base de données PostgreSQL, stockage)
- **Paiement** : Stripe (abonnement mensuel 3,99€ / annuel 34,99€)
- **Hébergement** : domaine sakinaap.com
- **Hors-ligne** : Service Worker + localStorage pour fonctionnement partiel sans connexion
- **Conformité** : RGPD — données de santé (cycle menstruel = données sensibles Art. 9 RGPD)

## Structure de l'App (Onglets)

1. **Accueil** — Dashboard personnalisé selon la phase du jour
2. **Cycle** — Roue des saisons, suivi des jours, journal
3. **Âme** — Noms d'Allah, dhikr, prières, Coran, livret islamique
4. **Objectifs** — Suivi des habitudes
5. **Moi** — Profil, paramètres, abonnement

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
- **Accessibilité** — app abordable pour toutes les sœurs (prix bas assumé)

## Ton Éditorial

- Tutoiement systématique ("tu", "ton", "ta")
- Chaleureux, intime, comme une amie bienveillante
- Formules d'accueil islamiques naturellement intégrées (As-salamu alaykum)
- Jamais médical, jamais froid, jamais culpabilisant
- Phrases courtes, aérées, émotionnelles

## Offres

- **Gratuit** : Suivi cycle, prières, dhikr, 99 noms d'Allah, haidh/nifas/ghusl
- **Essai** : 20 jours tout inclus, sans carte bancaire
- **Premium mensuel** : 3,99€/mois
- **Premium annuel** : 34,99€/an (économie 27%)

## Conformité Légale

- Données de cycle = données de santé → Article 9 RGPD
- Aucun tracking publicitaire
- Stockage : localStorage + Supabase chiffré
- Paiements : Stripe (aucune donnée bancaire stockée par SakinApp)
- Droit de rétractation : 14 jours
- Juridiction : France / CNIL

## Règles Absolues pour Tous les Agents

1. Ne jamais formuler de conseil médical direct ("consulte ton médecin" si sujet sensible)
2. Ne jamais culpabiliser l'utilisatrice
3. Toujours respecter le ton bienveillant de la marque
4. Les données de santé sont sacrées — aucune fuite, aucun partage
5. Toute affirmation religieuse doit être sourcée ou signalée comme "à vérifier"