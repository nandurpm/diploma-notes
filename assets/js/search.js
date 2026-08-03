/* Purpose: Search - Descriptive comment added for clarity */
document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.target.matches("input, select, textarea") || event.target.isContentEditable) return;
  const search = document.querySelector("#subjectSearch, #q, #programmeSearch, #rev2015Search, #chatSearch");
  if (!search) return;
  event.preventDefault();
  search.focus();
});
