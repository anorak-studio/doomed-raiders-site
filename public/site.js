// Doomed Raiders — petits comportements du site.
(function () {
  // Année du pied de page
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Parallaxe : chaque image [data-parallax] glisse plus lentement que la page.
  // L'image dépasse de 12 % en haut et en bas de son cadre (voir .px-img dans styles.css).
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  // Position cible de chaque image, entre -1 (cadre qui arrive par le bas) et +1 (cadre qui sort par le haut).
  var progressFor = function (frameTop, frameHeight, viewTop, vh) {
    var center = frameTop - viewTop + frameHeight / 2;
    var p = (vh / 2 - center) / (vh / 2 + frameHeight / 2);
    return Math.max(-1, Math.min(1, p));
  };
  var shiftFor = function (img, frameHeight, progress) {
    return progress * frameHeight * 0.12 * (parseFloat(img.dataset.parallax) || 1);
  };
  var apply = function (img, px) { img.style.transform = "translate3d(0," + px.toFixed(2) + "px,0)"; };

  // Mode normal (le vrai site) : la page défile elle-même. L'image suit le défilement image par image.
  var scrollMode = function () {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        apply(img, shiftFor(img, r.height, progressFor(r.top, r.height, 0, vh)));
      });
    };
    var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("load", request);
    update();
  };

  // Mode intégré (aperçu dans un cadre qui ne défile pas lui-même) :
  // des repères invisibles tous les 12 px indiquent quelle partie de la page est à l'écran,
  // puis chaque image glisse en douceur vers sa position.
  var framedMode = function () {
    var STEP = 12, marks = null, io = null, visible = {}, viewTop = 0, vh = window.innerHeight;
    var cur = layers.map(function () { return 0; });
    var running = false;
    var build = function () {
      if (io) io.disconnect();
      if (marks) marks.remove();
      visible = {};
      var h = document.documentElement.scrollHeight;
      marks = document.createElement("div");
      marks.setAttribute("aria-hidden", "true");
      marks.style.cssText = "position:absolute;left:0;top:0;width:1px;height:" + h + "px;pointer-events:none;opacity:0;";
      var html = "";
      for (var y = 0; y < h; y += STEP) html += '<i style="position:absolute;left:0;top:' + y + 'px;width:1px;height:1px" data-y="' + y + '"></i>';
      marks.innerHTML = html;
      document.body.appendChild(marks);
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var y = +e.target.dataset.y;
          if (e.isIntersecting) visible[y] = 1; else delete visible[y];
        });
        var ys = Object.keys(visible).map(Number);
        if (ys.length) {
          viewTop = Math.min.apply(null, ys);
          vh = Math.max.apply(null, ys) + STEP - viewTop;
        }
        start();
      });
      Array.prototype.forEach.call(marks.children, function (m) { io.observe(m); });
    };
    var tick = function () {
      var moving = false;
      layers.forEach(function (img, i) {
        var r = img.parentElement.getBoundingClientRect();
        var top = r.top + window.scrollY;
        var target = shiftFor(img, r.height, progressFor(top, r.height, viewTop, vh));
        cur[i] += (target - cur[i]) * 0.14;
        if (Math.abs(target - cur[i]) > 0.1) moving = true; else cur[i] = target;
        apply(img, cur[i]);
      });
      if (moving) requestAnimationFrame(tick); else running = false;
    };
    var start = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    build();
    window.addEventListener("load", build);
    window.addEventListener("resize", build);
  };

  if (!reduce && layers.length) {
    var pageScrolls = document.documentElement.scrollHeight > window.innerHeight + 80;
    if (pageScrolls) scrollMode();
    else if ("IntersectionObserver" in window) framedMode();
  }

  // Carrousel des biomes : rotation automatique dans le dernier sens choisi,
  // flèches, noms cliquables, clavier (← →) et glissement du doigt.
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".car-slide"));
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".car-tab"));
    var bar = root.querySelector(".car-progress i");
    var interval = parseInt(root.dataset.interval, 10) || 6000;
    var index = 0, dir = 1, timer = null, paused = false;
    root.style.setProperty("--car-dur", interval + "ms");

    var restartBar = function () {
      if (!bar || reduce) return;
      bar.classList.remove("run");
      void bar.offsetWidth; // relance l'animation
      bar.classList.add("run");
    };
    var go = function (next, from) {
      next = (next + slides.length) % slides.length;
      if (next === index) return;
      var old = slides[index];
      root.style.setProperty("--from", from || 1);
      old.classList.remove("is-active");
      old.classList.add("is-leaving");
      old.setAttribute("aria-hidden", "true");
      setTimeout(function () { old.classList.remove("is-leaving"); }, 900);
      slides[next].classList.add("is-active");
      slides[next].removeAttribute("aria-hidden");
      tabs.forEach(function (t, i) {
        t.classList.toggle("is-active", i === next);
        if (i === next) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
      });
      index = next;
      schedule();
    };
    var schedule = function () {
      clearTimeout(timer);
      if (reduce) return;
      restartBar();
      if (paused) return;
      timer = setTimeout(function () { go(index + dir, dir); }, interval);
    };
    var pause = function () { paused = true; clearTimeout(timer); root.classList.add("is-paused"); };
    var resume = function () {
      if (!paused) return;
      paused = false; root.classList.remove("is-paused");
      // reprend avec un cycle complet pour garder la barre et le minuteur alignés
      schedule();
    };

    root.querySelectorAll(".car-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        dir = parseInt(btn.dataset.dir, 10) || 1;
        go(index + dir, dir);
      });
    });
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var i = parseInt(tab.dataset.slide, 10);
        go(i, i < index ? -1 : 1);
      });
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { dir = -1; go(index - 1, -1); }
      if (e.key === "ArrowRight") { dir = 1; go(index + 1, 1); }
    });
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) resume(); });
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : resume(); });

    var startX = null;
    var stage = root.querySelector(".car-stage");
    stage.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 40) { dir = dx < 0 ? 1 : -1; go(index + dir, dir); }
    });

    schedule();
  });

  // Rangée de vidéos : les flèches font défiler d'environ une largeur d'écran.
  document.querySelectorAll("[data-shorts-track]").forEach(function (track) {
    var section = track.closest("section");
    var buttons = Array.prototype.slice.call(section.querySelectorAll("[data-shorts]"));
    var update = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      buttons.forEach(function (b) {
        b.disabled = b.dataset.shorts === "-1" ? track.scrollLeft <= 2 : track.scrollLeft >= max;
      });
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var card = track.querySelector(".short");
        var step = card ? card.getBoundingClientRect().width + 20 : 260;
        var n = Math.max(1, Math.floor(track.clientWidth / step) - 1);
        track.scrollBy({ left: parseInt(b.dataset.shorts, 10) * step * n, behavior: reduce ? "auto" : "smooth" });
      });
    });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    update();
  });

  // Fungus Forest (section cachée) : si on l'ouvre par le menu, on s'assure d'y défiler une fois affichée.
  var showHashTarget = function () {
    if (location.hash !== "#fungus-forest") return;
    var el = document.getElementById("fungus-forest");
    if (el) requestAnimationFrame(function () { el.scrollIntoView({ behavior: "auto", block: "start" }); });
  };
  window.addEventListener("hashchange", showHashTarget);
  showHashTarget();

  // Vidéo YouTube : on affiche une image, et le lecteur ne se charge qu'au clic.
  // Sur les domaines qui n'autorisent pas l'intégration (aperçus), le lien ouvre YouTube.
  var host = location.hostname;
  var canEmbed =
    /(^|\.)doomedraiders\.com$/.test(host) ||
    /\.workers\.dev$/.test(host) ||
    host === "localhost" ||
    host === "127.0.0.1";

  document.querySelectorAll("a[data-youtube]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (!canEmbed) return;
      event.preventDefault();
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + link.dataset.youtube + "?autoplay=1&rel=0";
      iframe.title = link.dataset.title || "YouTube";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      link.replaceChildren(iframe);
      link.removeAttribute("href");
    });
  });
})();
