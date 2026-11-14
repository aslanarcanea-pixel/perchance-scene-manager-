#!/usr/bin/env node
/* node tools/trigger-report.js [--strict]
   Finds trigger problems BEFORE they show up in chat:
     1. words/phrases that are triggers in more than one scene (scenes may fight over them)
     2. pose triggers that are everyday words (they fire on ordinary text) or shared by poses of one scene
     3. scenes that cannot reach the scene-change threshold with a normal sentence
   --strict exits with code 1 if anything is found (handy before an upload). */
"use strict";
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const SM = require("../src/scene-manager.js");
const SCENES = path.join(__dirname, "..", "scenes");
const readText = (n) => fs.promises.readFile(path.join(SCENES, n), "utf8");

const EVERYDAY = new Set("back side legs leg arms arm hands hand hair lean leans forward feet foot hip hips shoulder behind raise stretch cross closer elbow elbows knee knees edge hold rest tilt drape sleep curl grip head eyes look turn sit stand walk up down over under open close soft slow".split(" "));

(async () => {
  const lib = await SM.loadLibrary(readText, (t) => yaml.load(t));
  const scenes = Object.values(lib.scenes).filter((s) => s.triggers.length);
  let problems = 0;
  const say = (...a) => console.log(...a);

  say("1. Triggers shared by several scenes");
  const byTrig = {};
  for (const s of scenes) for (const t of s.triggers) (byTrig[t.raw] = byTrig[t.raw] || []).push(s.sid);
  const shared = Object.entries(byTrig).filter(([, v]) => v.length > 1);
  if (!shared.length) say("   none");
  for (const [t, v] of shared) { problems++; say(`   "${t}" is used by: ${v.join(", ")}`); }

  say("\n2. Pose triggers");
  let any = false;
  for (const s of scenes) {
    const seen = {};
    for (const id of s.poseOrder) {
      const p = s.poses[id];
      for (const t of p.compiled) {
        if (EVERYDAY.has(t.raw)) { any = true; problems++; say(`   ${s.sid}/${id}: "${t.raw}" is an everyday word; it will fire on ordinary text`); }
        (seen[t.raw] = seen[t.raw] || []).push(id);
      }
    }
    for (const [t, ids] of Object.entries(seen)) if (ids.length > 1) { any = true; problems++; say(`   ${s.sid}: "${t}" is shared by poses ${ids.join(", ")}`); }
  }
  if (!any) say("   none");

  say("\n3. Can each scene reach the threshold (" + lib.settings.scene_change_threshold + ") with one normal sentence?");
  let weak = false;
  for (const s of scenes) {
    const phrases = s.triggers.filter((t) => t.weight > 1).length;
    const words = s.triggers.length - phrases;
    // a normal sentence usually contains one word and one phrase from the list
    const best = [...s.triggers].sort((a, b) => b.weight - a.weight).slice(0, 2).reduce((n, t) => n + t.weight, 0);
    if (best < lib.settings.scene_change_threshold) { weak = true; problems++; say(`   ${s.sid}: best two triggers only score ${best}; add phrases like "on the ..." (has ${phrases} phrase(s), ${words} word(s))`); }
  }
  if (!weak) say("   all scenes can");

  say(`\n${problems} issue(s) found.${problems ? " (These are hints; some sharing is intentional.)" : ""}`);
  process.exit(process.argv.includes("--strict") && problems ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
