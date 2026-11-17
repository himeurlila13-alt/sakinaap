// Referme le menu du téléphone quand on choisit un lien ou qu'on appuie sur Échap.
document.querySelectorAll('.menu-tel').forEach(function (menu) {
  menu.querySelectorAll('a').forEach(function (lien) {
    lien.addEventListener('click', function () { menu.open = false; });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu.open = false; });
});
