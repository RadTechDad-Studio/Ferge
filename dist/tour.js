export const TOUR_STORAGE_KEY = "ferge-tour-v1";

export function createTour({
  getSteps,
  beforeStart = () => {},
  onFinish = () => {},
  storage = localStorage,
}) {
  let layer = null,
    index = 0,
    previousFocus = null,
    frame = 0,
    wasInert = false;
  const workbench = document.querySelector(".workbench");
  const steps = () => getSteps();
  function position() {
    if (!layer) return;
    const target = document.querySelector(steps()[index].selector);
    const box = layer.querySelector(".tour-popover");
    const spotlight = layer.querySelector(".tour-spotlight");
    const width = window.innerWidth || 1024,
      height = window.innerHeight || 768;
    const r = target?.getBoundingClientRect();
    spotlight.hidden = !r;
    if (r)
      Object.assign(spotlight.style, {
        left: Math.max(4, r.left - 5) + "px",
        top: Math.max(4, r.top - 5) + "px",
        width: Math.max(0, Math.min(width - 8, r.width + 10)) + "px",
        height: Math.max(0, Math.min(height - 8, r.height + 10)) + "px",
      });
    const b = box.getBoundingClientRect(),
      bw = b.width || Math.min(360, width - 24),
      bh = b.height || 235;
    let top = r ? r.bottom + 16 : (height - bh) / 2;
    if (top + bh > height - 12)
      top =
        r && r.top - bh - 16 >= 12
          ? r.top - bh - 16
          : Math.max(12, (height - bh) / 2);
    const left = Math.max(
      12,
      Math.min(
        width - bw - 12,
        r ? r.left + (r.width - bw) / 2 : (width - bw) / 2,
      ),
    );
    Object.assign(box.style, {
      left: left + "px",
      top: Math.max(12, Math.min(height - bh - 12, top)) + "px",
    });
  }
  function schedulePosition() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(position);
  }
  function show(next) {
    const all = steps();
    index = Math.max(0, Math.min(next, all.length - 1));
    const step = all[index];
    layer.querySelector("#tourProgress").textContent =
      `${index + 1} of ${all.length}`;
    layer.querySelector("#tourTitle").textContent = step.title;
    layer.querySelector("#tourDescription").textContent = step.description;
    layer.querySelector("#tourBack").disabled = index === 0;
    layer.querySelector("#tourNext").textContent =
      index === all.length - 1 ? "Finish tour" : "Next";
    layer.querySelector(".tour-dots").innerHTML = all
      .map(
        (_, i) =>
          `<span class="${i === index ? "current" : ""}" aria-hidden="true"></span>`,
      )
      .join("");
    document
      .querySelector(step.selector)
      ?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    position();
    schedulePosition();
    layer.querySelector("#tourNext").focus();
  }
  function finish(reason = "completed") {
    if (!layer) return;
    try {
      storage.setItem(TOUR_STORAGE_KEY, reason);
    } catch {}
    cancelAnimationFrame(frame);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", schedulePosition);
    window.removeEventListener("scroll", schedulePosition, true);
    layer.remove();
    layer = null;
    if (workbench && !wasInert) workbench.removeAttribute("inert");
    const restore =
      previousFocus &&
      previousFocus !== document.body &&
      !previousFocus.closest("dialog:not([open])")
        ? previousFocus
        : document.getElementById("helpButton");
    restore?.focus();
    onFinish(reason);
  }
  function onKey(event) {
    if (!layer) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      finish("skipped");
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "ArrowLeft") show(index - 1);
      else if (index < steps().length - 1) show(index + 1);
      return;
    }
    if (event.key === "Tab") {
      const controls = [...layer.querySelectorAll("button:not(:disabled)")],
        first = controls[0],
        last = controls.at(-1),
        active = document.activeElement;
      if (event.shiftKey && (active === first || !layer.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !layer.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  function start() {
    if (layer) {
      show(0);
      return;
    }
    beforeStart();
    previousFocus = document.activeElement;
    wasInert = workbench?.hasAttribute("inert");
    workbench?.setAttribute("inert", "");
    layer = document.createElement("div");
    layer.className = "tour-layer";
    layer.innerHTML =
      '<div class="tour-backdrop"></div><div class="tour-spotlight" aria-hidden="true"></div><section class="tour-popover" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourDescription"><div class="tour-top"><span>QUICK TOUR <span id="tourProgress"></span></span><button id="tourSkip" type="button">Skip tour</button></div><h2 id="tourTitle"></h2><p id="tourDescription" aria-live="polite"></p><footer><div class="tour-dots" aria-hidden="true"></div><button id="tourBack" type="button">Back</button><button id="tourNext" type="button" class="primary">Next</button></footer></section>';
    document.body.append(layer);
    layer.querySelector("#tourSkip").onclick = () => finish("skipped");
    layer.querySelector("#tourBack").onclick = () => show(index - 1);
    layer.querySelector("#tourNext").onclick = () => {
      if (index === steps().length - 1) finish();
      else show(index + 1);
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);
    show(0);
  }
  function maybeStart() {
    try {
      if (storage.getItem(TOUR_STORAGE_KEY)) return;
    } catch {}
    start();
  }
  return { start, maybeStart, finish, isOpen: () => !!layer };
}
