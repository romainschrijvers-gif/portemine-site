// Site portemine.fr : la scène d'ouverture et la fenêtre du teaser. Aucune dépendance.

// Le renvoi part de la phrase du mémoire et monte jusqu'à sa source (charte : segments droits, coude de 12 px).
const pose = document.getElementById("pose");

function tracerRenvoi() {
  const svg = document.getElementById("pose-renvoi");
  const phrase = document.getElementById("pose-phrase");
  const source = document.getElementById("pose-source");
  const cadre = pose.getBoundingClientRect();
  const memoire = phrase.closest(".feuille").getBoundingClientRect();
  const ligne = phrase.getClientRects()[0];
  const cible = source.getBoundingClientRect();

  const x0 = memoire.right - cadre.left + 12;
  const y0 = ligne.top + ligne.height / 2 - cadre.top;
  const x1 = cible.left + cible.width / 2 - cadre.left;
  const y1 = cible.bottom - cadre.top;
  const r = Math.max(0, Math.min(12, (x1 - x0) / 2, (y0 - y1) / 2));

  svg.setAttribute("viewBox", `0 0 ${cadre.width} ${cadre.height}`);
  svg.querySelector(".depart").setAttribute("cx", x0);
  svg.querySelector(".depart").setAttribute("cy", y0);
  svg.querySelector(".trait").setAttribute("d", `M${x0} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 - r} V${y1}`);
}

if (pose) {
  const jouer = () => { tracerRenvoi(); pose.classList.add("joue"); };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(jouer));
  let attente;
  window.addEventListener("resize", () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(tracerRenvoi); });
}

// Teaser : lu seulement à l'ouverture, arrêté à la fermeture.
document.querySelectorAll("[data-ouvre]").forEach(bouton => {
  const fenetre = document.getElementById(bouton.dataset.ouvre);
  if (!fenetre || typeof fenetre.showModal !== "function") return;
  const video = fenetre.querySelector("video");
  bouton.addEventListener("click", () => {
    fenetre.showModal();
    video.play().catch(() => {});
  });
  fenetre.querySelector("[data-ferme]").addEventListener("click", () => fenetre.close());
  fenetre.addEventListener("click", e => { if (e.target === fenetre) fenetre.close(); });
  fenetre.addEventListener("close", () => video.pause());
});

// Bandeau des logos : pause et reprise (comme sur le site perso). L'état vit sur <html data-mouvement>.
document.querySelectorAll("[data-bascule-mouvement]").forEach(bouton => {
  const racine = document.documentElement;
  const afficher = () => {
    const enPause = racine.dataset.mouvement === "pause";
    bouton.textContent = enPause ? "Relancer les animations" : "Mettre en pause les animations";
    bouton.setAttribute("aria-pressed", String(enPause));
  };
  bouton.addEventListener("click", () => {
    if (racine.dataset.mouvement === "pause") delete racine.dataset.mouvement;
    else racine.dataset.mouvement = "pause";
    try { localStorage.setItem("mouvement", racine.dataset.mouvement || ""); } catch (e) {}
    afficher();
  });
  afficher();
});
