/* =====================================================================
   Perchance Scene Manager v2 — scene, pose, look & continuity module
   ---------------------------------------------------------------------
   Reads the YAML library, detects the scene from the conversation, picks
   an activity, a pose, an expression and an attitude, tracks a tension
   stage, distance and clothing continuity, and gives the AI character a
   hidden "body position" directive before it replies.

   Works in two places:
     - Perchance (browser): attaches itself to oc.thread automatically.
     - Node (tests/tools): exports the pure functions; no `oc` needed.
   ===================================================================== */
(function (root) {
  "use strict";

  /*BUILD_CONFIG*/
  const BUILD = { mode: "remote", baseUrl: "", entry: "index.yaml", files: {}, applyImagePrompt: true, badge: true, detection: "keywords", debug: false };
  /*END_BUILD_CONFIG*/

  const VERSION = "2.0.0";
  const MARKER = "[SCENE & POSE";
  const BADGE = "\uD83D\uDCCD ";

  const DEFAULT_SETTINGS = {
    default_scene: "general/neutral",
    default_selection: "mixed",
    avoid_immediate_repeat: true,
    pose_history_limit: 5,
    pose_refresh_every: 4,
    prefer_same_posture: true,
    scene_change_threshold: 2.5,
    scene_change_margin: 1,
    activity_change_threshold: 1,
    pose_trigger_threshold: 1,
    user_text_weight: 1.0,
    ai_text_weight: 0.8,
    transition_cue_bonus: 1.5,
    directive_mode: "full",
    badge: true,
    detect_negation: true,
    detect_hypothetical: true,
    hybrid_margin: 1.0,
    tension_enabled: true,
    stage_up_threshold: 1.5,
    stage_decay_turns: 6,
    max_stage: null,
    micro_chance: 0.35,
    micro_min_gap: 2,
    distance_enabled: true,
    continuity_enabled: true,
    adopt_ai_posture: true,
    default_camera: "front view, eye level",
    snapshot_limit: 40
  };

  const api = { version: VERSION, debug: !!BUILD.debug, status: "idle", current: null };
  const log = (...a) => { if (api.debug) console.log("[SceneManager]", ...a); };
  const cloneJ = (o) => JSON.parse(JSON.stringify(o));
  const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  /* ===============================================================
     1. TEXT MATCHING  (synonyms, inflections, negation, hypotheticals)
     =============================================================== */
  function norm(t) { return String(t || "").toLowerCase().replace(/[\u2018\u2019]/g, "'"); }
  function esc(s) { return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"); }

  const NEG_RE = /(?:\b(?:not|never|no|without|nor|cannot|instead of|rather than)|n't)(?:\s+[a-z']+){0,3}\s*$/;
  const HYP_RE = /\b(?:yesterday|last (?:night|week|time|year)|remember when|remembered|used to|back when|tomorrow|someday|one day|next (?:week|time)|if we|if you|if i|would|might|wish(?:es|ed)?|imagine|pretend|dream(?:ed|t|s)? (?:of|about))\b/;
  const splitSentences = (t) => t.split(/(?<=[.!?\n])\s+/).filter((s) => s.trim());

  // Compile one trigger ("couch", "on the couch", "head* to") into a regex.
  // `*` = any word ending. Plain words accept -s/-es/-ed/-ing and their synonyms.
  function compileTrigger(raw, syn) {
    const t = norm(raw).trim();
    if (!t) return null;
    const parts = t.split(/\s+/);
    const word = (w) => {
      if (w.includes("*")) return w.split("*").map(esc).join("[a-z0-9']*");
      if (!/^[a-z]{3,}$/.test(w)) return esc(w);
      const alts = [w].concat((syn && syn[w]) || []).sort().map((x) => (/^[a-z]{3,}$/.test(x) ? x + "(?:s|es|ed|ing)?" : esc(x).replace(/ /g, "\\s+")));
      return alts.length > 1 ? "(?:" + alts.join("|") + ")" : alts[0];
    };
    return {
      raw: t,
      weight: 1 + 0.5 * (parts.length - 1), // phrases are stronger evidence than words
      re: new RegExp("(?<![a-z0-9'])" + parts.map(word).join("\\s+") + "(?![a-z0-9])", "g")
    };
  }
  // Triggers that compile to the same pattern (for example "couch" and "sofa" when they are
  // synonyms) are merged, so one match is never counted twice.
  function compileList(list, syn) {
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    const seen = new Set();
    return arr.map((x) => compileTrigger(x, syn)).filter((c) => {
      if (!c || seen.has(c.re.source)) return false;
      seen.add(c.re.source);
      return true;
    });
  }

  const ALL_FLAGS = { neg: true, hyp: true };
  const NO_FLAGS = { neg: false, hyp: false };

  function scoreText(text, compiled, flags) {
    const f = flags || ALL_FLAGS;
    const t = norm(text);
    const hits = [];
    let score = 0;
    if (!t.trim()) return { score, hits };
    const sentences = f.hyp ? splitSentences(t) : [t];
    const factor = sentences.map((s) => (f.hyp && HYP_RE.test(s) ? 0.3 : 1));
    for (const c of compiled) {
      let cnt = 0;
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        c.re.lastIndex = 0;
        let m;
        while ((m = c.re.exec(s)) !== null) {
          if (m.index === c.re.lastIndex) c.re.lastIndex++;
          if (f.neg && NEG_RE.test(s.slice(Math.max(0, m.index - 40), m.index))) continue;
          cnt += factor[i];
        }
      }
      if (cnt > 0) { score += Math.min(cnt, 2) * c.weight; hits.push(c.raw); }
    }
    return { score, hits };
  }

  function weightedScore(parts, compiled, flags) {
    let score = 0;
    const hits = new Set();
    for (const p of parts) {
      const r = scoreText(p.text, compiled, flags);
      score += r.score * p.w;
      r.hits.forEach((h) => hits.add(h));
    }
    return { score, hits: [...hits] };
  }

  // *action narration* counts a little extra
  function narration(t) {
    const m = String(t || "").match(/\*[^*]+\*/g);
    return m ? m.map((x) => x.slice(1, -1)).join(". ") : "";
  }
  function buildParts(st, userText, aiText) {
    const parts = [];
    const add = (text, w) => {
      if (!text) return;
      parts.push({ text, w });
      const nar = narration(text);
      if (nar) parts.push({ text: nar, w: w * 0.3 });
    };
    add(userText, st.user_text_weight);
    add(aiText, userText ? st.ai_text_weight : 1);
    return parts;
  }
  const flagsOf = (st) => ({ neg: !!st.detect_negation, hyp: !!st.detect_hypothetical });

  /* ===============================================================
     2. LIBRARY BUILDING
     =============================================================== */
  function resolvePose(lib, entry, sceneId) {
    let p = null;
    if (typeof entry === "string") {
      const base = lib.poseLibrary[entry];
      if (!base) { lib.warnings.push(`${sceneId}: pose "${entry}" not found in pose_library`); return null; }
      p = Object.assign({}, base, { id: entry });
    } else if (entry && typeof entry === "object") {
      if (entry.use) {
        const base = lib.poseLibrary[entry.use];
        if (!base) { lib.warnings.push(`${sceneId}: "use: ${entry.use}" not found in pose_library`); return null; }
        p = Object.assign({}, base, entry, { id: entry.id || entry.use });
      } else {
        p = Object.assign({}, entry);
      }
    }
    if (!p || !p.id) { lib.warnings.push(`${sceneId}: a pose has no id`); return null; }
    p.name = p.name || p.id;
    p.posture = p.posture || "standing";
    p.compiled = compileList(p.triggers, lib.synonyms);
    return p;
  }

  function deriveMoods(lib, text) {
    const out = [];
    for (const [mood, compiled] of Object.entries(lib.moodMap)) {
      if (scoreText(text, compiled, NO_FLAGS).score > 0) out.push(mood);
    }
    return out.length ? out : ["warm", "calm"];
  }

  function prepareScene(lib, id, category, sid, sc, file) {
    sc = sc || {};
    const poses = {};
    const order = [];
    for (const entry of sc.poses || []) {
      const p = resolvePose(lib, entry, id);
      if (!p) continue;
      if (poses[p.id]) { lib.warnings.push(`${id}: duplicate pose id "${p.id}"`); continue; }
      poses[p.id] = p;
      order.push(p.id);
    }

    const acts = {};
    const rawActs = sc.activities && Object.keys(sc.activities).length ? sc.activities : null;
    if (rawActs) {
      for (const [key, a] of Object.entries(rawActs)) {
        const ids = [];
        for (const pid of a.poses || []) {
          if (poses[pid]) { ids.push(pid); continue; }
          if (lib.poseLibrary[pid]) {
            poses[pid] = resolvePose(lib, pid, id);
            order.push(pid);
            ids.push(pid);
            continue;
          }
          lib.warnings.push(`${id}/${key}: pose "${pid}" does not exist`);
        }
        acts[key] = {
          key,
          description: a.description || key,
          selection: a.selection || null,
          defined_pose: a.defined_pose || null,
          poses: ids,
          triggers: compileList(a.triggers, lib.synonyms)
        };
      }
    } else {
      acts.default = { key: "default", description: "", selection: "random", defined_pose: null, poses: order.slice(), triggers: [] };
    }
    const defaultActivity = acts[sc.default_activity] ? sc.default_activity : Object.keys(acts)[0];
    if (sc.default_activity && !acts[sc.default_activity]) lib.warnings.push(`${id}: default_activity "${sc.default_activity}" does not exist`);

    const seqs = {};
    for (const [k, s] of Object.entries(sc.sequences || {})) {
      const steps = (s.steps || []).filter((pid) => {
        if (poses[pid]) return true;
        lib.warnings.push(`${id}/sequence ${k}: step pose "${pid}" does not exist`);
        return false;
      });
      if (!steps.length) { lib.warnings.push(`${id}/sequence ${k}: no valid steps`); continue; }
      seqs[k] = {
        key: k,
        description: s.description || k,
        triggers: compileList(s.triggers, lib.synonyms),
        auto_start: !!s.auto_start,
        step_every: Math.max(1, parseInt(s.step_every, 10) || 1),
        loop: !!s.loop,
        steps
      };
    }

    return {
      id, category, sid, file,
      subtitle: sc.subtitle || sid,
      description: sc.description || "",
      environment: sc.environment || "",
      entry: sc.entry || "",
      camera: sc.camera || "",
      sticky: sc.sticky !== false,
      triggers: compileList(sc.triggers, lib.synonyms),
      exits: compileList(sc.exit_triggers, lib.synonyms),
      activities: acts,
      defaultActivity,
      sequences: seqs,
      poses,
      poseOrder: order
    };
  }

  function expandSynonyms(raw) {
    const out = {};
    const add = (k, v) => { out[k] = out[k] || []; if (v !== k && !out[k].includes(v)) out[k].push(v); };
    for (const [k, list] of Object.entries(raw || {})) {
      const group = [norm(k)].concat((list || []).map(norm));
      for (const a of group) for (const b of group) add(a, b);
    }
    return out;
  }

  // indexDoc = parsed entry file; included = [{name, doc}] in include order
  function buildLibrary(indexDoc, included) {
    indexDoc = indexDoc || {};
    const lib = {
      settings: Object.assign({}, DEFAULT_SETTINGS, indexDoc.settings || {}),
      cues: [],
      poseLibrary: {},
      transitions: { scene: [], posture: [] },
      scenes: {},
      warnings: [],
      defaultSceneId: null,
      synonyms: {},
      moodMap: {},
      expressions: [], expById: {},
      attitudes: [], attByName: {},
      tension: null,
      micro: {},
      distance: null,
      garments: [],
      camera: { default: "", rules: [] }
    };

    // ---- merge every file ----
    const rawSyn = {};
    const rawMood = {};
    let tension = null;
    const pending = [];
    for (const { name, doc } of included) {
      if (!doc || typeof doc !== "object") { lib.warnings.push(`${name}: file is empty or not valid YAML`); continue; }
      Object.assign(lib.poseLibrary, doc.pose_library || {});
      const tr = doc.transitions || {};
      lib.transitions.scene.push(...(tr.scene || []));
      lib.transitions.posture.push(...(tr.posture || []));
      for (const [k, v] of Object.entries(doc.synonyms || {})) rawSyn[k] = (rawSyn[k] || []).concat(v || []);
      Object.assign(rawMood, doc.mood_map || {});
      if (doc.tension) tension = { start: doc.tension.start || (tension && tension.start), stages: Object.assign({}, tension && tension.stages, doc.tension.stages) };
      for (const [k, v] of Object.entries(doc.micro_movements || {})) lib.micro[k] = (lib.micro[k] || []).concat(v || []);
      if (doc.distance) lib.distance = doc.distance;
      if (doc.continuity && doc.continuity.garments) lib.garments.push(...doc.continuity.garments.map(norm));
      if (doc.camera) lib.camera = { default: doc.camera.default || "", rules: doc.camera.rules || [] };
      lib.expressions.push(...(doc.expressions || []));
      lib.attitudes.push(...(doc.attitudes || []));
      for (const [cat, scenes] of Object.entries(doc.scenes || {})) {
        for (const [sid, sc] of Object.entries(scenes || {})) pending.push({ cat, sid, sc, name });
      }
    }

    // ---- derived structures (before scenes, because scenes use them) ----
    lib.synonyms = expandSynonyms(rawSyn);
    lib.cues = compileList(indexDoc.transition_cues, lib.synonyms);
    for (const [mood, words] of Object.entries(rawMood)) lib.moodMap[mood] = compileList(words, null);
    for (const e of lib.expressions) lib.expById[e.id] = e;
    for (const a of lib.attitudes) lib.attByName[norm(a.name)] = a;

    if (tension && tension.stages && Object.keys(tension.stages).length) {
      const keys = Object.keys(tension.stages);
      const T = { start: keys.includes(tension.start) ? tension.start : keys[0], index: {}, stages: [] };
      keys.forEach((k, i) => {
        const s = tension.stages[k] || {};
        const att = (s.attitudes || []).filter((n) => {
          if (lib.attByName[norm(n)]) return true;
          lib.warnings.push(`tension stage "${k}": attitude "${n}" not found`);
          return false;
        });
        T.index[k] = i;
        T.stages.push({ key: k, moods: s.moods || [], attitudes: att, cues: compileList(s.cues, lib.synonyms) });
      });
      lib.tension = T;
    }
    if (lib.distance && Array.isArray(lib.distance.levels)) {
      lib.distance = {
        default: lib.distance.default,
        levels: lib.distance.levels.map((l) => ({ key: l.key, description: l.description || l.key, cues: compileList(l.cues, lib.synonyms) }))
      };
      if (!lib.distance.levels.some((l) => l.key === lib.distance.default)) lib.distance.default = lib.distance.levels[0] && lib.distance.levels[0].key;
    } else {
      lib.distance = null;
    }
    lib.camera.rules = (lib.camera.rules || []).map((r) => ({ re: new RegExp(r.match, "i"), camera: r.camera }));

    // ---- scenes ----
    for (const { cat, sid, sc, name } of pending) {
      const id = cat + "/" + sid;
      if (lib.scenes[id]) lib.warnings.push(`${name}: scene "${id}" defined twice; the later one wins`);
      lib.scenes[id] = prepareScene(lib, id, cat, sid, sc, name);
    }
    const cats = new Set(lib.expressions.map((e) => e.category));
    for (const sc of Object.values(lib.scenes)) {
      for (const p of Object.values(sc.poses)) {
        p._moods = p.moods ? [].concat(p.moods) : deriveMoods(lib, p.expression || "");
        for (const m of p._moods) if (lib.expressions.length && !cats.has(m)) lib.warnings.push(`${sc.id}/${p.id}: mood "${m}" has no expressions`);
        for (const eid of p.expressions || []) if (!lib.expById[eid]) lib.warnings.push(`${sc.id}/${p.id}: expression "${eid}" not found`);
      }
    }

    const ids = Object.keys(lib.scenes);
    if (!ids.length) lib.warnings.push("No scenes were loaded");
    lib.defaultSceneId = lib.scenes[lib.settings.default_scene] ? lib.settings.default_scene : ids[0] || null;
    if (!lib.scenes[lib.settings.default_scene]) lib.warnings.push(`default_scene "${lib.settings.default_scene}" does not exist; using "${lib.defaultSceneId}"`);
    return lib;
  }

  async function loadLibrary(readText, parse, entry) {
    const indexDoc = parse(await readText(entry || "index.yaml")) || {};
    const included = [];
    for (const name of indexDoc.include || []) included.push({ name, doc: parse(await readText(name)) });
    return buildLibrary(indexDoc, included);
  }

  /* ===============================================================
     3. STATE, SNAPSHOTS (undo on regenerate / delete)
     =============================================================== */
  function createState() {
    return {
      sceneId: null, activity: null, poseId: null, history: [], turnsInPose: 0, announced: null, lock: false,
      origPrefix: undefined, appliedPrefix: "",
      turn: 0,
      stageIdx: null, stageMode: "auto", stageMax: null, stageIdle: 0,
      distance: null, distanceLock: false,
      off: [],
      seq: null,
      expId: null, attName: null, expHistory: [],
      micro: null, microTurn: -99, microHistory: []
    };
  }
  function ensureDefaults(state) {
    const d = createState();
    for (const k of Object.keys(d)) if (state[k] === undefined && d[k] !== undefined) state[k] = d[k];
    return state;
  }
  function record(state, poseId) {
    if (!poseId) return;
    state.history = (state.history || []).concat(poseId).slice(-20);
    state.turnsInPose = 0;
  }

  // The store keeps the live state plus a snapshot taken after every chat message.
  // When the chat is regenerated, edited down or deleted, we restart from the snapshot
  // that was taken BEFORE the message being processed.
  function newStore() { return { state: createState(), snaps: {} }; }
  function normalizeStore(raw) {
    if (!raw) return newStore();
    if (raw.snaps && raw.state) return raw;
    return { state: raw, snaps: {} }; // v1 shape: just a state
  }
  function rollback(store, count) {
    const keys = Object.keys(store.snaps).map(Number).filter((k) => k < count).sort((a, b) => b - a);
    return ensureDefaults(keys.length ? cloneJ(store.snaps[keys[0]]) : createState());
  }
  function rollbackInclusive(store, count) {
    const keys = Object.keys(store.snaps).map(Number).filter((k) => k <= count).sort((a, b) => b - a);
    return keys.length ? ensureDefaults(cloneJ(store.snaps[keys[0]])) : null;
  }
  function commit(store, count, state, limit) {
    store.snaps[count] = cloneJ(state);
    for (const k of Object.keys(store.snaps)) if (Number(k) > count) delete store.snaps[k];
    const keys = Object.keys(store.snaps).map(Number).sort((a, b) => a - b);
    while (keys.length > (limit || 40)) delete store.snaps[keys.shift()];
    store.state = cloneJ(state);
    return store;
  }

  /* ===============================================================
     4. SCENE DETECTION
     =============================================================== */
  function detectScene(lib, state, parts, userText, flags) {
    const st = lib.settings;
    const fl = flags || flagsOf(st);
    const scores = {};
    for (const sc of Object.values(lib.scenes)) {
      if (!sc.triggers.length) continue;
      const r = weightedScore(parts, sc.triggers, fl);
      scores[sc.id] = { score: r.score, total: r.score, hits: r.hits };
    }
    const cur = state.sceneId && lib.scenes[state.sceneId] ? lib.scenes[state.sceneId] : null;
    const exit = !!(cur && cur.exits.length && weightedScore(parts, cur.exits, fl).score >= 1); // weak (hypothetical) matches do not count
    const cue = !!(userText && lib.cues.length && scoreText(userText, lib.cues, fl).score > 0);

    let best = null;
    for (const [id, r] of Object.entries(scores)) {
      if (cur && id === cur.id) continue;
      if (cue && r.score > 0) r.total = r.score + st.transition_cue_bonus;
      if (!best || r.total > best.total) best = { id, total: r.total, hits: r.hits };
    }
    const curScore = cur && scores[cur.id] ? scores[cur.id].score : 0;
    const threshold = exit ? Math.min(st.scene_change_threshold, 1) : st.scene_change_threshold;

    // "ambiguous" = the top scenes are too close to call (used by hybrid detection)
    const ranked = Object.entries(scores).map(([id, r]) => ({ id, total: r.total })).sort((a, b) => b.total - a.total);
    let ambiguous = null;
    if (ranked.length > 1 && ranked[0].total >= 1 && ranked[0].total - ranked[1].total < st.hybrid_margin) {
      ambiguous = ranked.filter((r) => ranked[0].total - r.total < st.hybrid_margin).slice(0, 3).map((r) => r.id);
    }

    const out = { scores, exit, cue, sceneId: null, reason: "", ambiguous };
    if (!cur) {
      if (best && best.total >= threshold) { out.sceneId = best.id; out.reason = `trigger: ${best.hits.join(", ")}`; }
      return out;
    }
    const margin = exit || cur.sticky === false ? 0 : st.scene_change_margin;
    if (best && best.total >= threshold && best.total - curScore >= margin) {
      out.sceneId = best.id;
      out.reason = `trigger: ${best.hits.join(", ")}${cue ? " (+transition cue)" : ""}`;
    } else if (exit && lib.defaultSceneId && lib.defaultSceneId !== cur.id) {
      out.sceneId = lib.defaultSceneId;
      out.reason = "exit phrase";
    }
    return out;
  }

  /* ===============================================================
     5. POSE SELECTION
     =============================================================== */
  function explicitPose(sc, userText, currentId, threshold, flags) {
    let best = null;
    let bs = 0;
    for (const id of sc.poseOrder) {
      const p = sc.poses[id];
      if (!p.compiled.length) continue;
      const r = scoreText(userText, p.compiled, flags);
      if (r.score > bs) { bs = r.score; best = id; }
    }
    return best && bs >= threshold && best !== currentId ? best : null;
  }

  function pickPose(lib, sc, activityKey, state, rng, refresh) {
    const st = lib.settings;
    const a = sc.activities[activityKey];
    let pool = a && a.poses.length ? a.poses.slice() : sc.poseOrder.slice();
    if (!pool.length) return null;

    if (refresh && st.prefer_same_posture && state.poseId && sc.poses[state.poseId]) {
      const posture = sc.poses[state.poseId].posture;
      const same = sc.poseOrder.filter((id) => sc.poses[id].posture === posture);
      if (same.length > 1) pool = same;
    }
    if (st.distance_enabled && state.distance) {
      const fit = pool.filter((id) => !sc.poses[id].distance || [].concat(sc.poses[id].distance).includes(state.distance));
      if (fit.length) pool = fit;
    }
    const mode = (a && a.selection) || st.default_selection;
    if ((mode === "defined" || mode === "mixed") && a && a.defined_pose && sc.poses[a.defined_pose]) {
      if (mode === "defined" || rng() < 0.5) return a.defined_pose;
    }
    let cand = pool;
    if (st.avoid_immediate_repeat && state.poseId) {
      const f = cand.filter((id) => id !== state.poseId);
      if (f.length) cand = f;
    }
    const recent = (state.history || []).slice(-Math.max(0, st.pose_history_limit));
    const fresh = cand.filter((id) => !recent.includes(id));
    if (fresh.length) cand = fresh;
    return cand[Math.floor(rng() * cand.length)];
  }

  /* ----- posture the AI narrates (so state follows the story) ----- */
  const POSTURE_RE = {
    seated: /\b(?:sits?|sat|sitting|settles? (?:in|into|onto|down))\b/,
    lying: /\b(?:lies|lay|lays|laying|lying)\b/,
    kneeling: /\b(?:kneel\w*|knelt)\b/,
    standing: /\b(?:stands?|stood|standing|rises?|rose|gets? up|gets? to (?:her|his|their) feet)\b/,
    squatting: /\b(?:crouch\w*|squat\w*)\b/
  };
  function detectPosture(text) {
    let t = String(text || "");
    const nar = narration(t);
    t = norm(nar || t.replace(/"[^"]*"|\u201C[^\u201D]*\u201D/g, " "));
    const found = Object.keys(POSTURE_RE).filter((k) => POSTURE_RE[k].test(t));
    return found.length === 1 ? found[0] : null;
  }

  /* ===============================================================
     6. TENSION, DISTANCE, CONTINUITY, LOOK, MICRO
     =============================================================== */
  function stageMaxIdx(lib, state) {
    const T = lib.tension;
    if (state.stageMax != null) return Math.min(state.stageMax, T.stages.length - 1);
    const m = lib.settings.max_stage;
    return m && T.index[m] !== undefined ? T.index[m] : T.stages.length - 1;
  }
  function stageOn(lib, state) { return !!(lib.tension && lib.settings.tension_enabled && state.stageMode !== "off"); }
  function currentStage(lib, state) {
    if (!stageOn(lib, state)) return null;
    const i = state.stageIdx == null ? lib.tension.index[lib.tension.start] : state.stageIdx;
    return lib.tension.stages[i];
  }

  function updateStage(lib, state, parts, flags, info, userTurn) {
    const T = lib.tension;
    const st = lib.settings;
    if (!T || !st.tension_enabled) return;
    if (state.stageIdx == null) state.stageIdx = T.index[T.start] || 0;
    const maxIdx = stageMaxIdx(lib, state);
    const before = state.stageIdx;
    if (state.stageMode === "auto" && userTurn) {
      let hit = -1;
      T.stages.forEach((s, i) => { if (weightedScore(parts, s.cues, flags).score >= st.stage_up_threshold) hit = i; });
      if (hit > state.stageIdx) { state.stageIdx++; state.stageIdle = 0; }
      else if (hit >= 0) state.stageIdle = 0;
      else {
        state.stageIdle = (state.stageIdle || 0) + 1;
        if (state.stageIdle >= st.stage_decay_turns && state.stageIdx > 0) { state.stageIdx--; state.stageIdle = 0; }
      }
    }
    if (state.stageIdx > maxIdx) state.stageIdx = maxIdx;
    if (state.stageIdx !== before) info.stageChanged = true;
  }

  function updateDistance(lib, state, ownText, flags) {
    const D = lib.distance;
    if (!D || !lib.settings.distance_enabled) return;
    if (!state.distance) state.distance = D.default;
    if (state.distanceLock || !ownText) return;
    let best = null;
    for (const l of D.levels) {
      const r = weightedScore([{ text: ownText, w: 1 }], l.cues, flags);
      if (r.score >= 1 && (!best || r.score > best.score)) best = { key: l.key, score: r.score };
    }
    if (best) state.distance = best.key;
  }

  // ---- clothing continuity (outer layers only) ----
  const REMOVE_RE = /\b(?:take[sn]?|took|taking) off|\b(?:remove[sd]?|removing)\b|\b(?:slip(?:s|ped|ping)?|pull(?:s|ed|ing)?|shrug(?:s|ged|ging)?|kick(?:s|ed|ing)?|peel(?:s|ed|ing)?) off\b|\b(?:drop(?:s|ped|ping)?|unbutton(?:s|ed|ing)?)\b/;
  const WEAR_RE = /\b(?:put|puts|putting) on\b|\b(?:slip(?:s|ped|ping)?|pull(?:s|ed|ing)?|shrug(?:s|ged|ging)?) on\b|\b(?:wear|wears|wearing|wore)\b/;
  const garmentNorm = (g) => (g === "glove" ? "gloves" : g);
  function updateContinuity(lib, state, ownText) {
    if (!lib.settings.continuity_enabled || !lib.garments.length || !ownText) return;
    const gRe = new RegExp("\\b(" + lib.garments.map(esc).join("|") + ")\\b", "g");
    for (const s of splitSentences(norm(ownText).replace(/\*/g, " "))) {
      const rm = REMOVE_RE.exec(s);
      const wr = WEAR_RE.exec(s);
      const which = rm && (!wr || rm.index < wr.index) ? "off" : wr ? "on" : null;
      if (!which) continue;
      const at = (which === "off" ? rm : wr).index;
      if (NEG_RE.test(s.slice(Math.max(0, at - 30), at))) continue;
      const tail = s.slice(at);
      let m;
      gRe.lastIndex = 0;
      while ((m = gRe.exec(tail)) !== null) {
        const g = garmentNorm(m[1]);
        if (which === "off" && !state.off.includes(g)) state.off.push(g);
        if (which === "on") state.off = state.off.filter((x) => x !== g);
      }
    }
  }

  // ---- expression + attitude (looks) ----
  function chooseLook(lib, state, sc, pose, rng, opts) {
    const o = opts || {};
    const stage = currentStage(lib, state);
    let cand = ((pose && pose.expressions) || []).map((id) => lib.expById[id]).filter(Boolean);
    if (!cand.length && pose && lib.expressions.length) {
      const moods = pose._moods || [];
      cand = lib.expressions.filter((e) => moods.includes(e.category));
      if (stage) {
        const both = cand.filter((e) => stage.moods.includes(e.category));
        if (both.length) cand = both;
      }
    }
    if (cand.length) {
      const fresh = cand.filter((e) => !(state.expHistory || []).slice(-3).includes(e.id) && e.id !== state.expId);
      const use = fresh.length ? fresh : cand;
      state.expId = pickOne(use, rng).id;
      state.expHistory = (state.expHistory || []).concat(state.expId).slice(-6);
    } else {
      state.expId = null;
    }
    if (stage && stage.attitudes.length) {
      const keep = state.attName && stage.attitudes.some((n) => norm(n) === norm(state.attName));
      if (!keep || o.forceAttitude) {
        const others = stage.attitudes.filter((n) => norm(n) !== norm(state.attName || ""));
        state.attName = pickOne(others.length ? others : stage.attitudes, rng);
      }
    } else {
      state.attName = null;
    }
  }

  function chooseMicro(lib, state, pose, rng) {
    state.micro = null;
    const st = lib.settings;
    if (!pose || state.turn - state.microTurn < st.micro_min_gap || rng() >= st.micro_chance) return;
    const pool = (pose.micro && pose.micro.length ? pose.micro : lib.micro[pose.posture]) || [];
    if (!pool.length) return;
    const fresh = pool.filter((x) => !(state.microHistory || []).slice(-3).includes(x));
    state.micro = pickOne(fresh.length ? fresh : pool, rng);
    state.microTurn = state.turn;
    state.microHistory = (state.microHistory || []).concat(state.micro).slice(-6);
  }

  /* ===============================================================
     7. ONE STEP: update the state from new text
        input: { userText, aiText, userTurn }
        opts:  { rng, forceScene }
     =============================================================== */
  function advance(lib, state, input, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const st = lib.settings;
    const fl = flagsOf(st);
    ensureDefaults(state);
    const userText = (input && input.userText) || "";
    const aiText = (input && input.aiText) || "";
    const userTurn = !!(input && input.userTurn);
    const own = userTurn ? userText : aiText;
    const parts = buildParts(st, userText, aiText);

    const info = { scores: {}, exit: false, cue: false, sceneChanged: false, activityChanged: false, poseChanged: false, stageChanged: false, adopted: null, ambiguous: null, seqStarted: null, seqEnded: false, reason: "" };
    if (userTurn) state.turn = (state.turn || 0) + 1;
    if (!lib.scenes[state.sceneId]) state.sceneId = null;

    // 1. scene
    if (!state.lock) {
      if (opts.forceScene && lib.scenes[opts.forceScene]) {
        if (opts.forceScene !== state.sceneId) { state.sceneId = opts.forceScene; info.sceneChanged = true; info.reason = "classifier"; }
      } else {
        const det = detectScene(lib, state, parts, userText, fl);
        info.scores = det.scores; info.exit = det.exit; info.cue = det.cue; info.ambiguous = det.ambiguous;
        if (det.sceneId && det.sceneId !== state.sceneId) { state.sceneId = det.sceneId; info.sceneChanged = true; info.reason = det.reason; }
      }
    }
    if (!state.sceneId) { state.sceneId = lib.defaultSceneId; info.sceneChanged = true; info.reason = info.reason || "default scene"; }
    const sc = lib.scenes[state.sceneId];
    if (!sc) return { state, info };

    // 2. activity
    let act = !info.sceneChanged && sc.activities[state.activity] ? state.activity : null;
    let bestA = null;
    let bestS = 0;
    for (const a of Object.values(sc.activities)) {
      if (!a.triggers.length) continue;
      const r = weightedScore(parts, a.triggers, fl);
      if (r.score > bestS) { bestS = r.score; bestA = a.key; }
    }
    if (bestA && bestS >= st.activity_change_threshold) act = bestA;
    if (!act) act = sc.defaultActivity;
    if (act !== state.activity) { info.activityChanged = true; state.activity = act; }

    // 3. continuity + distance (from the message's own text)
    updateDistance(lib, state, own, fl);
    updateContinuity(lib, state, own);

    // 4. sequences
    if (info.sceneChanged) state.seq = null;
    const seqs = sc.sequences || {};
    if (state.seq && !seqs[state.seq.key]) state.seq = null;
    if (userTurn && state.seq) {
      const def = seqs[state.seq.key];
      state.seq.turns++;
      if (state.seq.turns >= def.step_every) {
        state.seq.step++;
        state.seq.turns = 0;
        if (state.seq.step >= def.steps.length) {
          if (def.loop) state.seq.step = 0;
          else { state.seq = null; info.seqEnded = true; }
        }
      }
    }
    if (!state.seq && !info.seqEnded) {
      for (const def of Object.values(seqs)) {
        const byTrigger = userTurn && userText && weightedScore([{ text: userText, w: 1 }], def.triggers, fl).score > 0;
        if ((info.sceneChanged && def.auto_start) || byTrigger) {
          state.seq = { key: def.key, step: 0, turns: 0 };
          info.seqStarted = def.key;
          break;
        }
      }
    }

    // 5. pose
    if (userTurn) state.turnsInPose = (state.turnsInPose || 0) + 1;
    let next = state.poseId;
    if (state.seq) {
      next = seqs[state.seq.key].steps[state.seq.step];
    } else {
      const refresh = userTurn && st.pose_refresh_every > 0 && state.turnsInPose >= st.pose_refresh_every;
      const needNew = info.sceneChanged || info.activityChanged || !sc.poses[state.poseId] || refresh || info.seqEnded;
      const explicit = userTurn && userText ? explicitPose(sc, userText, state.poseId, st.pose_trigger_threshold, fl) : null;
      if (explicit) next = explicit;
      else if (needNew) next = pickPose(lib, sc, act, state, rng, refresh && !info.sceneChanged && !info.activityChanged);
    }
    if (next && next !== state.poseId) { state.poseId = next; info.poseChanged = true; record(state, next); }

    // 6. follow the posture the AI narrates
    if (!userTurn && st.adopt_ai_posture && !state.seq) {
      const said = detectPosture(aiText);
      const cur = sc.poses[state.poseId];
      if (said && cur && said !== cur.posture) {
        let pool = (sc.activities[state.activity].poses || []).filter((id) => sc.poses[id].posture === said);
        if (!pool.length) pool = sc.poseOrder.filter((id) => sc.poses[id].posture === said);
        if (pool.length) { state.poseId = pickOne(pool, rng); record(state, state.poseId); info.poseChanged = true; info.adopted = said; }
      }
    }

    // 7. tension, look, micro-movement
    updateStage(lib, state, parts, fl, info, userTurn);
    const pose = sc.poses[state.poseId];
    if (info.poseChanged || info.stageChanged || info.sceneChanged || (state.expId == null && pose && lib.expressions.length)) {
      chooseLook(lib, state, sc, pose, rng, { forceAttitude: info.stageChanged });
    }
    if (userTurn && !info.poseChanged && !info.sceneChanged) chooseMicro(lib, state, pose, rng);
    else if (userTurn) state.micro = null;

    return { state, info };
  }

  /* ===============================================================
     8. OUTPUT: directive, image prompt, status, commands
     =============================================================== */
  function fill(text, ctx) { return String(text || "").replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m)); }
  function matchRule(rules, from, to, fromPosture, toPosture, kind) {
    let best = null;
    let bestScore = -1;
    for (const r of rules) {
      const a = kind === "scene" ? from : fromPosture;
      const b = kind === "scene" ? to : toPosture;
      if ((r.from !== "*" && r.from !== a) || (r.to !== "*" && r.to !== b)) continue;
      const s = (r.from !== "*" ? 1 : 0) + (r.to !== "*" ? 1 : 0);
      if (s > bestScore) { best = r; bestScore = s; }
    }
    return best;
  }
  const levelOf = (lib, state) => (lib.distance && lib.settings.distance_enabled ? lib.distance.levels.find((l) => l.key === state.distance) || null : null);

  function buildDirective(lib, state, names) {
    const sc = lib.scenes[state.sceneId];
    if (!sc) return "";
    const st = lib.settings;
    const pose = sc.poses[state.poseId];
    const act = sc.activities[state.activity];
    const ctx = { char: (names && names.char) || "the character", user: (names && names.user) || "the user" };
    const prev = state.announced;
    const prevScene = prev && lib.scenes[prev.sceneId];
    const prevPose = prevScene && prevScene.poses[prev.poseId];
    Object.assign(ctx, {
      to_scene: sc.id, to_activity: state.activity, to_pose: state.poseId,
      from_scene: prev ? prev.sceneId : "", from_pose: prev ? prev.poseId : "", from_activity: prev ? prev.activity || "" : ""
    });

    let move = "";
    const bridge = (fromP, toP) => {
      const r = matchRule(lib.transitions.posture, null, null, fromP, toP, "posture");
      return r && fromP !== toP ? `${ctx.char} ${r.text}.` : "";
    };
    if (!prev) move = sc.entry ? `${ctx.char} ${sc.entry}.` : "";
    else if (prev.sceneId !== state.sceneId) {
      const r = matchRule(lib.transitions.scene, prev.sceneId, state.sceneId, null, null, "scene");
      if (r) move = fill(r.text, ctx);
      else if (sc.entry) move = `${ctx.char} ${sc.entry}.`;
      else if (prevPose && pose) move = bridge(prevPose.posture, pose.posture);
    } else if (prev.poseId !== state.poseId && prevPose && pose) move = bridge(prevPose.posture, pose.posture);

    const exp = state.expId ? lib.expById[state.expId] : null;
    const att = state.attName ? lib.attByName[norm(state.attName)] : null;
    const level = levelOf(lib, state);
    const off = state.off || [];
    const sig = [state.sceneId, state.poseId, state.expId, state.attName, state.distance, off.join(",")].join("|");
    const unchanged = !!(prev && prev.sig === sig);

    const lines = [];
    if (st.directive_mode === "compact" && unchanged) {
      lines.push(`${MARKER} \u2014 reminder for ${ctx.char}. Never quote or mention this block.]`);
      lines.push(`${ctx.char} is still in this position: ${pose ? pose.description || pose.name : sc.subtitle}`);
      if (state.micro) lines.push(`Small movement (optional): ${ctx.char} ${state.micro}.`);
    } else {
      lines.push(`${MARKER} \u2014 private direction for ${ctx.char}. Never quote or mention this block.]`);
      lines.push(`Scene: ${sc.subtitle}${sc.environment ? " (" + sc.environment + ")" : ""}`);
      if (act && act.description) lines.push(`Activity: ${act.description}`);
      if (state.seq && sc.sequences[state.seq.key]) {
        const d = sc.sequences[state.seq.key];
        lines.push(`Sequence: ${d.description} (step ${Math.min(state.seq.step + 1, d.steps.length)} of ${d.steps.length}); move on gradually, one step at a time.`);
      }
      if (move) lines.push(`Movement this turn: ${move}`);
      if (pose) {
        lines.push(`${ctx.char}'s current body position: ${pose.description || pose.name}`);
        const field = (label, v) => { if (v && String(v).trim()) lines.push(`- ${label}: ${String(v).trim()}`); };
        field("Body", pose.body);
        field("Legs", pose.legs);
        field("Arms", pose.arms);
        field("Hands", pose.hands);
        field("Head", pose.head);
        field("Expression", exp ? `${exp.name} \u2014 ${exp.description}` : pose.expression);
        if (Array.isArray(pose.props) && pose.props.length) field("Props", pose.props.join(", "));
      }
      if (att) lines.push(`Attitude: ${att.name} \u2014 ${att.description}`);
      if (level) lines.push(`Closeness to ${ctx.user}: ${level.description}`);
      if (off.length) lines.push(`Continuity: ${ctx.char} is no longer wearing: ${off.join(", ")}. Do not describe these as worn.`);
      if (state.micro) lines.push(`Small movement (optional): ${ctx.char} ${state.micro}.`);
      lines.push(`Keep ${ctx.char}'s actions, narration and dialogue consistent with this. Change position only when the story calls for it.`);
    }
    state.announced = { sceneId: state.sceneId, poseId: state.poseId, activity: state.activity, sig };
    return lines.join("\n");
  }

  function inferCamera(lib, sc, pose) {
    if (pose.camera) return pose.camera;
    const hay = `${pose.image_prompt || ""} ${pose.description || ""}`;
    for (const r of lib.camera.rules) if (r.re.test(hay)) return r.camera;
    return (sc && sc.camera) || lib.camera.default || lib.settings.default_camera;
  }
  function buildImagePrompt(lib, state) {
    const sc = lib.scenes[state.sceneId];
    const pose = sc && sc.poses[state.poseId];
    if (!pose) return null;
    const pos = [];
    const push = (x) => { if (x && String(x).trim()) pos.push(String(x).trim()); };
    push(pose.image_prompt);
    push(inferCamera(lib, sc, pose));
    const exp = state.expId ? lib.expById[state.expId] : null;
    if (exp && exp.visual_details) {
      const v = exp.visual_details;
      push(v.eye_direction && `eyes: ${v.eye_direction}`);
      push(v.eyebrow_position && `eyebrows: ${v.eyebrow_position}`);
      push(v.mouth && `mouth: ${v.mouth}`);
    } else push(pose.expression);
    const att = state.attName ? lib.attByName[norm(state.attName)] : null;
    if (att) push((att.keywords || []).join(", "));
    const neg = [];
    for (const t of String(pose.negative_prompt || "").split(",")) { const x = t.trim(); if (x && !neg.includes(x)) neg.push(x); }
    return { positive: pos.join(", "), negative: neg.join(", ") };
  }

  function statusText(lib, state) {
    const sc = lib.scenes[state.sceneId];
    const L = [];
    L.push(`Scene: ${sc ? sc.id : "(none yet)"}${state.lock ? " [locked]" : ""}`);
    L.push(`Activity: ${state.activity || "-"}   Pose: ${state.poseId || "-"}`);
    if (lib.tension) {
      const s = currentStage(lib, state);
      L.push(`Mood level: ${state.stageMode === "off" ? "off" : s ? s.key : "-"} (mode ${state.stageMode}, cap ${lib.tension.stages[stageMaxIdx(lib, state)].key})`);
    }
    L.push(`Expression: ${state.expId ? lib.expById[state.expId].name : "-"}   Attitude: ${state.attName || "-"}`);
    if (lib.distance) L.push(`Distance: ${state.distance || "-"}${state.distanceLock ? " [locked]" : ""}`);
    if (state.off && state.off.length) L.push(`Not wearing: ${state.off.join(", ")}`);
    if (state.seq) L.push(`Sequence: ${state.seq.key}, step ${state.seq.step + 1}`);
    if (lib.warnings.length) L.push(`Library warnings: ${lib.warnings.length} (see console)`);
    return L.join("\n");
  }

  function findScene(lib, key) {
    const k = key.toLowerCase();
    if (lib.scenes[k]) return lib.scenes[k];
    return Object.values(lib.scenes).find((s) => s.sid.toLowerCase() === k) || null;
  }
  function refreshLook(lib, state, rng) {
    const sc = lib.scenes[state.sceneId];
    if (sc) chooseLook(lib, state, sc, sc.poses[state.poseId], rng || Math.random, { forceAttitude: true });
  }

  function handleCommand(lib, state, text, rng) {
    const m = /^\s*\/(scene|pose|stage|distance|seq)\b\s*(.*)$/i.exec(text || "");
    if (!m) return { handled: false };
    ensureDefaults(state);
    const cmd = m[1].toLowerCase();
    const arg = m[2].trim();
    const a = arg.toLowerCase();
    const say = (reply) => ({ handled: true, reply });

    if (cmd === "scene") {
      if (!arg || a === "list") return say("Scenes: " + Object.keys(lib.scenes).join(", ") + "\n/scene <id> locks a scene, /scene auto unlocks, /scene status shows the current state.");
      if (a === "status") return say(statusText(lib, state));
      if (a === "auto") { state.lock = false; return say("Scene detection is automatic again."); }
      const sc = findScene(lib, arg);
      if (!sc) return say(`Unknown scene "${arg}". Try /scene list.`);
      state.sceneId = sc.id;
      state.lock = true;
      state.seq = null;
      state.activity = sc.defaultActivity;
      state.poseId = pickPose(lib, sc, state.activity, state, rng, false);
      record(state, state.poseId);
      const auto = Object.values(sc.sequences || {}).find((d) => d.auto_start);
      if (auto) { state.seq = { key: auto.key, step: 0, turns: 0 }; state.poseId = auto.steps[0]; record(state, state.poseId); }
      refreshLook(lib, state, rng);
      return say(`Scene locked: ${sc.id}. Use /scene auto to unlock.`);
    }
    if (cmd === "pose") {
      const sc = lib.scenes[state.sceneId];
      if (!sc) return say("No active scene yet.");
      if (!arg || a === "list") return say(`Poses in ${sc.id}: ${sc.poseOrder.join(", ")}`);
      if (sc.poses[arg]) { state.poseId = arg; state.seq = null; record(state, arg); refreshLook(lib, state, rng); return say(`Pose set: ${arg}.`); }
      return say(`Unknown pose "${arg}". Try /pose list.`);
    }
    if (cmd === "stage") {
      const T = lib.tension;
      if (!T) return say("No tension stages are defined.");
      if (state.stageIdx == null) state.stageIdx = T.index[T.start] || 0;
      const show = () => `Mood level: ${state.stageMode === "off" ? "off" : T.stages[state.stageIdx].key} (mode ${state.stageMode}, cap ${T.stages[stageMaxIdx(lib, state)].key}). Stages: ${T.stages.map((s) => s.key).join(" < ")}`;
      if (!arg || a === "status") return say(show());
      if (a === "off") { state.stageMode = "off"; refreshLook(lib, state, rng); return say("Mood levels are off."); }
      if (a === "auto") { state.stageMode = "auto"; refreshLook(lib, state, rng); return say("Mood levels follow the conversation. " + show()); }
      if (a.startsWith("max")) {
        const key = a.slice(3).trim();
        if (key === "" || key === "auto") { state.stageMax = null; return say("Cap reset. " + show()); }
        if (T.index[key] === undefined) return say(`Unknown stage "${key}". Stages: ${T.stages.map((s) => s.key).join(", ")}`);
        state.stageMax = T.index[key];
        if (state.stageIdx > state.stageMax) state.stageIdx = state.stageMax;
        return say("Cap set. " + show());
      }
      if (T.index[a] === undefined) return say(`Unknown stage "${arg}". Stages: ${T.stages.map((s) => s.key).join(", ")}`);
      state.stageIdx = Math.min(T.index[a], stageMaxIdx(lib, state));
      state.stageMode = "fixed";
      refreshLook(lib, state, rng);
      return say("Mood level fixed. " + show());
    }
    if (cmd === "distance") {
      const D = lib.distance;
      if (!D) return say("No distance levels are defined.");
      if (!arg) return say(`Distance: ${state.distance || D.default}${state.distanceLock ? " [locked]" : ""}. Levels: ${D.levels.map((l) => l.key).join(", ")}`);
      if (a === "auto") { state.distanceLock = false; return say("Distance follows the conversation."); }
      const l = D.levels.find((x) => x.key === a);
      if (!l) return say(`Unknown level "${arg}". Levels: ${D.levels.map((x) => x.key).join(", ")}`);
      state.distance = l.key; state.distanceLock = true;
      return say(`Distance locked: ${l.key}. Use /distance auto to unlock.`);
    }
    // seq
    const sc = lib.scenes[state.sceneId];
    const seqs = (sc && sc.sequences) || {};
    if (!arg || a === "list") return say(Object.keys(seqs).length ? `Sequences here: ${Object.keys(seqs).join(", ")}. /seq start <name>, /seq stop` : "This scene has no sequences.");
    if (a === "stop") { state.seq = null; return say("Sequence stopped."); }
    if (a.startsWith("start")) {
      const key = a.slice(5).trim();
      if (!seqs[key]) return say(`Unknown sequence "${key}". Try /seq list.`);
      state.seq = { key, step: 0, turns: 0 };
      state.poseId = seqs[key].steps[0]; record(state, state.poseId); refreshLook(lib, state, rng);
      return say(`Sequence started: ${key}.`);
    }
    return say("Usage: /seq list | /seq start <name> | /seq stop");
  }

  /* ===============================================================
     9. PERCHANCE INTEGRATION (only runs when `oc` exists)
     =============================================================== */
  let parseYaml = null;
  let libPromise = null;
  let memStore = null;

  async function ensureParser() {
    if (parseYaml) return parseYaml;
    if (root.jsyaml && typeof root.jsyaml.load === "function") { parseYaml = (t) => root.jsyaml.load(t); return parseYaml; }
    const urls = ["https://esm.sh/js-yaml@4.1.0", "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm"];
    let lastErr = null;
    for (const u of urls) {
      try {
        const m = await import(u);
        const y = m.default && m.default.load ? m.default : m;
        if (y.load) { parseYaml = (t) => y.load(t); return parseYaml; }
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("Could not load the YAML parser (js-yaml)");
  }

  async function readText(name) {
    if (BUILD.mode === "embedded") {
      if (Object.prototype.hasOwnProperty.call(BUILD.files, name)) return BUILD.files[name];
      throw new Error("Embedded file missing: " + name);
    }
    const url = BUILD.baseUrl.replace(/\/?$/, "/") + name;
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(`Could not load ${url} (HTTP ${r.status})`);
    return r.text();
  }

  function ensureLibrary() {
    if (!libPromise) {
      api.status = "loading";
      libPromise = (async () => {
        try {
          const parse = await ensureParser();
          const lib = await loadLibrary(readText, parse, BUILD.entry);
          lib.warnings.forEach((w) => console.warn("[SceneManager] " + w));
          api.lib = lib;
          api.status = "ready";
          log("library loaded:", Object.keys(lib.scenes).length, "scenes");
          return lib;
        } catch (e) {
          api.status = "error: " + (e && e.message);
          console.error("[SceneManager] failed to load the scene library:", e);
          return null;
        }
      })();
    }
    return libPromise;
  }

  function loadStore() {
    try {
      const cd = oc.thread.customData;
      if (cd && cd.__sceneManager) return normalizeStore(cloneJ(cd.__sceneManager));
    } catch (e) { /* ignore */ }
    return memStore ? normalizeStore(cloneJ(memStore)) : newStore();
  }
  function saveStore(store) {
    memStore = cloneJ(store);
    try {
      oc.thread.customData = oc.thread.customData || {};
      oc.thread.customData.__sceneManager = memStore;
    } catch (e) { /* ignore */ }
  }
  const nonSystemCount = () => { try { return oc.thread.messages.filter((m) => m.author !== "system").length; } catch (e) { return 0; } };
  function lastText(author) {
    try {
      const msgs = oc.thread.messages;
      for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].author === author) return String(msgs[i].content || "");
    } catch (e) { /* ignore */ }
    return "";
  }

  function removeSystem(prefix) {
    try {
      const msgs = oc.thread.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (m.author === "system" && typeof m.content === "string" && m.content.startsWith(prefix)) msgs.splice(i, 1);
      }
    } catch (e) { /* ignore */ }
  }
  // Insert system messages just before the newest message, so the user's message stays last.
  function insertBeforeLast(items) {
    const msgs = oc.thread.messages;
    const last = msgs[msgs.length - 1];
    if (last && last.author === "user") msgs.splice(msgs.length - 1, 0, ...items);
    else msgs.push(...items);
  }

  function applyImagePrompt(lib, state) {
    const ip = buildImagePrompt(lib, state);
    api.current = ip ? { scene: state.sceneId, activity: state.activity, pose: state.poseId, expression: state.expId, attitude: state.attName, distance: state.distance, image_prompt: ip.positive, negative_prompt: ip.negative } : null;
    if (!BUILD.applyImagePrompt || !ip || !ip.positive) return;
    try {
      if (!oc.character) return;
      let base = oc.character.imagePromptPrefix || "";
      if (state.appliedPrefix && base.endsWith(state.appliedPrefix)) base = base.slice(0, base.length - state.appliedPrefix.length);
      if (state.origPrefix === undefined) state.origPrefix = base;
      const add = (state.origPrefix ? ", " : "") + ip.positive;
      oc.character.imagePromptPrefix = state.origPrefix + add;
      state.appliedPrefix = add;
    } catch (e) { /* ignore */ }
  }

  function names() {
    let c = "the character";
    let u = "the user";
    try { if (oc.character && oc.character.name) c = oc.character.name; } catch (e) { /* ignore */ }
    try { if (oc.thread.userCharacter && oc.thread.userCharacter.name) u = oc.thread.userCharacter.name; } catch (e) { /* ignore */ }
    return { char: c, user: u };
  }

  // Hybrid detection: when two scenes are too close to call, ask the language model.
  async function classifyWithLLM(lib, candidates) {
    if (typeof oc.getInstructCompletion !== "function") return null;
    try {
      const list = candidates.map((id) => `${id} (${lib.scenes[id].subtitle}${lib.scenes[id].environment ? ", " + lib.scenes[id].environment : ""})`).join("\n");
      const convo = oc.thread.messages.filter((m) => m.author !== "system").slice(-4).map((m) => `${m.author}: ${String(m.content).slice(0, 400)}`).join("\n");
      const r = await oc.getInstructCompletion({
        instruction: `Where is this roleplay happening RIGHT NOW? Options:\n${list}\n\nRecent messages:\n${convo}\n\nAnswer with exactly one option key and nothing else.`,
        startWith: "", stopSequences: ["\n"]
      });
      const out = norm(r.generatedText || r.text || "");
      return candidates.find((id) => out.includes(id.toLowerCase())) || null;
    } catch (e) { console.warn("[SceneManager] classifier failed:", e && e.message); return null; }
  }

  async function onMessage(message) {
    if (!message || message.author === "system") return;
    const lib = await ensureLibrary();
    if (!lib) return;
    const store = loadStore();
    const count = nonSystemCount();
    const state = rollback(store, count);
    const showBadge = BUILD.badge && lib.settings.badge;

    if (message.author === "user") {
      const text = String(message.content || "");
      const cmd = handleCommand(lib, state, text, Math.random);
      let info = null;
      if (!cmd.handled) {
        const input = { userText: text, aiText: lastText("ai"), userTurn: true };
        let force = null;
        if (BUILD.detection === "hybrid" && !state.lock) {
          const probe = detectScene(lib, state, buildParts(lib.settings, input.userText, input.aiText), input.userText, flagsOf(lib.settings));
          if (probe.ambiguous) force = await classifyWithLLM(lib, probe.ambiguous);
        }
        info = advance(lib, state, input, { forceScene: force }).info;
      }
      applyImagePrompt(lib, state);
      removeSystem(MARKER);
      const directive = buildDirective(lib, state, names());
      const items = [];
      if (directive) items.push({ author: "system", hiddenFrom: ["user"], expectsReply: false, content: directive });
      if (showBadge && (!info || info.sceneChanged || info.poseChanged || info.stageChanged)) {
        removeSystem(BADGE);
        const sc = lib.scenes[state.sceneId];
        const pose = sc && sc.poses[state.poseId];
        const stage = currentStage(lib, state);
        items.push({ author: "system", hiddenFrom: ["ai"], expectsReply: false, wrapperStyle: "opacity:0.6; font-size:0.85em; text-align:center;", content: `${BADGE}${sc ? sc.subtitle : ""}${pose ? " \u00B7 " + pose.name : ""}${stage ? " \u00B7 " + stage.key.replace("_", " ") : ""}` });
      }
      if (cmd.reply) items.push({ author: "system", expectsReply: false, content: cmd.reply });
      if (items.length) insertBeforeLast(items);
      if (info) log("user turn", info.reason || "(no change)", state.sceneId, state.activity, state.poseId);
    } else if (message.author === "ai") {
      if (!state.lock) advance(lib, state, { userText: "", aiText: String(message.content || ""), userTurn: false });
      applyImagePrompt(lib, state);
    }
    commit(store, count, state, lib.settings.snapshot_limit);
    saveStore(store);
  }

  // A message was deleted/edited away: go back to the snapshot that matches the chat now.
  async function onResync() {
    const lib = await ensureLibrary();
    if (!lib) return;
    const store = loadStore();
    const count = nonSystemCount();
    const snap = rollbackInclusive(store, count);
    if (!snap) return;
    if (snap.sceneId === store.state.sceneId && snap.poseId === store.state.poseId) return;
    snap.announced = null;
    removeSystem(MARKER);
    const directive = buildDirective(lib, snap, names());
    if (directive) insertBeforeLast([{ author: "system", hiddenFrom: ["user"], expectsReply: false, content: directive }]);
    applyImagePrompt(lib, snap);
    for (const k of Object.keys(store.snaps)) if (Number(k) > count) delete store.snaps[k];
    store.snaps[count] = cloneJ(snap);
    store.state = cloneJ(snap);
    saveStore(store);
  }

  function attach() {
    ensureLibrary();
    oc.thread.on("MessageAdded", async function ({ message }) {
      try { await onMessage(message); } catch (e) { console.error("[SceneManager]", e); }
    });
    for (const ev of ["MessageDeleted", "MessageEdited"]) {
      try { oc.thread.on(ev, async () => { try { await onResync(); } catch (e) { console.error("[SceneManager]", e); } }); } catch (e) { /* event not supported */ }
    }
    log("attached");
  }

  Object.assign(api, {
    attach, reload: () => { libPromise = null; return ensureLibrary(); },
    getState: () => (typeof oc !== "undefined" ? loadStore().state : null),
    getNegativePrompt: () => (api.current ? api.current.negative_prompt : ""),
    // pure functions (tests, tools, probe)
    DEFAULT_SETTINGS, MARKER, BADGE, compileTrigger, compileList, scoreText, weightedScore, buildParts, buildLibrary, loadLibrary,
    createState, newStore, normalizeStore, rollback, rollbackInclusive, commit,
    advance, buildDirective, buildImagePrompt, statusText, handleCommand, detectScene, detectPosture, pickPose, deriveMoods
  });

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SceneManager = api;

  if (typeof oc !== "undefined" && typeof oc.thread !== "undefined") attach();
})(typeof window !== "undefined" ? window : globalThis);
