document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.target.matches("input, select, textarea")) return;
  const search = document.querySelector("#subjectSearch");
  if (!search) return;
  event.preventDefault();
  search.focus();
});
