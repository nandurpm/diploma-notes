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

test("diode flowchart requests do not fall back to the odd-even example", async () => {
  const diagrams = await loadDiagramRenderer();
  const intent = diagrams.detectIntent("I want a comparison table of diodes, diagram and flow chart of how it works");
  const output = diagrams.render(intent);

  assert.equal(intent.variant, "diode_operation");
  assert.match(output, /Apply voltage across A–K/);
  assert.match(output, /Forward biased\?/);
  assert.doesNotMatch(output, /N % 2|Print EVEN|Print ODD/);
});

test("ambiguous visual requests do not invent an unrelated diagram", async () => {
  const diagrams = await loadDiagramRenderer();

  assert.equal(diagrams.detectIntent("Create a diagram"), null);
  assert.equal(diagrams.detectIntent("Create a flowchart"), null);
  assert.equal(diagrams.detectIntent("Plot a graph"), null);
  assert.equal(diagrams.render({ type: "flowchart", variant: "generic", title: "Flowchart" }), "");
});
