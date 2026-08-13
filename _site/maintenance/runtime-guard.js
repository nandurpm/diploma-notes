/* Purpose: Runtime guard - Descriptive comment added for clarity */
(() => {
  document.addEventListener("click", event => {
    const button = event.target.closest(".activity-area .primary-btn");
    if (!button) return;

    const area = button.closest(".activity-area");
    const input = area?.querySelector("input:not([disabled])");
    const isCheckAction = /^Check (answer|word)$/i.test((button.textContent || "").trim());

    if (input && isCheckAction && !input.value.trim()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const feedback = area.querySelector(".feedback");
      if (feedback) feedback.textContent = "Enter an answer before checking.";
      input.focus();
    }
  }, true);

  const correctVisibleContent = root => {
    const nodes = [];
    if (root instanceof Element && root.matches(".scramble-word")) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll(".scramble-word"));
    nodes.forEach(node => {
      if (node.textContent.trim() === "TENSOR") node.textContent = "SENROS";
    });
  };

  correctVisibleContent(document);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) correctVisibleContent(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
})();
