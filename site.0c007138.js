const racine = document.documentElement;
racine.classList.add("js-pret");
const anime = () => racine.classList.contains("anime");
const observe = "IntersectionObserver" in window;
function quandVisible(el, seuil = 0.3) {
if (!observe) { el.classList.add("vu"); return; }
const o = new IntersectionObserver(entrees => {
if (entrees.some(e => e.isIntersecting)) { o.disconnect(); el.classList.add("vu"); }
}, { threshold: seuil });
o.observe(el);
}
const liens = Array.from(document.querySelectorAll(".etapes a[href^='#']"));
if (liens.length && observe) {
const marquer = id => liens.forEach(a => {
if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "true");
else a.removeAttribute("aria-current");
});
const suivi = new IntersectionObserver(entrees => {
entrees.forEach(e => { if (e.isIntersecting) marquer(e.target.id); });
}, { rootMargin: "-45% 0px -50% 0px" });
["haut", ...liens.map(a => a.getAttribute("href").slice(1)), "appel"]
.map(id => document.getElementById(id)).filter(Boolean).forEach(p => suivi.observe(p));
}
document.querySelectorAll("[data-ecrit]").forEach(el => quandVisible(el, 0.5));
document.querySelectorAll("[data-surligne]").forEach(el => quandVisible(el, 0.5));
document.querySelectorAll("[data-schema], [data-deroule], .appel-grille").forEach(el => quandVisible(el, 0.4));
const recit = document.querySelector("[data-recit]");
if (recit && observe) {
const temps = Array.from(recit.querySelectorAll(".temps"));
const ecran = window.matchMedia("(min-width: 961px) and (min-height: 760px)");
let suivi = null;
const choisir = n => {
recit.dataset.actif = String(n);
temps.forEach((t, i) => {
t.classList.toggle("actif", i + 1 === n);
t.classList.toggle("passe", i + 1 < n);
});
};
const brancher = oui => {
recit.classList.toggle("en-recit", oui);
if (suivi) { suivi.disconnect(); suivi = null; }
if (!oui) {
delete recit.dataset.actif;
temps.forEach(t => t.classList.remove("actif", "passe"));
return;
}
choisir(1);
suivi = new IntersectionObserver(entrees => {
entrees.forEach(e => { if (e.isIntersecting) choisir(Number(e.target.closest(".temps").dataset.temps)); });
}, { rootMargin: "-50% 0px -50% 0px" });
temps.forEach(t => suivi.observe(t.querySelector(".temps-texte")));
};
brancher(ecran.matches);
ecran.addEventListener("change", e => brancher(e.matches));
}
const fenetre = document.getElementById("video");
if (fenetre && typeof fenetre.showModal === "function") {
const video = fenetre.querySelector("video");
const controles = video.controls;
video.controls = false;
let premiere = true;
document.querySelectorAll("[data-ouvre='video']").forEach(lien => {
lien.addEventListener("click", e => {
if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
e.preventDefault();
if (premiere) {
premiere = false;
if (video.dataset.affiche && !video.getAttribute("poster")) video.setAttribute("poster", video.dataset.affiche);
Array.from(video.textTracks).forEach(piste => { if (piste.kind === "captions") piste.mode = "showing"; });
requestAnimationFrame(() => setTimeout(() => { video.controls = controles; }));
}
fenetre.showModal();
video.play().catch(() => {});
});
});
fenetre.querySelector("[data-ferme]").addEventListener("click", () => fenetre.close());
fenetre.addEventListener("click", e => { if (e.target === fenetre) fenetre.close(); });
fenetre.addEventListener("close", () => video.pause());
}
const piste = document.querySelector(".parcours-piste");
const bascule = document.querySelector("[data-bascule-mouvement]");
if (piste && bascule && anime()) {
let enPause = false;
let horsChamp = observe;
try { enPause = localStorage.getItem("mouvement") === "pause"; } catch (e) {   }
const appliquer = () => {
piste.classList.toggle("arrete", enPause || horsChamp);
bascule.setAttribute("aria-pressed", String(enPause));
};
bascule.hidden = false;
bascule.addEventListener("click", () => {
enPause = !enPause;
try { localStorage.setItem("mouvement", enPause ? "pause" : ""); } catch (e) {   }
appliquer();
});
if (observe) {
new IntersectionObserver(entrees => {
horsChamp = !entrees[entrees.length - 1].isIntersecting;
appliquer();
}).observe(piste);
}
appliquer();
}
