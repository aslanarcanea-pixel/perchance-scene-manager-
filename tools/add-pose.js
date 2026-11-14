#!/usr/bin/env node
/* node tools/add-pose.js --file scenes/indoor.yaml --scene couch_sitting --activity lounging new-pose.yaml [--dry-run] [--force]

   Adds one or more poses (a YAML file holding a pose object or a list of them) to a scene:
     - checks every required field and the posture value
     - rejects duplicate ids and poses that are too similar to an existing one
       (compares body/legs/arms/hands/head wording; override with --force)
     - appends the pose to the scene and lists it in the chosen activity
     - re-loads the whole library to prove the result is valid before writing anything */
"use strict";
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const SM = require("../src/scene-manager.js");

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : undefined; };
const flag = (n) => args.includes("--" + n);
const poseFile = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !["dry-run", "force"].includes(args[i - 1].slice(2))))[0];
const FIELDS = ["id", "name", "posture", "description", "body", "legs", "arms", "hands", "head", "expression", "props", "image_prompt", "negative_prompt", "triggers"];
const OPTIONAL = ["distance", "moods", "expressions", "camera", "micro"];
const POSTURES = ["standing", "seated", "kneeling", "squatting", "lying", "walking", "running"];

function die(msg) { console.error("Error: " + msg); process.exit(1); }
const tokens = (p) => new Set(["body", "legs", "arms", "hands", "head"].map((k) => String(p[k] || "")).join(" ").toLowerCase().match(/[a-z]+/g).filter((w) => w.length > 2));
function similarity(a, b) { const A = tokens(a), B = tokens(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i || 1); }

function scalar(v) { const s = String(v); return /^[\w][^:#\[\]{},"']*$/.test(s) && !/^(true|false|null|yes|no|\d+)$/i.test(s) ? s : JSON.stringify(s); }
function list(a) { return "[" + [].concat(a).map(scalar).join(", ") + "]"; }
function emit(p) {
  const ind = "          ";
  const lines = [`        - id: ${p.id}`];
  for (const k of FIELDS.slice(1).concat(OPTIONAL)) {
    if (p[k] === undefined) continue;
    lines.push(`${ind}${k}: ${Array.isArray(p[k]) ? list(p[k]) : scalar(p[k])}`);
  }
  return lines.join("\n") + "\n";
}

(async () => {
  const file = val("file"), scene = val("scene"), activity = val("activity");
  if (!file || !scene || !poseFile) die("usage: node tools/add-pose.js --file scenes/indoor.yaml --scene <scene_id> --activity <activity> <pose.yaml> [--dry-run] [--force]");
  const target = path.resolve(file);
  let text = fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  const dir = path.dirname(target);
  const readText = (n) => fs.promises.readFile(path.join(dir, n), "utf8");

  const before = await SM.loadLibrary(readText, (t) => yaml.load(t), fs.existsSync(path.join(dir, "index.yaml")) ? "index.yaml" : "scenes.yaml");
  const sceneKey = Object.keys(before.scenes).find((k) => k.endsWith("/" + scene));
  if (!sceneKey) die(`scene "${scene}" not found`);
  const sc = before.scenes[sceneKey];
  if (!sc.activities[activity]) die(`activity "${activity}" not found in ${scene} (has: ${Object.keys(sc.activities).join(", ")})`);
  if (sc.poseOrder.length >= 8) die(`${scene} already has ${sc.poseOrder.length} poses (maximum 8). Create a new scene instead.`);

  let poses = yaml.load(fs.readFileSync(poseFile, "utf8"));
  poses = Array.isArray(poses) ? poses : [poses];
  const allExisting = Object.values(before.scenes).flatMap((s) => Object.values(s.poses));
  const added = [];
  for (const p of poses) {
    for (const f of FIELDS) if (p[f] === undefined || p[f] === null || (p[f] === "" && f !== "props")) die(`pose "${p.id || "?"}": missing field "${f}"`);
    if (!POSTURES.includes(p.posture)) die(`pose "${p.id}": posture must be one of ${POSTURES.join(", ")}`);
    if (!/^[a-z0-9_]+$/.test(p.id)) die(`pose id "${p.id}" must be lowercase letters, digits and underscores`);
    if (allExisting.concat(added).some((e) => e.id === p.id)) die(`pose id "${p.id}" already exists`);
    if (sc.poseOrder.length + added.length >= 8) die("this would exceed 8 poses in the scene");
    const near = allExisting.concat(added).map((e) => ({ e, s: similarity(p, e) })).sort((a, b) => b.s - a.s)[0];
    if (near && near.s >= 0.6 && !flag("force")) die(`"${p.id}" looks like a repeat of "${near.e.id}" (${Math.round(near.s * 100)}% similar wording). Change it, or use --force.`);
    if (near) console.log(`  ${p.id}: closest existing pose is ${near.e.id} (${Math.round(near.s * 100)}% similar)`);
    added.push(p);
  }

  // insert into the text: end of the scene block, then the activity's poses list
  const m = text.match(new RegExp(`^    ${scene}:\\n`, "m"));
  const after = text.slice(m.index + m[0].length);
  const next = after.search(/^    [a-z_]+:\n/m);
  const end = next === -1 ? text.length : m.index + m[0].length + next;
  let block = text.slice(m.index, end).replace(/\n+$/, "\n");
  const act = new RegExp(`(\\n        ${activity}:\\n(?:          .*\\n)*?          poses: \\[)([^\\]]*)(\\])`);
  if (!act.test(block)) die(`could not find the "poses: [...]" line of activity ${activity}`);
  block = block.replace(act, (_, a, b, c) => a + b + (b.trim() ? ", " : "") + added.map((p) => p.id).join(", ") + c);
  block += added.map(emit).join("");
  const out = text.slice(0, m.index) + block + (end < text.length ? "\n" : "") + text.slice(end);

  // prove it still loads
  const read2 = (n) => (n === path.basename(target) ? Promise.resolve(out) : readText(n));
  const afterLib = await SM.loadLibrary(read2, (t) => yaml.load(t), fs.existsSync(path.join(dir, "index.yaml")) ? "index.yaml" : "scenes.yaml");
  if (afterLib.warnings.length) die("the result would have library warnings:\n  " + afterLib.warnings.join("\n  "));
  const n = afterLib.scenes[sceneKey];
  for (const p of added) if (!n.poses[p.id] || !n.activities[activity].poses.includes(p.id)) die(`"${p.id}" was not registered correctly`);

  if (flag("dry-run")) { console.log(`Dry run OK. ${scene} would have ${n.poseOrder.length} poses. Nothing written.`); return; }
  fs.writeFileSync(target, out, "utf8");
  console.log(`Added ${added.map((p) => p.id).join(", ")} to ${scene}/${activity}. ${scene} now has ${n.poseOrder.length} poses.`);
})().catch((e) => { console.error(e); process.exit(1); });
