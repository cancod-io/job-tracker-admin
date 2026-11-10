(() => {
  const sticky = document.getElementById("sticky-cta");
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".origin__video");

  // Sticky CTA after hero leaves viewport
  if (sticky && hero && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        const show = !entry.isIntersecting;
        sticky.hidden = !show;
        sticky.classList.toggle("is-visible", show);
      },
      { threshold: 0.08 }
    );
    io.observe(hero);
  }

  // Scroll reveals for major sections
  const revealTargets = document.querySelectorAll(
    ".section h2, .origin__grid article, .steps li, .trust__row, .experience__list li"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => revealIo.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  }

  // Autoplay muted harvest video when in view (respect reduced motion)
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (video && !prefersReduced && "IntersectionObserver" in window) {
    const vidIo = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    vidIo.observe(video);
  }

  // Only one FAQ open at a time on small screens for clarity
  const faqs = document.querySelectorAll(".faq__list details");
  faqs.forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      faqs.forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });
})();
