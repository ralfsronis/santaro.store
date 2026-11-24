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
