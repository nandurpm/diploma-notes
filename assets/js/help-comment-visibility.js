/* Purpose: Help comment visibility - Descriptive comment added for clarity */
(() => {
  "use strict";

  const list = document.getElementById("commentsList");
  const countBox = document.getElementById("commentCount");
  if (!list || !countBox) return;

  const refresh = () => {
    let hiddenThread = false;

    [...list.children].forEach((item) => {
      const isCard = item.classList.contains("comment-card");
      const isReply = item.classList.contains("reply-card");

      if (isCard && !isReply) {
        hiddenThread = item.classList.contains("deleted-comment");
        item.hidden = hiddenThread;
        return;
      }

      if (isReply) {
        item.hidden = hiddenThread || item.classList.contains("deleted-comment");
        return;
      }

      hiddenThread = false;
    });

    const visibleCount = [...list.querySelectorAll(":scope > .comment-card:not(.reply-card)")]
      .filter((item) => !item.hidden)
      .length;
    const hasMore = Boolean(list.querySelector(".load-older-comments"));
    countBox.textContent = `${visibleCount}${hasMore ? "+" : ""} loaded ${visibleCount === 1 ? "comment" : "comments"}`;
  };

  new MutationObserver(refresh).observe(list, {
    childList: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  refresh();
})();