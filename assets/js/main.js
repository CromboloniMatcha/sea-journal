// Move-in animation: reveal elements when they scroll into view
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('show'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.0 });
  items.forEach(function (el) { io.observe(el); });
})();
// Discover Indonesia: hero video plays on click; the shade, title and button disappear
(function () {
  var hero = document.querySelector('.id-hero');
  if (!hero) return;
  var btn = hero.querySelector('.id-play');
  var box = hero.querySelector('.id-player');
  btn.addEventListener('click', function () {
    var id = hero.getAttribute('data-video');
    box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" title="Discover Indonesia video" allow="autoplay; accelerometer; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    hero.classList.add('is-playing');
  });
})();
