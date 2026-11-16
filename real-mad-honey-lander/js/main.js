(function () {
  const topbar = document.getElementById("topbar");
  const reveals = document.querySelectorAll(".reveal");

  function onScroll() {
    if (!topbar) return;
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // Hero content should show promptly on load
  const heroReveal = document.querySelector(".hero .reveal");
  if (heroReveal) {
    requestAnimationFrame(() => heroReveal.classList.add("is-visible"));
  }
})();
