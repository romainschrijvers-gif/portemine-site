// Site portemine.fr : traits entre éléments, révélation à l'entrée en vue, fenêtre du teaser, pause du bandeau.
// Aucune dépendance.

const SVG = "http://www.w3.org/2000/svg";
const R = 12; // rayon des coudes (charte : motif renvoi)

// Chemin entre deux rectangles, relatifs au cadre.
// « flux » : de bord à bord, coudé à mi-chemin, horizontal si la cible est à droite, sinon vertical.
// « renvoi » : part de la phrase (pastille à 12 px du bord de sa feuille), file à l'horizontale puis monte
// jusqu'au bas de la puce de source (charte : segments droits, coudes arrondis).
function chemin(de, vers, forme, depart) {
  if (forme === "renvoi") {
    const x0 = depart.x, y0 = depart.y;
    const x1 = vers.left + vers.width / 2, y1 = vers.bottom;
    const r = Math.max(0, Math.min(R, Math.abs(x1 - x0) / 2, Math.abs(y0 - y1) / 2));
    return `M${x0} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 - r} V${y1}`;
  }
  if (vers.left >= de.right - 1) {
    const x0 = de.right, y0 = de.top + de.height / 2, x1 = vers.left, y1 = vers.top + vers.height / 2;
    const xm = (x0 + x1) / 2, dy = y1 - y0, s = Math.sign(dy);
    const r = Math.min(R, Math.abs(dy) / 2, (x1 - x0) / 2);
    if (Math.abs(dy) < 1) return `M${x0} ${y0} H${x1}`;
    return `M${x0} ${y0} H${xm - r} Q${xm} ${y0} ${xm} ${y0 + s * r} V${y1 - s * r} Q${xm} ${y1} ${xm + r} ${y1} H${x1}`;
  }
  const x0 = de.left + de.width / 2, y0 = de.bottom, x1 = vers.left + vers.width / 2, y1 = vers.top;
  const ym = (y0 + y1) / 2, dx = x1 - x0, s = Math.sign(dx);
  const r = Math.min(R, Math.abs(dx) / 2, (y1 - y0) / 2);
  if (Math.abs(dx) < 1) return `M${x0} ${y0} V${y1}`;
  return `M${x0} ${y0} V${ym - r} Q${x0} ${ym} ${x0 + s * r} ${ym} H${x1 - s * r} Q${x1} ${ym} ${x1} ${ym + r} V${y1}`;
}

function relier(schema) {
  const cadre = schema.getBoundingClientRect();
  const local = r => ({ left: r.left - cadre.left, right: r.right - cadre.left, top: r.top - cadre.top, bottom: r.bottom - cadre.top, width: r.width, height: r.height });
  schema.querySelectorAll("svg.liens").forEach(svg => {
    svg.setAttribute("viewBox", `0 0 ${cadre.width} ${cadre.height}`);
    svg.querySelectorAll("path[data-de]").forEach(p => {
      const de = document.getElementById(p.dataset.de), vers = document.getElementById(p.dataset.vers);
      if (!de || !vers) return;
      const forme = p.dataset.forme || "flux";
      let depart = null;
      if (forme === "renvoi") {
        const feuille = local((de.closest(".feuille") || de).getBoundingClientRect());
        const ligne = local(de.getClientRects()[0]);
        depart = { x: feuille.right + 12, y: ligne.top + ligne.height / 2 };
        let pastille = p.previousElementSibling;
        if (!pastille || pastille.tagName !== "circle") {
          pastille = document.createElementNS(SVG, "circle");
          pastille.setAttribute("r", "4");
          pastille.setAttribute("class", "pastille");
          svg.insertBefore(pastille, p);
        }
        pastille.setAttribute("cx", depart.x);
        pastille.setAttribute("cy", depart.y);
      }
      const d = chemin(local(de.getBoundingClientRect()), local(vers.getBoundingClientRect()), forme, depart);
      p.setAttribute("d", d);
      if (p.dataset.parcourt !== undefined) parcourir(svg, p, d);
    });
  });
}

// Un point qui parcourt le trait, en boucle lente (bande « Vos données ») ; arrêté par le bouton de pause.
function parcourir(svg, p, d) {
  let point = svg.querySelector(`circle[data-sur="${p.dataset.de}"]`);
  if (!point) {
    point = document.createElementNS(SVG, "circle");
    point.setAttribute("r", "3.5");
    point.setAttribute("class", "voyageur");
    point.dataset.sur = p.dataset.de;
    point.style.animationDelay = `${(Array.from(svg.querySelectorAll("path")).indexOf(p)) * 1.6}s`;
    svg.appendChild(point);
  }
  point.style.offsetPath = `path("${d}")`;
}

const schemas = Array.from(document.querySelectorAll("[data-schema]"));
function relierTout() { schemas.forEach(relier); }
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(relierTout));
let attente;
window.addEventListener("resize", () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(relierTout); });

// Révélation : une seule fois, quand l'élément entre à l'écran.
const aReveler = document.querySelectorAll("[data-revele]");
if ("IntersectionObserver" in window && document.documentElement.classList.contains("anime")) {
  const observateur = new IntersectionObserver(entrees => {
    entrees.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("vu");
      observateur.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
  aReveler.forEach(el => observateur.observe(el));
} else {
  aReveler.forEach(el => el.classList.add("vu"));
}

// Les boucles (bandeau des logos, trajet des données) s'arrêtent quand elles sont hors de l'écran.
if ("IntersectionObserver" in window) {
  const boucles = new IntersectionObserver(entrees => {
    entrees.forEach(e => e.target.classList.toggle("hors-champ", !e.isIntersecting));
  });
  document.querySelectorAll(".parcours, .souverainete").forEach(el => boucles.observe(el));
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

// Pause des animations en boucle (bandeau des logos, trajet des données). L'état vit sur <html data-mouvement>.
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
