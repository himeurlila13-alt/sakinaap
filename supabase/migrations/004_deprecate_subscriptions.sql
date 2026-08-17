-- Phase 1 du reset produit : suppression du système de paiement/essai/premium côté app.
-- La table subscriptions n'est plus lue ni écrite par le code (verifyPremiumFromDB supprimée).
-- On la neutralise sans la supprimer : le schéma reste intact si un futur modèle payant
-- devait la réutiliser, mais elle est marquée dormante pour la documentation.

comment on table public.subscriptions is
  'Dormante depuis le reset MVP (gratuit) — plus lue/écrite par l''app. Conservée au cas où un futur modèle payant la réutiliserait.';
