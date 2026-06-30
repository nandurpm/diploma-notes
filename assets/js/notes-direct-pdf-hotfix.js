(() => {
  "use strict";
  const CODES = new Set(["1001","1002","1003","1004","1005","1006","1007","1008","2001","2002","2003","2031","2032","2038","2039","2041","2049","3023","3031","3032","3041","3042","3043","3044","3045","3046","3047","3048","3049","3132","4001","4031","4041","4042","4043","5031","5041","5042","5043","5043A","6002","6041","6041A","6041B","6041C","6042A","6042B","6042C","6042D"]);
  const root = () => {
    const depth = location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
    return depth ? "../".repeat(depth) : "";
  };
  const norm = (value) => String(value || "").trim().toUpperCase();
  const esc = (value) => encodeURIComponent(value);
  function run() {
    document.querySelectorAll(".subject-card").forEach((card) => {
      const code = norm(card.querySelector(".subject-top strong")?.textContent);
      const row = card.querySelector(".action-row");
      if (!row || !CODES.has(code)) return;
      row.querySelectorAll(".availability-label").forEach((item) => {
        if (/notes/i.test(item.textContent || "")) item.remove();
      });
      let link = row.querySelector(".action.download");
      if (!link) {
        link = document.createElement("a");
        link.className = "action download";
        link.textContent = "Download Notes";
        const qp = row.querySelector(".action.qp");
        if (qp) row.insertBefore(link, qp);
        else row.append(link);
      }
      link.href = `${root()}notes/downloadable-notes-${esc(code)}.pdf`;
      link.setAttribute("download", "");
    });
  }
  addEventListener("DOMContentLoaded", () => {
    run();
    new MutationObserver(run).observe(document.getElementById("subjectGrid") || document.body, { childList: true, subtree: true });
  });
})();