// Mobile sticky WhatsApp button: shown only after the hero button has been
// scrolled past, hidden again while the contacts section or footer is visible
// so it never sits on top of the address, directions or phone links.
(function () {
  var bar = document.getElementById("sticky-cta");
  var heroCta = document.getElementById("hero-cta");
  if (!bar || !heroCta || !("IntersectionObserver" in window)) return;

  var pastHero = false;
  var contactsInView = false;

  function update() {
    var show = pastHero && !contactsInView;
    bar.dataset.visible = show ? "true" : "false";
    if (show) bar.removeAttribute("inert");
    else bar.setAttribute("inert", "");
  }

  new IntersectionObserver(function (entries) {
    var e = entries[0];
    pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
    update();
  }).observe(heroCta);

  var guarded = document.querySelectorAll("#kontakti, .site-footer");
  var visible = new Set();
  var guardObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    });
    contactsInView = visible.size > 0;
    update();
  });
  guarded.forEach(function (el) { guardObserver.observe(el); });
})();

// Before/after: tap or click the photo to wipe in the result, again to go back.
// The first time a photo comes into view it peeks at the result once, so people
// see that it can be tapped. Skipped when the viewer prefers reduced motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-reveal]").forEach(function (box) {
    var btn = box.querySelector(".reveal__btn");
    var label = btn.querySelector(".reveal__hint span");
    var after = box.querySelector(".reveal__layer--after");
    var peekAnim = null;

    // The hidden "after" photo is clipped away, so the browser's lazy loading
    // never sees it. Start loading it as the photo approaches the screen.
    var afterImg = after.querySelector("img");
    if (afterImg && afterImg.loading === "lazy") {
      if ("IntersectionObserver" in window) {
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

    if (reduce || !after.animate || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
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
    io.observe(box);
  });
})();
