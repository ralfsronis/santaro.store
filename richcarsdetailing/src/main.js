(function () {
  var io = "IntersectionObserver" in window;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Desktop header gets a hairline once the page scrolls under it.
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.dataset.scrolled = window.scrollY > 8 ? "true" : "false"; };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Message builder: pick a service, type the car, see the exact message, send it in WhatsApp.
  // The number lives in site.config.json and reaches the page through data-wa.
  var form = document.getElementById("builder");
  if (form) {
    var number = form.getAttribute("data-wa");
    var car = document.getElementById("car");
    var carLabel = document.getElementById("car-label");
    var preview = document.getElementById("msg-preview");
    var bubble = preview.parentNode;
    var send = document.getElementById("builder-send");
    var radios = form.querySelectorAll('input[name="service"]');
    var build = function (flash) {
      var chosen = form.querySelector('input[name="service"]:checked') || radios[0];
      carLabel.textContent = chosen.getAttribute("data-ask");
      car.placeholder = chosen.getAttribute("data-ph");
      var value = car.value.trim();
      var text = chosen.getAttribute("data-msg").replace("____", value || "____");
      preview.textContent = text;
      send.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
      if (flash && !reduce) {
        bubble.classList.remove("is-updated");
        void bubble.offsetWidth;
        bubble.classList.add("is-updated");
      }
    };
    radios.forEach(function (r) { r.addEventListener("change", function () { build(true); }); });
    car.addEventListener("input", function () { build(false); });
    form.addEventListener("submit", function (e) { e.preventDefault(); send.click(); });
    build(false);
  }

  // Before/after: tap or click to wipe in the result, again to go back.
  // The first time a photo comes into view it peeks at the result once.
  document.querySelectorAll("[data-reveal]").forEach(function (box) {
    var btn = box.querySelector(".reveal__btn");
    var label = btn.querySelector(".reveal__hint span");
    var after = box.querySelector(".reveal__layer--after");
    var peekAnim = null;

    // The clipped "after" photo is invisible to lazy loading; load it as the box approaches.
    var afterImg = after.querySelector("img");
    if (afterImg && afterImg.loading === "lazy") {
      if (io) {
        var pre = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          pre.disconnect();
          afterImg.loading = "eager";
        }, { rootMargin: "400px 0px" });
        pre.observe(box);
      } else {
        afterImg.loading = "eager";
      }
    }

    btn.addEventListener("click", function () {
      if (peekAnim) { peekAnim.cancel(); peekAnim = null; }
      var showAfter = box.dataset.state !== "after";
      box.dataset.state = showAfter ? "after" : "before";
      label.textContent = showAfter ? "Rādīt, kā bija" : "Rādīt rezultātu";
    });

    if (reduce || !after.animate || !io) return;
    var peekObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      peekObserver.disconnect();
      if (box.dataset.state === "after") return;
      peekAnim = after.animate(
        [
          { clipPath: "inset(0 100% 0 0)", easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          { clipPath: "inset(0 58% 0 0)", offset: 0.4 },
          { clipPath: "inset(0 58% 0 0)", offset: 0.62, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
          { clipPath: "inset(0 100% 0 0)" }
        ],
        { duration: 1500, delay: 600 }
      );
      peekAnim.onfinish = function () { peekAnim = null; };
    }, { threshold: 0.6 });
    peekObserver.observe(box);
  });

  // Phone: compact WhatsApp bar after the hero button scrolls away,
  // hidden over the message builder (it has its own send button) and over contacts and footer.
  var bar = document.getElementById("sticky-cta");
  var heroCta = document.getElementById("hero-cta");
  if (bar && heroCta && io) {
    var pastHero = false, guarded = new Set();
    var update = function () {
      var show = pastHero && guarded.size === 0;
      bar.dataset.visible = show ? "true" : "false";
      if (show) bar.removeAttribute("inert"); else bar.setAttribute("inert", "");
    };
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(heroCta);
    var g = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) guarded.add(e.target); else guarded.delete(e.target); });
      update();
    });
    document.querySelectorAll("#pakalpojumi, #kontakti, .site-footer").forEach(function (el) { g.observe(el); });
  }
})();
