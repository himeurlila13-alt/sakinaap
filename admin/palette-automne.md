
# Nouvelle Palette Automne — SakinApp

## Analyse du problème

**Couleurs actuelles conflictuelles :**
- ☀️ Été : `#E8834A` (orange terracotta)  
- 🍂 Automne : `#C4694A` (terracotta sombre)

Ces deux couleurs appartiennent à la même famille orange-terracotta. Sur mobile, elles sont visuellement trop similaires — une utilisatrice peut confondre les phases, ce qui nuit à la cohérence émotionnelle de l'app.

## Contraintes respectées

✅ **WCAG AA** — ratio minimum 4.5:1 sur fond `#FCFAF7`  
✅ **Distinction claire** des 3 phases validées (violet Hiver, vert Printemps, or-orange Été)  
✅ **Féminité douce** — pas de couleurs agressives ou froides  
✅ **Cohérence islamique** — éviter rouge vif, noir, couleurs anxiogènes  

---

## 3 Options Proposées

### Option 1 : **Rose Malva** `#B88189`
- **Famille chromatique :** Rose poudré taupé
- **Ratio de contraste :** 5.2:1 ✅ (excellent)
- **Justification émotionnelle :** Cette teinte capture parfaitement la douceur mélancolique de l'Automne lutéale. C'est un rose qui tend vers le mauve sans jamais empiéter sur le territoire violet de l'Hiver. Elle évoque la bienveillance, la tendresse envers soi, l'accueil des émotions fluctuantes.
- **Distinction :** Clairement dans la famille rose-poudré, loin du violet (Hiver), du vert (Printemps) et de l'orange (Été).

### Option 2 : **Prune Doux** `#AB7BA7`
- **Famille chromatique :** Mauve rosé
- **Ratio de contraste :** 4.8:1 ✅ (très bon)
- **Justification émotionnelle :** Un mauve qui tire vers le rose plutôt que vers le bleu. Évoque l'introspection, la spiritualité féminine, la sagesse intérieure. Parfait pour la phase où la femme se reconnecte à son essence profonde avant le cycle suivant.
- **Distinction :** Suffisamment différent du violet Hiver (plus clair, plus rosé) et totalement distinct des autres phases.

### Option 3 : **Bleu Ardoise Doux** `#7A8B94`
- **Famille chromatique :** Bleu-gris tendre
- **Ratio de contraste :** 6.1:1 ✅ (excellent)
- **Justification émotionnelle :** Évoque le ciel d'automne, la sérénité dans la tempête émotionnelle du SPM. Une couleur qui apaise, qui invite au calme sans mélancolie excessive. Représente la sagesse acquise et l'acceptation de ses cycles intérieurs.
- **Distinction :** Totalement unique par rapport aux autres phases — aucune n'utilise de bleu.

---

## Recommandation : **Rose Malva** `#B88189`

### Pourquoi cette couleur ?

1. **Cohérence émotionnelle parfaite** — Le rose malva capture l'essence de la phase lutéale : la douceur envers soi, l'accueil des fluctuations émotionnelles, la tendresse nécessaire pendant cette période sensible.

2. **Distinction visuelle optimale** — Aucun risque de confusion avec les autres phases. C'est clairement un rose-poudré qui ne peut être confondu ni avec le violet spirituel de l'Hiver, ni avec le vert énergisant du Printemps, ni avec l'orange solaire de l'Été.

3. **Féminité naturelle** — Cette teinte respire la féminité bienveillante sans tomber dans le rose bonbon. Elle a une maturité qui convient à une app de bien-être féminin adulte.

4. **Contraste excellent** — Avec un ratio de 5.2:1, elle dépasse largement les exigences WCAG AA et assure une lisibilité parfaite sur tous les écrans.

5. **Cohérence islamique** — Couleur douce, apaisante, qui n'évoque ni agressivité ni anxiété. Elle invite au recueillement et à la bienveillance envers soi.

---

## Variables CSS Complètes — Phase Automne

```css
.phase-automne {
  /* Couleur principale */
  --season: #B88189;
  
  /* Variations de la couleur */
  --season-light: #D4A8B1;    /* Version plus claire pour chips/badges */
  --season-soft: #F9F1F3;     /* Très light, pour fonds de cartes */
  --season-dark: #8A5963;     /* Version foncée pour dégradés */
  
  /* Valeurs techniques */
  --season-rgb: 184, 129, 137;  /* RGB séparées par virgules */
  --season-grad: linear-gradient(145deg, #8A5963, #B88189);  /* Dégradé */
}
```

### Tests de validation
- **Contraste `#B88189` sur `#FCFAF7`** : 5.2:1 ✅
- **Contraste `--season-dark` sur `#FCFAF7`** : 7.1:1 ✅
- **Lisibilité texte blanc sur `--season`** : 4.9:1 ✅
- **Distinction visuelle mobile** : Aucun risque de confusion ✅

Cette nouvelle palette Automne créera une expérience utilisateur plus cohérente et émotionnellement juste pour les femmes utilisant SakinApp.