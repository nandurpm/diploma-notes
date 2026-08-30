import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadDiagramRenderer() {
  const source = await readFile(new URL("../../../assets/js/ask-poly-diagrams.js", import.meta.url), "utf8");
  const window = {};
  vm.runInNewContext(source, { window, console });
  return window.AskPolyDiagrams;
}

test("PNP and NPN flowchart requests produce a real SVG diagram", async () => {
  const diagrams = await loadDiagramRenderer();
  const intent = diagrams.detectIntent("Send a flow chart and comparison of PNP and NPN transistors");

  assert.equal(intent.type, "flowchart");
  assert.equal(intent.variant, "pnp_npn");
  assert.match(diagrams.render(intent), /<svg[\s\S]*PNP: base LOW → ON[\s\S]*NPN: base HIGH → ON/);
});
