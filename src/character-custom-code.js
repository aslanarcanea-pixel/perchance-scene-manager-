/* =====================================================================
   GENERATED FILE — do not edit. Rebuild with:  node build.js
   Built: 2026-11-14T15:31:33.155Z
   Scenes: embedded (shared.yaml, indoor.yaml, physical.yaml, behavior.yaml, attitudes.yaml, facial_expressions.yaml)
   Web reader: included
   Paste this whole file into Perchance -> your character -> Custom code.
   ===================================================================== */

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

  const BUILD = {
  "mode": "embedded",
  "baseUrl": "",
  "entry": "index.yaml",
  "files": {
    "index.yaml": "# =====================================================================\n#  Perchance Scene Manager — library entry point\n# =====================================================================\nschema_version: 1\nlibrary_version: \"1.0.0\"\n\ninclude:\n  - shared.yaml\n  - indoor.yaml\n  - physical.yaml\n  - behavior.yaml\n  - attitudes.yaml\n  - facial_expressions.yaml\n\nsettings:\n  default_scene: general/neutral\n  default_selection: mixed\n  avoid_immediate_repeat: true\n  pose_history_limit: 5\n  pose_refresh_every: 4\n  prefer_same_posture: true\n  scene_change_threshold: 2.5\n  scene_change_margin: 1\n  activity_change_threshold: 1\n  user_text_weight: 1.0\n  ai_text_weight: 0.8\n  transition_cue_bonus: 1.5\n  # --- v2 settings ---\n  directive_mode: full             # full | compact (compact = short reminder when nothing changed)\n  badge: true                      # visible \"scene - pose\" note in the chat\n  detect_negation: true            # \"not on the couch\" does not count\n  detect_hypothetical: true        # past/plans/\"would\" count for less\n  hybrid_margin: 1.0               # scenes this close are \"ambiguous\" (used by --detection hybrid)\n  tension_enabled: true\n  stage_up_threshold: 1.5\n  stage_decay_turns: 6\n  max_stage: intimacy              # highest stage allowed\n  micro_chance: 0.35\n  micro_min_gap: 2\n  distance_enabled: true\n  continuity_enabled: true\n  adopt_ai_posture: true           # follow the posture the AI narrates\n  default_camera: front view, eye level\n  snapshot_limit: 40\n\ntransition_cues:\n  - let's go\n  - lets go\n  - let us go\n  - head* to\n  - head* over\n  - mov* to\n  - walk* over\n  - walk* into\n  - stand* up and\n  - get* up and\n  - after that\n  - time for\n  - time to\n  - shall we\n  - why don't we\n",
    "shared.yaml": "# =====================================================================\n#  Shared definitions: reusable poses, transition rules, fallback scene\n# =====================================================================\n\npose_library:\n  standing_relaxed:\n    name: Standing relaxed\n    posture: standing\n    description: Standing in a relaxed, natural stance.\n    body: Upright, weight resting slightly on one leg.\n    legs: Feet about hip-width apart.\n    arms: Hanging loosely at the sides.\n    hands: Relaxed, fingers slightly curled.\n    head: Facing the companion.\n    expression: Calm, attentive.\n    image_prompt: standing, relaxed natural stance, arms at sides\n    negative_prompt: stiff pose, extra limbs\n\n  standing_arms_folded:\n    name: Standing with arms loosely folded\n    posture: standing\n    description: Standing with arms loosely folded.\n    body: Upright, shoulders relaxed.\n    legs: Weight shifted onto one hip.\n    arms: Folded loosely across the chest.\n    hands: Tucked against the upper arms.\n    head: Tilted slightly, listening.\n    expression: Thoughtful, slightly amused.\n    image_prompt: standing, arms loosely crossed, head slightly tilted\n    negative_prompt: extra limbs, angry\n\n  seated_relaxed:\n    name: Seated relaxed\n    posture: seated\n    description: Sitting comfortably and relaxed.\n    body: Leaning back slightly against the backrest.\n    legs: One leg crossed over the other.\n    arms: Resting on the lap or armrest.\n    hands: Loosely clasped.\n    head: Turned toward the companion.\n    expression: Easy, friendly.\n    image_prompt: sitting relaxed, legs crossed, hands in lap\n    negative_prompt: slouching badly, extra limbs\n\ntransitions:\n  scene:\n    - from: provocative/kitchen_cooking\n      to: provocative/meal_table\n      text: \"{char} sets the finished food on the table and sits down to eat.\"\n    - from: provocative/meal_table\n      to: provocative/couch_sitting\n      text: \"{char} finishes eating, gets up from the table and settles onto the couch.\"\n    - from: \"*\"\n      to: provocative/bed_lying\n      text: \"{char} walks to the bed and lies down.\"\n\n  posture:\n    - { from: seated,    to: standing,  text: \"rises from the seat\" }\n    - { from: seated,    to: kneeling,  text: \"gets up and kneels down\" }\n    - { from: seated,    to: lying,     text: \"lies back\" }\n    - { from: standing,  to: seated,    text: \"sits down\" }\n    - { from: standing,  to: kneeling,  text: \"kneels down\" }\n    - { from: standing,  to: lying,     text: \"lies down\" }\n    - { from: standing,  to: squatting, text: \"crouches down\" }\n    - { from: squatting, to: \"*\",       text: \"straightens up\" }\n    - { from: kneeling,  to: \"*\",       text: \"gets back up\" }\n    - { from: lying,     to: seated,    text: \"sits up\" }\n    - { from: lying,     to: \"*\",       text: \"gets up\" }\n\nscenes:\n  general:\n    neutral:\n      subtitle: General\n      description: No specific activity.\n      environment: \"\"\n      sticky: false\n      default_activity: idle\n      activities:\n        idle:\n          description: being relaxed and attentive\n          selection: random\n          poses: [standing_relaxed, seated_relaxed, standing_arms_folded]\n      poses:\n        - standing_relaxed\n        - seated_relaxed\n        - standing_arms_folded\n",
    "indoor.yaml": "scenes:\n  provocative:\n    couch_sitting:\n      subtitle: Sitting on Couch\n      environment: living room couch\n      triggers: [couch, sofa, \"on the couch\", \"sit down\"]\n      exit_triggers: [\"get up\", \"stand up\", \"leave the couch\"]\n      entry: settles onto the couch\n      default_activity: lounging\n      activities:\n        lounging:\n          description: lounging back lazily\n          triggers: [relax, lounge, comfy]\n          selection: random\n          poses: [couch_sprawl, couch_curl, couch_legs_up, couch_hands_raised]\n        attentive:\n          description: leaning in to talk\n          triggers: [talk, listen, close]\n          selection: random\n          poses: [couch_lean_in, couch_cross, couch_knees_wide, couch_knee_on_cushion]\n      sequences:\n        settle_in:\n          description: settling in and getting comfortable\n          triggers: [\"settle in\", \"get comfortable\", \"make yourself comfortable\"]\n          auto_start: false\n          step_every: 2\n          steps: [couch_cross, couch_lean_in, couch_curl, couch_sprawl]\n      poses:\n        - id: couch_sprawl\n          name: Lazy Sprawl\n          posture: seated\n          description: Sinks into the cushions with one arm draped along the backrest.\n          body: reclined, back against cushion, chest open\n          legs: knees apart slightly, one foot flat, other stretched out\n          arms: right arm along backrest, left resting on thigh\n          hands: fingers relaxed, loosely curled\n          head: tilted back slightly, gaze lowered toward viewer\n          expression: lazy half-smile\n          props: [cushion]\n          image_prompt: sitting on couch, reclined, arm along backrest, relaxed sprawl, one leg extended\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sprawl, lazy]\n        - id: couch_curl\n          name: Curled Up\n          posture: seated\n          description: Tucks both legs beneath her and leans sideways into the armrest.\n          body: angled sideways, shoulder against armrest\n          legs: both legs folded beneath, feet tucked\n          arms: one arm hugging a cushion\n          hands: fingers gripping cushion edge\n          head: resting toward shoulder, eyes looking up\n          expression: soft, shy smile\n          props: [cushion, armrest]\n          image_prompt: curled up on couch, legs tucked, hugging cushion, leaning on armrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [curl, cozy]\n        - id: couch_legs_up\n          name: Legs Over Arm\n          posture: seated\n          description: Sits sideways with both legs swung over the armrest.\n          body: leaning back, torso twisted slightly\n          legs: both legs draped over armrest, ankles crossed\n          arms: hands behind head\n          hands: fingers laced behind head\n          head: tipped back, chin raised\n          expression: playful smirk\n          props: [armrest]\n          image_prompt: sitting sideways on couch, legs over armrest, hands behind head, ankles crossed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [legs, drape]\n        - id: couch_lean_in\n          name: Leaning In\n          posture: seated\n          description: Perches on the cushion edge and leans forward toward the viewer.\n          body: torso forward, back arched slightly\n          legs: knees together, feet flat\n          arms: forearms on thighs\n          hands: fingers clasped between knees\n          head: chin lowered, eyes up\n          expression: intent, teasing\n          props: []\n          image_prompt: sitting on couch edge, leaning forward, forearms on knees, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [lean, closer]\n          distance: [near, close]\n        - id: couch_cross\n          name: Legs Crossed\n          posture: seated\n          description: Sits upright with one leg crossed over the other, one hand resting on the cushion beside her.\n          body: upright, shoulders back\n          legs: crossed at knee, top foot pointed\n          arms: one hand on knee, other on cushion\n          hands: fingertips lightly tracing fabric\n          head: turned over shoulder, eyes sideways\n          expression: coy\n          props: []\n          image_prompt: sitting on couch, legs crossed, upright posture, glancing sideways\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [cross, poised]\n        - id: couch_knees_wide\n          name: Wide Knees\n          posture: seated\n          description: Sits on the couch leaning slightly forward with knees wide apart and a hand on each thigh.\n          body: leaning slightly forward, spine upright, shoulders square\n          legs: knees wide apart, feet planted flat and apart\n          arms: both arms extended down to the thighs\n          hands: one hand on each thigh, fingers spread\n          head: chin level, gaze direct\n          expression: confident, intent\n          props: [couch]\n          image_prompt: sitting on couch, knees wide apart, feet flat, hands on thighs, leaning forward, direct gaze\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [wide, thighs]\n          distance: [near, close]\n        - id: couch_hands_raised\n          name: Hands Beside Head\n          posture: seated\n          description: Sits back on the couch with legs stretched out wide and both hands raised beside her head.\n          body: leaning back slightly, spine straight\n          legs: knees apart, legs stretched out wide, feet extended\n          arms: both elbows bent, hands raised to head height\n          hands: open palms facing inward beside the head\n          head: chin level, looking forward\n          expression: animated, expressive\n          props: [couch]\n          image_prompt: sitting on couch, legs stretched wide, both hands raised beside head, expressive\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [raised, gesture]\n          distance: [apart, near]\n        - id: couch_knee_on_cushion\n          name: Knee on Cushion\n          posture: kneeling\n          description: Leans forward over the couch with one knee on the cushion and arms braced, looking back at the viewer.\n          body: leaning forward over the backrest, back slightly arched, torso angled\n          legs: one knee on the cushion, other leg straight with heel lifted\n          arms: one arm braced on the backrest, other on the armrest\n          hands: palms gripping the couch back\n          head: turned over shoulder, gaze direct\n          expression: coy, direct\n          props: [couch, backrest]\n          image_prompt: leaning over couch, one knee on cushion, hands on backrest, looking over shoulder\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [cushion, backrest]\n\n    chair_sitting:\n      subtitle: Sitting on Chair\n      environment: bedroom chair\n      triggers: [chair, armchair, \"on the chair\", \"take a seat\"]\n      exit_triggers: [\"stand up\", \"get up\", \"leave the chair\"]\n      entry: sits down on the chair\n      default_activity: seated_pose\n      activities:\n        seated_pose:\n          description: sitting upright, composed\n          triggers: [sit, upright, posed]\n          selection: random\n          poses: [chair_upright, chair_cross, chair_perch]\n        casual:\n          description: slouching or leaning back\n          triggers: [slouch, relax, tilt]\n          selection: random\n          poses: [chair_tilt, chair_sideways, chair_legs_raised, chair_feet_on_desk, chair_wide_grip]\n      poses:\n        - id: chair_upright\n          name: Upright Poise\n          posture: seated\n          description: Sits tall with spine straight and hands folded in her lap.\n          body: upright, shoulders back, chin level\n          legs: knees together, feet flat\n          arms: elbows close, forearms in lap\n          hands: fingers interlaced on lap\n          head: level, gaze direct\n          expression: calm, composed\n          props: [chair]\n          image_prompt: sitting on chair, upright posture, hands folded in lap, knees together\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [upright, formal]\n        - id: chair_cross\n          name: Crossed Legs\n          posture: seated\n          description: Crosses her legs and rests one elbow on the chair arm.\n          body: leaning slightly to one side\n          legs: crossed at knee, foot dangling\n          arms: elbow on armrest\n          hands: chin resting on fingertips\n          head: tilted, gaze steady\n          expression: thoughtful smirk\n          props: [chair]\n          image_prompt: sitting on chair, legs crossed, elbow on armrest, chin on hand\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [cross, elbow]\n        - id: chair_perch\n          name: Edge Perch\n          posture: seated\n          description: Perches on the front edge with her torso angled forward.\n          body: leaning forward, back arched\n          legs: knees apart slightly, heels lifted\n          arms: hands braced on knees\n          hands: palms flat on knees\n          head: chin down, eyes up\n          expression: eager, teasing\n          props: [chair]\n          image_prompt: sitting on edge of chair, leaning forward, hands on knees, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [edge, forward]\n        - id: chair_tilt\n          name: Tilted Back\n          posture: seated\n          description: Leans back with the chair tilted and one foot propped.\n          body: reclined, relaxed shoulders\n          legs: one foot propped on edge of table or rung, other extended\n          arms: hands behind head\n          hands: fingers laced behind head\n          head: tilted back, eyes half-lidded\n          expression: lazy confidence\n          props: [chair]\n          image_prompt: leaning back in chair, hands behind head, foot propped, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tilt, lean back]\n        - id: chair_sideways\n          name: Sideways Sit\n          posture: seated\n          description: Sits sideways with both legs draped over the chair arm.\n          body: twisted, back against the other arm\n          legs: both legs over armrest, ankles crossed\n          arms: one arm along backrest\n          hands: fingers trailing loosely\n          head: turned toward viewer, gaze playful\n          expression: mischievous grin\n          props: [chair]\n          image_prompt: sitting sideways in chair, legs over armrest, arm along backrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sideways, drape]\n        - id: chair_legs_raised\n          name: Legs Raised\n          posture: seated\n          description: Reclines deeply in the chair with one leg lifted high and the other knee bent.\n          body: reclined deep into chair, torso angled\n          legs: one leg raised high in the air, other knee bent with foot on desk edge\n          arms: one hand resting on raised thigh\n          hands: fingers resting on thigh\n          head: tilted, gaze direct\n          expression: smoldering, confident\n          props: [office chair, desk]\n          image_prompt: reclined in office chair, one leg raised high, other knee bent, hand on thigh, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [raised, reclined]\n        - id: chair_feet_on_desk\n          name: Feet on Desk\n          posture: seated\n          description: Reclines in the chair with both legs extended and heels resting on the desk.\n          body: reclined, shoulders relaxed, torso angled toward viewer\n          legs: both legs fully extended, heels resting on desk\n          arms: arms bent in front of lap\n          hands: both hands holding at her waist\n          head: tilted, eyes direct\n          expression: playful, knowing smile\n          props: [office chair, desk]\n          image_prompt: reclined in office chair, both legs extended, heels on desk, hands at waist, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [feet, desk]\n        - id: chair_wide_grip\n          name: Gripping the Seat\n          posture: seated\n          description: Sits in a low chair with knees wide, torso leaning slightly forward and hands gripping the seat edges.\n          body: leaning slightly forward, shoulders drawn in\n          legs: knees wide apart, feet planted flat and apart\n          arms: both arms down and in, elbows slightly bent\n          hands: fingers gripping the seat edge beside the hips\n          head: tilted, chin lowered, eyes up\n          expression: coy smirk\n          props: [chair]\n          image_prompt: sitting in low chair, knees wide, hands gripping seat edges, leaning forward, chin down, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [grip, wide]\n\n    bed_lying:\n      subtitle: Lying on the Bed\n      environment: bedroom bed\n      triggers: [bed, \"lie down\", \"on the bed\", \"lying\"]\n      exit_triggers: [\"get up\", \"sit up\", \"leave the bed\"]\n      entry: lies down on the bed\n      default_activity: resting\n      activities:\n        resting:\n          description: lying and relaxing\n          triggers: [rest, relax, sleep]\n          selection: random\n          poses: [bed_back_stretch, bed_side, bed_curl, bed_side_crossed]\n        playful:\n          description: lying in a teasing pose\n          triggers: [tease, roll, play]\n          selection: random\n          poses: [bed_stomach, bed_propped, bed_forearms_hips_up, bed_hands_knees]\n      poses:\n        - id: bed_back_stretch\n          name: Back Stretch\n          posture: lying\n          description: Lies on her back with arms stretched above her head.\n          body: flat on back, spine slightly arched\n          legs: one knee bent, other extended\n          arms: both arms overhead\n          hands: fingers loosely curled on pillow\n          head: turned to one side, gaze toward viewer\n          expression: sleepy smile\n          props: [pillow]\n          image_prompt: lying on back on bed, arms overhead, one knee bent, stretching\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stretch, back]\n        - id: bed_side\n          name: Side Recline\n          posture: lying\n          description: Lies on her side propped on one elbow.\n          body: side-lying, torso lifted on elbow\n          legs: stacked, top knee bent forward\n          arms: lower elbow supporting head\n          hands: free hand resting on hip\n          head: held up by hand, eyes direct\n          expression: warm, inviting\n          props: [pillow]\n          image_prompt: lying on side on bed, propped on elbow, hand on hip, knee bent\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [side, elbow]\n        - id: bed_curl\n          name: Curled Sleep\n          posture: lying\n          description: Curls into a ball on her side hugging a pillow.\n          body: curled, shoulders rounded\n          legs: knees drawn toward chest\n          arms: both arms around pillow\n          hands: gripping pillow\n          head: nestled into pillow, eyes half-closed\n          expression: peaceful\n          props: [pillow]\n          image_prompt: curled up on bed, hugging pillow, knees to chest, side view\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [curl, sleep]\n        - id: bed_stomach\n          name: Stomach Kick\n          posture: lying\n          description: Lies on her stomach with ankles crossed in the air.\n          body: prone, chest raised on forearms\n          legs: knees bent, ankles crossed in air\n          arms: forearms flat on mattress\n          hands: chin resting on stacked fists\n          head: lifted, gaze forward\n          expression: playful grin\n          props: []\n          image_prompt: lying on stomach on bed, ankles crossed in air, chin on hands\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stomach, kick]\n        - id: bed_propped\n          name: Propped on Pillows\n          posture: lying\n          description: Reclines against stacked pillows with one leg bent.\n          body: semi-upright, back against pillows\n          legs: one knee up, other flat\n          arms: one arm behind head\n          hands: other hand resting on stomach\n          head: tilted back, eyes lidded\n          expression: languid\n          props: [pillows]\n          image_prompt: reclining on bed against pillows, one knee up, hand behind head\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [propped, pillows]\n        - id: bed_side_crossed\n          name: Side Recline, Ankles Crossed\n          posture: lying\n          description: Lies propped on one side with legs extended and crossed at the ankles, holding the edges of a jacket.\n          body: side-lying, upper body propped up\n          legs: legs extended, ankles crossed\n          arms: both arms bent in front of chest\n          hands: both hands holding jacket edges\n          head: tilted, eyes up toward viewer\n          expression: sultry\n          props: []\n          image_prompt: lying on side on bed, propped up, legs extended, ankles crossed, hands holding jacket, viewed from above\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [crossed, jacket]\n        - id: bed_forearms_hips_up\n          name: Forearms and Knees\n          posture: kneeling\n          description: Rests on forearms and knees on the bed, hips raised, looking back at the viewer.\n          body: forearms down, hips raised, back arched\n          legs: knees apart, lower legs resting flat\n          arms: both forearms flat on mattress\n          hands: hands folded under chin\n          head: turned back toward viewer\n          expression: sly, playful\n          props: []\n          image_prompt: on forearms and knees on bed, back arched, looking back over shoulder, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [forearms, knees]\n        - id: bed_hands_knees\n          name: Hands and Knees on Bed\n          posture: kneeling\n          description: Rests on hands and knees on the bed with lower legs flat, looking back over her shoulder.\n          body: horizontal, spine slightly arched\n          legs: knees apart, lower legs resting flat behind\n          arms: arms straight, shoulders over wrists\n          hands: palms flat on the mattress\n          head: turned back over shoulder, gaze direct\n          expression: playful, warm\n          props: [bed]\n          image_prompt: on hands and knees on bed, lower legs flat, looking back over shoulder, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hands and knees, crawl]\n\n    room_standing:\n      subtitle: Standing in the Room\n      environment: bedroom\n      triggers: [standing, stand, \"in the room\", \"stands\"]\n      exit_triggers: [\"sit down\", \"lie down\", \"kneel\"]\n      entry: stands in the middle\n      default_activity: posing\n      activities:\n        posing:\n          description: posing confidently\n          triggers: [pose, confident, hips]\n          selection: random\n          poses: [stand_hip, stand_arms_crossed, stand_over_shoulder, stand_hands_knees]\n        idle:\n          description: standing casually\n          triggers: [wait, idle, casual]\n          selection: random\n          poses: [stand_hand_hair, stand_stretch, stand_lean_papers]\n      poses:\n        - id: stand_hip\n          name: Hip Pop\n          posture: standing\n          description: Stands with weight on one leg and a hand on her hip.\n          body: weight shifted, hip jutting out\n          legs: one leg straight, other bent, toe pointing out\n          arms: one hand on hip, other at side\n          hands: fingers splayed on hip\n          head: tilted, gaze direct\n          expression: confident smile\n          props: []\n          image_prompt: standing, weight on one leg, hand on hip, hip tilted, confident\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [hip, confident]\n        - id: stand_arms_crossed\n          name: Arms Crossed\n          posture: standing\n          description: Stands with arms crossed beneath her chest and feet apart.\n          body: upright, shoulders squared\n          legs: feet shoulder-width apart\n          arms: crossed under chest\n          hands: fingers resting on opposite elbows\n          head: chin raised, eyes level\n          expression: challenging smirk\n          props: []\n          image_prompt: standing, arms crossed, feet apart, chin raised, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [crossed, arms]\n        - id: stand_over_shoulder\n          name: Over the Shoulder\n          posture: standing\n          description: Stands with her back to the viewer, glancing over her shoulder.\n          body: turned away, torso twisted back\n          legs: one foot slightly ahead\n          arms: hands behind or at sides\n          hands: fingers loosely clasped behind her\n          head: turned over shoulder, eyes direct\n          expression: coy, knowing\n          props: []\n          image_prompt: standing from behind, looking over shoulder, torso twisted, hands clasped behind\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [shoulder, behind]\n        - id: stand_hand_hair\n          name: Hand in Hair\n          posture: standing\n          description: Stands relaxed and runs one hand up through her hair.\n          body: slightly arched, chest open\n          legs: feet together, one knee softly bent\n          arms: one arm raised to head\n          hands: fingers threading through hair\n          head: tilted back slightly, eyes half-closed\n          expression: relaxed, sultry\n          props: []\n          image_prompt: standing, hand in hair, arm raised, head tilted back, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [hair, raise]\n        - id: stand_stretch\n          name: Standing Stretch\n          posture: standing\n          description: Stretches both arms overhead with her back arching.\n          body: elongated, back arched\n          legs: feet apart, up on toes\n          arms: both arms overhead, fingers interlaced\n          hands: palms facing up\n          head: tilted back, eyes closed\n          expression: contented sigh\n          props: []\n          image_prompt: standing stretch, arms overhead, back arched, on tiptoes, eyes closed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stretch, yawn]\n        - id: stand_hands_knees\n          name: Hands on Knees\n          posture: standing\n          description: Stands bent forward with both hands resting on her knees, looking at the viewer.\n          body: bent forward at the hips, torso angled toward viewer\n          legs: knees bent and together, feet apart\n          arms: arms straight down to the knees\n          hands: both hands resting on the knees\n          head: raised, eyes direct\n          expression: open, wide-eyed\n          props: []\n          image_prompt: standing bent forward, hands on knees, knees bent, looking at viewer\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [bend, knees]\n        - id: stand_lean_papers\n          name: Leaning Over Papers\n          posture: standing\n          description: Leans a hip against a shelf with one hand flat on a stack of papers and the other at her neckline, looking down.\n          body: weight shifted, hip against shelf, slight twist\n          legs: one leg straight, other knee bent forward and out\n          arms: one arm extended to the surface, other bent to the chest\n          hands: one hand flat on papers, other at the neckline\n          head: turned toward the surface, gaze lowered\n          expression: absorbed, curious\n          props: [shelf, papers]\n          image_prompt: standing, hip against shelf, hand flat on papers, other hand at neckline, looking down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [papers, shelf, lean]\n\n    meal_table:\n      subtitle: Having a Meal\n      environment: kitchen table\n      triggers: [meal, eat, dinner, lunch, breakfast, \"having dinner\", \"have dinner\", \"for dinner\", \"at the table\", \"sit at the table\"]\n      exit_triggers: [\"finished eating\", \"clear the table\", \"leave the table\"]\n      entry: sits at the table\n      default_activity: eating\n      activities:\n        eating:\n          description: eating a meal\n          triggers: [eat, bite, fork]\n          selection: random\n          poses: [meal_fork, meal_sip, meal_lean]\n        chatting:\n          description: talking over food\n          triggers: [talk, chat, laugh]\n          selection: random\n          poses: [meal_chin_hand, meal_feed]\n      poses:\n        - id: meal_fork\n          name: Fork to Lips\n          posture: seated\n          description: Raises a forkful of food to her lips.\n          body: upright, slight forward lean\n          legs: legs crossed under table\n          arms: one elbow on table, other hand holding fork\n          hands: fork raised, other hand on table\n          head: tilted slightly, eyes on viewer\n          expression: playful\n          props: [fork, plate]\n          image_prompt: sitting at table, raising fork to lips, eating, eye contact\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [fork, bite]\n        - id: meal_sip\n          name: Sipping Drink\n          posture: seated\n          description: Sips from a glass with her gaze over the rim.\n          body: leaning back slightly\n          legs: crossed at the ankle\n          arms: one arm bent holding glass\n          hands: fingers around glass stem\n          head: tilted, eyes over rim\n          expression: knowing look\n          props: [glass]\n          image_prompt: sitting at table, sipping glass, eyes over rim, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sip, drink]\n        - id: meal_lean\n          name: Elbows on Table\n          posture: seated\n          description: Leans forward with both elbows on the table.\n          body: forward lean, shoulders relaxed\n          legs: feet tucked back\n          arms: both elbows on table\n          hands: hands clasped under chin\n          head: chin on hands, eyes bright\n          expression: attentive, warm\n          props: [table]\n          image_prompt: sitting at table, leaning forward, elbows on table, chin on clasped hands\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [elbows, lean]\n        - id: meal_chin_hand\n          name: Chin in Hand\n          posture: seated\n          description: Rests her cheek on one hand and toys with her food.\n          body: slouched slightly, relaxed\n          legs: one knee over the other\n          arms: one elbow on table\n          hands: free hand pushing food with fork\n          head: tilted into hand, eyes lowered then up\n          expression: amused\n          props: [fork, plate]\n          image_prompt: sitting at table, cheek on hand, poking food with fork, amused\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chin, toy]\n        - id: meal_feed\n          name: Offering a Bite\n          posture: seated\n          description: Holds out a bite of food on a fork toward the viewer.\n          body: leaning forward, arm extended\n          legs: feet flat under table\n          arms: one arm extended\n          hands: fork offered, other hand beneath it\n          head: tilted, eyes direct\n          expression: inviting smile\n          props: [fork]\n          image_prompt: sitting at table, offering fork forward, leaning in, inviting smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [offer, feed]\n\n    kitchen_cooking:\n      subtitle: Cooking\n      environment: kitchen\n      triggers: [cook, cooking, \"in the kitchen\", stove]\n      exit_triggers: [\"dinner is ready\", \"stop cooking\", \"leave the kitchen\"]\n      entry: turns to the stove\n      default_activity: stirring\n      activities:\n        stirring:\n          description: stirring and tasting\n          triggers: [stir, taste, pan]\n          selection: random\n          poses: [cook_stir, cook_taste, cook_lean_counter]\n        prepping:\n          description: chopping and preparing\n          triggers: [chop, prep, knife]\n          selection: random\n          poses: [cook_chop, cook_reach_shelf]\n      poses:\n        - id: cook_stir\n          name: Stirring Pot\n          posture: standing\n          description: Stands at the stove stirring a pot with a wooden spoon.\n          body: slight forward lean, shoulders relaxed\n          legs: feet apart, weight shifted\n          arms: one arm extended with spoon\n          hands: one hand on spoon, other on counter\n          head: lowered toward pot, eyes sideways\n          expression: focused, content\n          props: [pot, spoon]\n          image_prompt: standing at stove, stirring pot with spoon, leaning slightly, looking sideways\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stir, pot]\n        - id: cook_taste\n          name: Tasting Spoon\n          posture: standing\n          description: Lifts a spoon to her lips to taste with her free hand cupped beneath.\n          body: upright, head tilted\n          legs: feet together\n          arms: one arm raised, other hand under spoon\n          hands: spoon at lips, palm cupped below\n          head: tilted, eyes closed or lowered\n          expression: savoring\n          props: [spoon]\n          image_prompt: standing, tasting spoon, hand cupped beneath, eyes closed, savoring\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [taste, spoon]\n        - id: cook_lean_counter\n          name: Leaning on Counter\n          posture: standing\n          description: Leans a hip on the counter while waiting, arms folded.\n          body: leaning sideways, relaxed\n          legs: legs crossed at ankle\n          arms: folded in front\n          hands: fingers tucked into elbows\n          head: tilted, eyes on viewer\n          expression: patient, teasing\n          props: [counter]\n          image_prompt: standing, hip against counter, arms folded, legs crossed at ankle, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [lean, wait]\n        - id: cook_chop\n          name: Chopping\n          posture: standing\n          description: Chops vegetables with her focus on the board.\n          body: bent slightly forward over counter\n          legs: feet shoulder-width apart\n          arms: both arms forward, elbows bent\n          hands: one holding knife, other steadying vegetable\n          head: lowered, eyes on board\n          expression: concentrated\n          props: [knife, cutting board]\n          image_prompt: standing at counter, chopping vegetables, leaning forward, focused\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chop, knife]\n        - id: cook_reach_shelf\n          name: Reaching Up\n          posture: standing\n          description: Rises on tiptoe to reach a jar on a high shelf.\n          body: stretched upward, back lengthened\n          legs: up on tiptoes, one knee slightly bent\n          arms: one arm fully extended upward\n          hands: fingers stretching toward jar, other hand on counter\n          head: tilted back, eyes on shelf\n          expression: determined, amused\n          props: [shelf, jar]\n          image_prompt: standing on tiptoe, reaching high shelf, arm extended, other hand on counter\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [reach, shelf]\n\n    wall_lean:\n      subtitle: Leaning Against Wall\n      environment: hallway wall\n      triggers: [wall, \"against the wall\", \"lean on the wall\", leaning]\n      exit_triggers: [\"step away\", \"walk off\", \"push off\"]\n      entry: leans back against the wall\n      default_activity: casual_lean\n      activities:\n        casual_lean:\n          description: leaning back casually\n          triggers: [casual, lean, relax]\n          selection: random\n          poses: [wall_back, wall_shoulder, wall_foot_up]\n        inviting:\n          description: leaning in invitingly\n          triggers: [lure, beckon, near]\n          selection: random\n          poses: [wall_hand_beside, wall_beckon]\n      poses:\n        - id: wall_back\n          name: Back to Wall\n          posture: standing\n          description: Leans her back flat against the wall with arms crossed.\n          body: back flat on wall, shoulders relaxed\n          legs: feet forward, one knee slightly bent\n          arms: crossed in front\n          hands: fingers on opposite arms\n          head: tilted, eyes direct\n          expression: cool, amused\n          props: [wall]\n          image_prompt: standing, back against wall, arms crossed, knee bent, cool look\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [back, arms]\n        - id: wall_shoulder\n          name: Shoulder Lean\n          posture: standing\n          description: Leans a shoulder on the wall with one hand in her pocket.\n          body: turned sideways, shoulder to wall\n          legs: ankles crossed\n          arms: one hand in pocket\n          hands: other hand resting on wall\n          head: tilted toward viewer\n          expression: easy smirk\n          props: [wall]\n          image_prompt: leaning shoulder on wall, hand in pocket, ankles crossed, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [shoulder, pocket]\n        - id: wall_foot_up\n          name: Foot on Wall\n          posture: standing\n          description: Leans back with one foot planted flat on the wall behind her.\n          body: leaning back, hips forward\n          legs: one leg straight, other knee bent with sole on wall\n          arms: arms loose at sides\n          hands: palms flat on wall\n          head: tilted back against wall, eyes lidded\n          expression: nonchalant\n          props: [wall]\n          image_prompt: leaning on wall, one foot on wall, palms on wall, nonchalant\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [foot, bent knee]\n        - id: wall_hand_beside\n          name: Hand Beside Her Head\n          posture: standing\n          description: Leans with one forearm on the wall beside her head, facing the viewer.\n          body: turned toward viewer, one shoulder on wall\n          legs: feet apart slightly\n          arms: one forearm on wall above head\n          hands: other hand on hip\n          head: tilted against forearm, eyes direct\n          expression: confident, inviting\n          props: [wall]\n          image_prompt: leaning on wall, forearm above head, hand on hip, facing viewer, inviting\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [forearm, beside]\n        - id: wall_beckon\n          name: Beckoning Finger\n          posture: standing\n          description: Leans on the wall and beckons the viewer closer with one finger.\n          body: relaxed lean, hips tilted\n          legs: legs crossed at ankle\n          arms: one arm extended toward viewer\n          hands: index finger curling to beckon\n          head: head tilted, eyes direct\n          expression: sly smile\n          props: [wall]\n          image_prompt: leaning on wall, beckoning with finger, ankles crossed, sly smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [beckon, finger]\n          distance: [apart, near]\n    desk_perch:\n      subtitle: Perched on Desk\n      environment: office desk\n      triggers: [desk, laptop, computer, \"on the desk\", \"at the desk\", \"at her desk\", \"office desk\", \"sit on the desk\"]\n      exit_triggers: [\"get off the desk\", \"stand up\", \"leave the desk\"]\n      entry: perches on the desk edge\n      default_activity: sitting_on_desk\n      activities:\n        sitting_on_desk:\n          description: sitting on the desk\n          triggers: [sit, perch, edge]\n          selection: random\n          poses: [desk_side_perch, desk_knees_apart, desk_knee_recline, desk_feet_planted]\n        leaning_on_desk:\n          description: leaning against the desk\n          triggers: [lean, pose, stretch]\n          selection: random\n          poses: [desk_hip_lean, desk_foot_up, desk_bend_knee_up]\n        working_at_desk:\n          description: seated at the desk working\n          triggers: [work, type, laptop, computer]\n          selection: random\n          poses: [desk_seated_typing]\n      poses:\n        - id: desk_side_perch\n          name: Side Perch\n          posture: seated\n          description: Sits on the desk edge with both legs extended long toward the floor.\n          body: upright, torso angled toward viewer\n          legs: legs extended and angled to one side, feet pointed\n          arms: one hand on thigh, other hand resting on knee\n          hands: fingers resting lightly on knee\n          head: tilted slightly, gaze direct\n          expression: poised, confident\n          props: [desk]\n          image_prompt: sitting on desk edge, legs extended long, hands on thigh and knee, torso angled, poised\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [side, edge]\n        - id: desk_knees_apart\n          name: Leaning Back, Knees Apart\n          posture: seated\n          description: Sits on the desktop leaning back with knees apart and one hand on her ankle.\n          body: leaning back, shoulders relaxed\n          legs: knees wide apart, feet planted flat on desktop\n          arms: one arm reaching down, other braced behind\n          hands: one hand holding ankle\n          head: tilted to the side, gaze direct\n          expression: confident, smoldering\n          props: [desk]\n          image_prompt: sitting on desk, leaning back, knees apart, feet on desktop, hand on ankle, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [knees, apart]\n        - id: desk_knee_recline\n          name: Knee-Up Recline\n          posture: seated\n          description: Reclines on the desktop propped on one hand with one knee raised high.\n          body: leaning back and sideways, propped on one arm\n          legs: one knee raised high, other leg extended along desk\n          arms: one arm braced behind, other resting on desk\n          hands: fingers splayed on desktop\n          head: tilted, gaze toward viewer\n          expression: warm, playful smile\n          props: [desk]\n          image_prompt: sitting on desk, leaning back on one hand, one knee raised, other leg extended, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [recline, knee]\n        - id: desk_feet_planted\n          name: Feet Planted\n          posture: seated\n          description: Sits on the desk with knees apart and feet planted, leaning forward slightly.\n          body: leaning forward, shoulders rounded in\n          legs: knees apart, both feet flat on desktop\n          arms: both elbows tucked in\n          hands: both hands clasped together at the chest\n          head: tilted, chin lowered, eyes up\n          expression: coy, knowing\n          props: [desk]\n          image_prompt: sitting on desk, knees apart, feet flat on desktop, hands clasped at chest, chin down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [feet, clasp]\n        - id: desk_hip_lean\n          name: Hip Against Desk\n          posture: standing\n          description: Leans one hip against the desk edge with one hand gripping it and the other behind her neck.\n          body: torso arched, leaning sideways into desk\n          legs: legs crossed loosely, one foot forward\n          arms: one hand gripping desk edge, other raised behind neck\n          hands: fingers curled over desk edge\n          head: tilted back, eyes closed\n          expression: dreamy, sultry\n          props: [desk]\n          image_prompt: standing, hip against desk, hand behind neck, back arched, head tilted back, eyes closed\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hip, neck]\n        - id: desk_foot_up\n          name: One Foot Up\n          posture: standing\n          description: Stands against the desk with one foot raised and resting behind her, both hands in her hair.\n          body: twisted toward viewer, hips against desk\n          legs: standing leg straight, other knee bent with foot raised behind\n          arms: both arms raised overhead\n          hands: fingers running through hair\n          head: tilted, looking toward viewer\n          expression: playful smile\n          props: [desk]\n          image_prompt: standing, one foot raised behind, hips against desk, both hands in hair, twisted torso, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [foot, hair]\n        - id: desk_bend_knee_up\n          name: Knee on Desk\n          posture: standing\n          description: Leans forward onto the desk with one knee raised onto it, looking back over her shoulder.\n          body: bent forward at waist, torso resting on desk edge\n          legs: one leg straight on floor, other knee raised onto desk\n          arms: forearm braced on desktop\n          hands: other hand on desk edge\n          head: turned over shoulder, gaze direct\n          expression: coy, direct\n          props: [desk]\n          image_prompt: leaning on desk, one knee raised onto desk, looking over shoulder, forearm braced\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [knee, over shoulder]\n        - id: desk_seated_typing\n          name: Working at Laptop\n          posture: seated\n          description: Sits at a desk facing it with knees wide, one hand on a laptop and the other at her collar, gazing at the screen.\n          body: upright, turned slightly toward the screen\n          legs: knees wide apart, feet planted flat on the floor\n          arms: one arm forward on the desk, other bent to the chest\n          hands: one hand on the laptop, other at the neckline\n          head: turned toward the screen, gaze on the screen\n          expression: absorbed, curious\n          props: [desk, laptop, office chair]\n          image_prompt: seated at desk, knees wide, hand on laptop, other hand at collar, looking at screen\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [laptop, work, type]\n\n    bed_sitting:\n      subtitle: Sitting on the Bed\n      environment: bedroom bed\n      triggers: [\"sit on the bed\", \"sits on the bed\", \"edge of the bed\", \"sitting on the bed\"]\n      exit_triggers: [\"get up\", \"stand up\", \"lie back\"]\n      entry: sits on the bed edge\n      default_activity: edge_sit\n      activities:\n        edge_sit:\n          description: sitting on the bed edge\n          triggers: [edge, sit, perch]\n          selection: random\n          poses: [bedsit_edge_holding, bedsit_arms_overhead, bedsit_edge_cross]\n        leaning:\n          description: leaning in or back\n          triggers: [lean, recline, headboard]\n          selection: random\n          poses: [bedsit_headboard, bedsit_lean_forward, bedsit_headboard_kneel]\n      poses:\n        - id: bedsit_headboard\n          name: Against Headboard\n          posture: seated\n          description: Reclines against the pillows with knees raised and apart and one hand behind her head.\n          body: leaning back against pillows, relaxed\n          legs: knees raised and apart, feet flat on mattress\n          arms: one arm raised behind head\n          hands: fingers touching hair behind ear\n          head: tilted, eyes direct\n          expression: sly, inviting\n          props: [pillows, headboard]\n          image_prompt: sitting against headboard, knees raised, hand behind head, reclined, head tilted, sly smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [headboard, pillows]\n        - id: bedsit_edge_holding\n          name: Holding a Coat\n          posture: seated\n          description: Sits on the bed edge with knees apart, holding a coat draped across her lap.\n          body: slight lean toward viewer, one shoulder dropped\n          legs: knees apart, lower legs crossed at the ankle\n          arms: both arms resting on the coat in her lap\n          hands: both hands gripping the coat\n          head: tilted, eyes direct\n          expression: playful, lips parted\n          props: [coat]\n          image_prompt: sitting on bed edge, knees apart, ankles crossed, holding coat in lap, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [coat, hold]\n        - id: bedsit_arms_overhead\n          name: Arms Overhead\n          posture: seated\n          description: Sits on the bed edge with both arms raised and hands clasped above her head.\n          body: upright, back slightly arched, chest lifted\n          legs: knees apart, feet flat on floor\n          arms: both arms raised overhead\n          hands: hands clasped above head\n          head: tilted, gaze direct\n          expression: confident, sultry\n          props: []\n          image_prompt: sitting on bed edge, arms raised overhead, hands clasped, knees apart, back arched\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [arms, overhead]\n        - id: bedsit_lean_forward\n          name: Leaning Toward Viewer\n          posture: seated\n          description: Leans toward the viewer holding the front of her top closed with both hands.\n          body: torso leaning forward, shoulders rounded\n          legs: knees together, feet tucked beneath bed edge\n          arms: elbows pressed in\n          hands: both hands holding top closed at chest\n          head: chin lowered, eyes up\n          expression: coy, teasing\n          props: []\n          image_prompt: sitting on bed, leaning forward, hands at chest, elbows in, chin down, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [lean, collar]\n          distance: [near, close]\n        - id: bedsit_edge_cross\n          name: Crossed at the Edge\n          posture: seated\n          description: Sits on the bed edge with legs crossed, leaning back on both hands.\n          body: leaning back, chest open\n          legs: legs crossed at the knee, top foot pointed\n          arms: both arms straight behind her\n          hands: palms flat on mattress\n          head: tilted back slightly, gaze direct\n          expression: relaxed, flirty\n          props: []\n          image_prompt: sitting on bed edge, legs crossed, leaning back on hands, head tilted back\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [cross, hands]\n        - id: bedsit_headboard_kneel\n          name: Facing Headboard\n          posture: kneeling\n          description: Kneels on the bed facing the headboard with forearms resting on it, looking back over her shoulder with a fingertip at her lips.\n          body: leaning forward onto the headboard, back arched, torso twisted\n          legs: knees apart, kneeling on the mattress\n          arms: forearms stacked along the top of the headboard\n          hands: one hand raised with fingertip to lips\n          head: turned back over shoulder, eyes sideways\n          expression: coy, teasing\n          props: [bed, headboard]\n          image_prompt: kneeling on bed facing headboard, forearms on headboard, looking over shoulder, fingertip at lips\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [headboard, kneel]\n\n    bedside_standing:\n      subtitle: Standing by the Bed\n      environment: bedside\n      triggers: [bedside, \"beside the bed\", \"by the bed\", \"next to the bed\"]\n      exit_triggers: [\"get on the bed\", \"sit down\", \"walk away\"]\n      entry: stops beside the bed\n      default_activity: standing_pose\n      activities:\n        standing_pose:\n          description: posing upright by the bed\n          triggers: [stand, pose, glance]\n          selection: random\n          poses: [bedside_arms_up, bedside_rail_glance]\n        bending_low:\n          description: bending or crouching low\n          triggers: [bend, crouch, reach]\n          selection: random\n          poses: [bedside_bend_thighs, bedside_bend_low, bedside_squat]\n      poses:\n        - id: bedside_arms_up\n          name: Hands Behind Head\n          posture: standing\n          description: Stands with feet wide and both arms raised, hands behind her head.\n          body: hip tilted, torso stretched, chest lifted\n          legs: feet wide apart, weight on one leg\n          arms: both arms raised, elbows out\n          hands: fingers laced behind head\n          head: chin lowered, eyes direct\n          expression: confident, smoldering\n          props: [bed]\n          image_prompt: standing, feet apart, both hands behind head, elbows out, hip tilted, chin down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [arms, elbows]\n        - id: bedside_rail_glance\n          name: Rail Glance\n          posture: standing\n          description: Stands with her back to the viewer, leaning against the bed rail and glancing over her shoulder.\n          body: back to viewer, torso twisted, leaning on rail\n          legs: feet together, legs straight\n          arms: one hand resting at hip\n          hands: other hand lightly on rail\n          head: over shoulder, eyes direct\n          expression: coy smile\n          props: [bed rail]\n          image_prompt: standing from behind, leaning on bed rail, looking over shoulder, hand on hip, feet together\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [rail, shoulder]\n          distance: [apart, near]\n        - id: bedside_bend_thighs\n          name: Hands on Thighs\n          posture: standing\n          description: Bends forward at the waist beside the bed with hands resting on her thighs.\n          body: bent forward, back flat, seen from behind\n          legs: feet apart, knees slightly bent\n          arms: arms extended down\n          hands: palms resting on thighs\n          head: lowered, hair falling forward\n          expression: unseen, head dipped\n          props: [bed]\n          image_prompt: standing bent forward at waist, hands on thighs, feet apart, from behind, low angle\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [thighs, bend]\n        - id: bedside_bend_low\n          name: Deep Bend\n          posture: standing\n          description: Folds deeply forward with legs wide and one hand on her shin.\n          body: folded forward, torso hanging low\n          legs: legs wide apart, straight\n          arms: one arm hanging, other reaching to shin\n          hands: one hand gripping shin\n          head: hanging low, hair falling forward\n          expression: unseen, head down\n          props: [bed]\n          image_prompt: deep forward bend, legs wide, hand on shin, head hanging, from behind, low angle\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [deep, shin]\n        - id: bedside_squat\n          name: Crouched Twist\n          posture: squatting\n          description: Crouches in a deep squat beside the bed, twisting back with one arm extended behind her.\n          body: deep squat, torso twisted toward viewer\n          legs: knees bent deeply, feet planted flat\n          arms: one arm extended back for balance\n          hands: loose open hand\n          head: turned over shoulder, eyes direct\n          expression: intense, direct\n          props: [bed]\n          image_prompt: deep squat beside bed, torso twisted, one arm extended behind, looking over shoulder\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [squat, crouch]\n",
    "physical.yaml": "scenes:\n  provocative:\n    floor_kneeling:\n      subtitle: Kneeling on the Floor\n      environment: bedroom floor\n      triggers: [kneel, kneeling, \"on the floor\", \"on her knees\"]\n      exit_triggers: [\"stand up\", \"get up\", \"rise\"]\n      entry: sinks to her knees\n      default_activity: upright_kneel\n      activities:\n        upright_kneel:\n          description: kneeling tall\n          triggers: [tall, upright, kneel]\n          selection: random\n          poses: [floor_tall, floor_sit_heels, floor_one_knee]\n        low_kneel:\n          description: kneeling low or leaning\n          triggers: [low, lean, crawl]\n          selection: random\n          poses: [floor_hands_knees, floor_side_sit]\n      poses:\n        - id: floor_tall\n          name: Tall Kneel\n          posture: kneeling\n          description: Kneels tall with thighs vertical and hands on her thighs.\n          body: upright, hips over knees, shoulders back\n          legs: knees hip-width apart, tops of feet on floor\n          arms: relaxed at sides\n          hands: palms resting on thighs\n          head: chin level, eyes forward\n          expression: calm, attentive\n          props: []\n          image_prompt: kneeling upright on floor, hands on thighs, back straight\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tall, upright]\n        - id: floor_sit_heels\n          name: Sitting on Heels\n          posture: kneeling\n          description: Sits back on her heels with hands folded in her lap.\n          body: sitting low, back straight\n          legs: knees together, feet beneath\n          arms: forearms in lap\n          hands: fingers interlaced\n          head: slightly bowed, eyes lifted\n          expression: demure\n          props: []\n          image_prompt: kneeling sitting on heels, hands in lap, knees together\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [heels, sit back]\n        - id: floor_one_knee\n          name: One Knee Up\n          posture: kneeling\n          description: Rests on one knee with the other foot planted flat.\n          body: leaning slightly forward\n          legs: one knee down, other foot flat in front\n          arms: forearm resting on raised knee\n          hands: hand dangling off knee\n          head: tilted, gaze direct\n          expression: confident smirk\n          props: []\n          image_prompt: half kneeling on one knee, forearm on raised knee, leaning forward\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [one knee, half]\n        - id: floor_hands_knees\n          name: Hands and Knees\n          posture: kneeling\n          description: Supports herself on hands and knees with her head lifted.\n          body: horizontal, spine neutral\n          legs: knees hip-width apart\n          arms: arms straight, shoulders over wrists\n          hands: palms flat on floor\n          head: raised, looking forward\n          expression: curious, playful\n          props: []\n          image_prompt: on hands and knees on floor, head raised, looking at viewer\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [crawl, hands and knees]\n        - id: floor_side_sit\n          name: Side Sit\n          posture: kneeling\n          description: Sits beside her folded legs with one hand braced on the floor.\n          body: leaning on braced arm, hips to the side\n          legs: both knees bent to one side, feet tucked\n          arms: one arm braced on floor\n          hands: palm flat on floor\n          head: tilted toward shoulder, eyes up\n          expression: soft smile\n          props: []\n          image_prompt: sitting sideways on floor, legs folded to side, one hand on floor\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [side, mermaid]\n\n    chair_straddle:\n      subtitle: Straddling a Chair\n      environment: bedroom chair\n      triggers: [straddle, \"backwards chair\", \"sit backwards\", \"straddling\"]\n      exit_triggers: [\"stand up\", \"get off\", \"turn around\"]\n      entry: swings a leg over\n      default_activity: backward_sit\n      activities:\n        backward_sit:\n          description: sitting backward on chair\n          triggers: [backward, sit, lean]\n          selection: random\n          poses: [strad_rest_chin, strad_arms_back, strad_tilt]\n        playful:\n          description: teasing from the chair\n          triggers: [tease, smirk, grip]\n          selection: random\n          poses: [strad_grip, strad_rock]\n      poses:\n        - id: strad_rest_chin\n          name: Chin on Backrest\n          posture: seated\n          description: Sits backward with her chin resting on her folded arms over the backrest.\n          body: leaning forward onto backrest\n          legs: legs straddling seat, knees wide, feet flat\n          arms: folded across top of backrest\n          hands: fingers tucked under elbows\n          head: chin on forearms, gaze direct\n          expression: teasing smile\n          props: [chair]\n          image_prompt: sitting backwards on chair, chin on arms on backrest, legs straddling\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chin, rest]\n        - id: strad_arms_back\n          name: Arms on Backrest\n          posture: seated\n          description: Sits backward with her arms spread along the top of the backrest.\n          body: upright, chest forward\n          legs: knees wide, feet flat or on toes\n          arms: both arms draped along backrest\n          hands: fingers curled over the top rail\n          head: tilted, eyes forward\n          expression: confident smirk\n          props: [chair]\n          image_prompt: straddling chair backwards, arms spread along backrest, upright, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [arms, spread]\n        - id: strad_tilt\n          name: Tipped Forward\n          posture: seated\n          description: Leans far forward over the backrest so only her toes touch the floor.\n          body: tilted forward, weight on backrest\n          legs: straddling seat, heels lifted\n          arms: elbows on backrest\n          hands: hands dangling over the top\n          head: lowered, eyes up\n          expression: mischievous\n          props: [chair]\n          image_prompt: straddling chair backwards, leaning forward, heels lifted, elbows on backrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tipped, forward]\n        - id: strad_grip\n          name: Gripping the Back\n          posture: seated\n          description: Sits backward gripping the backrest with both hands and looking over her shoulder.\n          body: torso twisted slightly toward viewer\n          legs: knees wide, feet flat\n          arms: arms extended onto backrest\n          hands: both hands gripping top rail\n          head: turned toward viewer, eyes locked\n          expression: bold, playful\n          props: [chair]\n          image_prompt: straddling chair backwards, gripping backrest, looking over shoulder, bold\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [grip, hold]\n        - id: strad_rock\n          name: Rocked Back\n          posture: seated\n          description: Rocks the chair back on two legs with one hand on the rail.\n          body: leaning back, relaxed\n          legs: knees wide, feet braced on floor\n          arms: one hand on backrest, other raised\n          hands: raised hand pushing hair back\n          head: tilted back, eyes half-lidded\n          expression: lazy grin\n          props: [chair]\n          image_prompt: straddling chair, tilted back on two legs, hand pushing hair back\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [rock, tilt]\n\n    undressing_tease:\n      subtitle: Undressing Tease\n      environment: bedroom\n      triggers: [strip, undress, \"take off\", \"undressing\"]\n      exit_triggers: [\"stop\", \"put back on\", \"dress again\"]\n      entry: begins to undress slowly\n      default_activity: removing_layer\n      activities:\n        removing_layer:\n          description: removing an outer layer\n          triggers: [jacket, shirt, remove]\n          selection: random\n          poses: [strip_jacket, strip_shirt_lift, strip_glove]\n        teasing:\n          description: teasing before the next step\n          triggers: [tease, pause, turn]\n          selection: random\n          poses: [strip_turn_away, strip_hand_hem]\n      sequences:\n        outer_layers:\n          description: slowly removing outer layers, one step at a time\n          triggers: [\"one by one\", \"layer by layer\", slowly, \"keep going\"]\n          auto_start: true\n          step_every: 1\n          steps: [strip_jacket, strip_glove, strip_shirt_lift, strip_hand_hem, strip_turn_away]\n      poses:\n        - id: strip_jacket\n          name: Slipping Off Jacket\n          posture: standing\n          description: Slides a jacket off one shoulder while looking at the viewer.\n          body: shoulders rolled, torso angled\n          legs: feet together, weight on one leg\n          arms: one arm pulling jacket down\n          hands: fingers holding jacket collar\n          head: chin dipped, eyes up\n          expression: coy, teasing\n          props: [jacket]\n          image_prompt: standing, sliding jacket off shoulder, looking at viewer, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [jacket, slip]\n        - id: strip_shirt_lift\n          name: Hem Pause\n          posture: standing\n          description: Holds the hem of her top and pauses with a playful look.\n          body: upright, chest forward\n          legs: feet apart slightly\n          arms: both arms down, hands at hem\n          hands: fingers gripping hem\n          head: tilted, eyes direct\n          expression: playful, daring\n          props: []\n          image_prompt: standing, hands holding hem of shirt, pause, playful, tilted head\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hem, shirt]\n        - id: strip_glove\n          name: Pulling Off Glove\n          posture: standing\n          description: Pulls off a glove one finger at a time.\n          body: relaxed, slight lean\n          legs: one foot crossed in front\n          arms: one arm raised, other holding glove\n          hands: fingers pulling glove fingertip\n          head: lowered, eyes watching hands then up\n          expression: slow smile\n          props: [glove]\n          image_prompt: standing, pulling off glove finger by finger, eyes up, slow smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [glove, fingers]\n        - id: strip_turn_away\n          name: Turning Away\n          posture: standing\n          description: Turns her back and looks over her shoulder while loosening her hair.\n          body: back to viewer, torso twisted\n          legs: one foot slightly forward\n          arms: both arms up to hair\n          hands: fingers releasing hair clip\n          head: over shoulder, eyes direct\n          expression: knowing smile\n          props: []\n          image_prompt: standing from behind, hands in hair, looking over shoulder, knowing smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [turn, back]\n        - id: strip_hand_hem\n          name: Fingers on Collar\n          posture: standing\n          description: Traces her collar with one hand while leaning her head to the side.\n          body: slightly arched, shoulders back\n          legs: legs crossed at ankle\n          arms: one hand at collar, other at side\n          hands: fingertips tracing neckline\n          head: tilted, eyes lidded\n          expression: sultry\n          props: []\n          image_prompt: standing, fingers tracing collar, head tilted, lidded eyes\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [collar, trace]\n\n    table_bend:\n      subtitle: Bending Over Table\n      environment: table\n      triggers: [table, \"over the table\", \"lean on the table\", bending]\n      exit_triggers: [\"stand upright\", \"step back\", \"leave the table\"]\n      entry: leans toward the table\n      default_activity: leaning_forward\n      activities:\n        leaning_forward:\n          description: leaning forward on table\n          triggers: [lean, forward, elbows]\n          selection: random\n          poses: [table_forearms, table_palms, table_pick_up]\n        reaching:\n          description: reaching across table\n          triggers: [reach, stretch, across]\n          selection: random\n          poses: [table_reach, table_look_back]\n      poses:\n        - id: table_forearms\n          name: Forearms Down\n          posture: standing\n          description: Bends forward with both forearms flat on the table.\n          body: bent at the waist, back flat\n          legs: feet apart, knees slightly bent\n          arms: forearms flat on table\n          hands: fingers loosely interlaced\n          head: lifted, eyes forward\n          expression: teasing\n          props: [table]\n          image_prompt: standing, bent forward at waist, forearms on table, head raised, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [forearms, bend]\n        - id: table_palms\n          name: Palms Flat\n          posture: standing\n          description: Braces both palms on the table edge and leans her weight forward.\n          body: leaning forward, arms straight\n          legs: feet shoulder-width, one foot back\n          arms: arms straight, locked\n          hands: palms flat on table edge\n          head: chin up, gaze direct\n          expression: bold, confident\n          props: [table]\n          image_prompt: standing, palms flat on table, leaning forward, arms straight, bold look\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [palms, brace]\n        - id: table_pick_up\n          name: Picking Up Item\n          posture: standing\n          description: Bends from the waist to pick up something on the far side of the table.\n          body: bent forward, one arm extended\n          legs: one leg lifted slightly behind\n          arms: one arm extended, other on table\n          hands: fingers closing on object\n          head: lowered, eyes on object\n          expression: absorbed\n          props: [table, item]\n          image_prompt: standing, bent over table, reaching for object, one leg lifted behind\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [pick, grab]\n        - id: table_reach\n          name: Reaching Across\n          posture: standing\n          description: Stretches across the table toward the viewer, one hand extended.\n          body: stretched long, torso low over tabletop\n          legs: up on toes, feet together\n          arms: one arm fully extended\n          hands: open palm reaching toward viewer\n          head: chin on table-level, eyes on viewer\n          expression: playful\n          props: [table]\n          image_prompt: stretched across table, arm extended toward viewer, on tiptoe, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [across, reach]\n        - id: table_look_back\n          name: Glance Back\n          posture: standing\n          description: Leans on the table with her back to the viewer and looks back over her shoulder.\n          body: bent forward, spine arched\n          legs: feet apart, knees soft\n          arms: hands on table, elbows slightly bent\n          hands: palms on table\n          head: turned over shoulder, eyes direct\n          expression: coy\n          props: [table]\n          image_prompt: from behind, leaning on table, palms down, looking over shoulder, coy\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [glance, back]",
    "behavior.yaml": "# =====================================================================\n#  Behaviour data: synonyms, moods, tension ladder, micro-movements,\n#  distance, continuity (clothing) and camera rules.\n#  All of it is optional; delete a block to switch that feature off.\n# =====================================================================\n\n# Synonyms: every word in a group matches every other word, inside any trigger.\nsynonyms:\n  couch: [sofa, settee, loveseat]\n  bed: [mattress]\n  desk: [workstation]\n  laptop: [computer, notebook]\n  dinner: [supper]\n  kitchen: [kitchenette]\n\n# Mood map: how a pose's free-text `expression` is linked to expression categories\n# (see facial_expressions.yaml). A pose can override with `moods: [coy, warm]`\n# or pick exact expressions with `expressions: [EXP_003, EXP_005]`.\nmood_map:\n  coy: [coy, shy, demure, bashful, sly, knowing, modest]\n  playful: [playful, mischievous, grin, amused, teasing, daring, curious, cheeky, eager, animated]\n  warm: [warm, friendly, inviting, smile, smiling, content, easy, pleasant]\n  sultry: [sultry, smolder, smoldering, lidded, languid, lazy, seductive]\n  intense: [confident, challenging, bold, direct, intent, determined, intense, focused]\n  soft: [soft, sleepy, peaceful, dreamy, gentle, relaxed, contented]\n  calm: [calm, composed, attentive, thoughtful, absorbed, patient, serene]\n  intimate: [intimate, tender, sigh, parted, breathy]\n\n# Tension ladder. The stage rises one step at a time when its cue words appear,\n# and falls one step after `stage_decay_turns` quiet turns. Chat commands:\n#   /stage            show        /stage off | auto\n#   /stage <name>     fix a stage /stage max <name>   cap the highest stage\ntension:\n  start: flirting\n  stages:\n    flirting:\n      moods: [coy, playful, warm]\n      attitudes: [Coy, Flirtatious, Playful, Teasing, Demure, Mischievous]\n      cues: [flirt, tease, wink, blush, giggle, compliment, banter, \"smiles at you\", \"playful\"]\n    slow_burn:\n      moods: [coy, warm, calm, intense]\n      attitudes: [Lingering, Intent, Unhurried, Mysterious, Poised]\n      cues: [tension, linger, \"holds your gaze\", \"hold her gaze\", \"eye contact\", \"stands close\", \"standing close\", \"moves closer\", whisper, \"quiet voice\", \"can't look away\"]\n    seduction:\n      moods: [sultry, intense, playful]\n      attitudes: [Sultry, Confident, Bold, Unhurried, Inviting, Mysterious]\n      cues: [seduce, seductive, sultry, tempt, \"slow smile\", \"low voice\", \"come closer\", \"bites her lip\", \"bite her lip\", \"hooded eyes\"]\n    intimacy:\n      moods: [intimate, soft, warm, sultry]\n      attitudes: [Intimate, Vulnerable, Inviting, Languid]\n      cues: [cuddle, embrace, hug, kiss, \"holds your hand\", \"hold hands\", \"rests her head\", \"leans into you\", \"forehead\"]\n\n# Small idle movements, by posture. Poses can add their own with `micro: [...]`.\nmicro_movements:\n  standing:\n    - shifts her weight to the other leg\n    - tucks a strand of hair behind her ear\n    - smooths the front of her outfit\n    - rolls her shoulders back\n    - glances toward the window and back\n    - taps a finger against her arm\n  seated:\n    - crosses her legs the other way\n    - adjusts her position slightly\n    - tucks her hair behind her ear\n    - toys with a ring on her finger\n    - leans a little closer\n    - smooths her skirt over her knee\n  lying:\n    - shifts onto her other side\n    - stretches an arm over her head\n    - rests her cheek on her hand\n    - adjusts the pillow under her head\n    - curls her toes\n  kneeling:\n    - shifts her weight onto one knee\n    - brushes her hair back over her shoulder\n    - straightens her back\n    - rests her hands on her thighs\n  squatting:\n    - steadies herself with one hand\n    - shifts her balance\n    - tucks her hair back\n\n# Distance between the two characters. Poses may list `distance: [near, close]`.\ndistance:\n  default: near\n  levels:\n    - key: apart\n      description: a few steps away, not touching\n      cues: [\"across the room\", \"a few steps\", \"from a distance\", \"keeps her distance\", \"steps back\", \"step back\"]\n    - key: near\n      description: within arm's reach, side by side\n      cues: [beside, \"next to\", nearby, \"walks over\", \"sits next\"]\n    - key: close\n      description: very close, shoulders or knees almost touching\n      cues: [closer, \"moves closer\", \"leans in\", \"lean in\", \"against you\", \"close to you\", \"draws near\", snuggle]\n\n# Clothing continuity: outer layers only. Once something is taken off it stays off\n# until the text says it is put back on.\ncontinuity:\n  garments: [jacket, coat, blazer, cardigan, scarf, gloves, glove, shoes, heels, boots, glasses, necklace, belt, hat, watch, tie]\n\n# Camera angle for image prompts. A pose or scene can set `camera:` itself.\ncamera:\n  default: front view, eye level\n  rules:\n    - { match: \"from behind|back to viewer|rear|over shoulder\", camera: \"rear three-quarter view\" }\n    - { match: \"low angle\", camera: \"low angle shot\" }\n    - { match: \"from above|viewed from above|high angle\", camera: \"high angle shot\" }\n",
    "attitudes.yaml": "attitudes:\n  - id: ATT_001\n    name: Confident\n    description: Unwavering self-assurance and strong personal presence.\n    keywords: [assured, bold, poised]\n\n  - id: ATT_002\n    name: Feminine\n    description: Graceful, delicate, and inherently soft feminine elegance.\n    keywords: [graceful, delicate, soft]\n\n  - id: ATT_003\n    name: Coy\n    description: Shy-leaning playfulness with the chin lowered, looking up or sideways with a soft lingering smile.\n    keywords: [coy, shy, flirting]\n\n  - id: ATT_004\n    name: Flirtatious\n    description: Openly playful interest shown through warm eye contact, light teasing and an expressive face.\n    keywords: [flirty, playful, spark]\n\n  - id: ATT_005\n    name: Teasing\n    description: Lighthearted provocation with a knowing smirk, as if holding back a secret.\n    keywords: [teasing, smirking, banter]\n\n  - id: ATT_006\n    name: Playful\n    description: Bright, bouncy energy with easy grins and loose, animated posture.\n    keywords: [fun, lively, carefree]\n\n  - id: ATT_007\n    name: Mysterious\n    description: Reserved and unreadable, with a half-hidden smile and a gaze that gives little away.\n    keywords: [enigmatic, secretive, intriguing]\n\n  - id: ATT_008\n    name: Sultry\n    description: Calm assurance with heavy-lidded eyes and slow, controlled expression, suggesting she knows exactly what she wants.\n    keywords: [sultry, smoldering, magnetic]\n\n  - id: ATT_009\n    name: Unhurried\n    description: Deliberate, smooth and controlled pacing with no rushing or nervous fidgeting.\n    keywords: [slow, deliberate, composed]\n\n  - id: ATT_010\n    name: Languid\n    description: Loose, relaxed and unbothered, settling into the space with lazy ease.\n    keywords: [relaxed, lazy, easygoing]\n\n  - id: ATT_011\n    name: Poised\n    description: Upright, balanced and graceful, with shoulders back and an elegant stillness.\n    keywords: [elegant, composed, refined]\n\n  - id: ATT_012\n    name: Demure\n    description: Modest and gentle, with lowered eyes, a small smile and softly held posture.\n    keywords: [modest, gentle, sweet]\n\n  - id: ATT_013\n    name: Mischievous\n    description: Impish and daring, with a sideways glance and a grin that hints at trouble.\n    keywords: [impish, cheeky, sly]\n\n  - id: ATT_014\n    name: Bold\n    description: Direct and space-claiming, with open posture, raised chin and no hesitation.\n    keywords: [daring, assertive, fearless]\n\n  - id: ATT_015\n    name: Inviting\n    description: Warm and open, drawing the viewer closer with relaxed posture and an easy, welcoming look.\n    keywords: [welcoming, warm, beckoning]\n\n  - id: ATT_016\n    name: Lingering\n    description: Slow-burn restraint, holding eye contact and stillness a moment longer than expected to build tension.\n    keywords: [slow-burn, tension, restrained]\n\n  - id: ATT_017\n    name: Intent\n    description: Fully focused on the other person, with steady attention on their face and hands.\n    keywords: [focused, attentive, observing]\n\n  - id: ATT_018\n    name: Intimate\n    description: Close and comfortable, with a softened gaze, quiet expression and relaxed, open body language.\n    keywords: [close, private, tender]\n\n  - id: ATT_019\n    name: Vulnerable\n    description: Soft and open, with the head tilted to show the neck and a gentle, unguarded look.\n    keywords: [soft, open, unguarded]\n\n  - id: ATT_020\n    name: Nonchalant\n    description: Cool and casual, leaning back with an easy smirk as if completely unbothered.\n    keywords: [cool, casual, unbothered]\n",
    "facial_expressions.yaml": "expressions:\n  - id: EXP_001\n    name: Confident Direct Gaze\n    category: intense\n    description: Direct eye contact with a strong, self-assured expression and steady gaze.\n    visual_details: { eye_direction: direct gaze into camera, eyebrow_position: neutral, mouth: calm firm lips }\n\n  - id: EXP_002\n    name: Playful Half-Smile\n    category: warm\n    description: A light, engaging smile with a twinkle in the eyes and slight head tilt.\n    visual_details: { eye_direction: engaging camera, eyebrow_position: softly arched, mouth: asymmetrical half-smile }\n\n  - id: EXP_003\n    name: Coy Upward Glance\n    category: coy\n    description: Chin lowered and head slightly tilted while looking up at the viewer with a soft lingering smile.\n    visual_details: { eye_direction: looking up at camera from lowered chin, eyebrow_position: softly raised, mouth: closed soft smile }\n\n  - id: EXP_004\n    name: Sideways Glance\n    category: coy\n    description: Eyes slide to the side while the head stays turned toward the camera, with a small knowing smile.\n    visual_details: { eye_direction: looking sideways past camera, eyebrow_position: relaxed, mouth: small closed smile }\n\n  - id: EXP_005\n    name: Glance and Dismiss\n    category: coy\n    description: Eyes drop downward after a moment of eye contact, as if about to look back up.\n    visual_details: { eye_direction: lowered gaze just below camera, eyebrow_position: gently lowered, mouth: faint smile }\n\n  - id: EXP_006\n    name: Shy Soft Smile\n    category: warm\n    description: A gentle, slightly bashful smile with the head resting toward one shoulder.\n    visual_details: { eye_direction: looking up at camera softly, eyebrow_position: slightly raised, mouth: soft closed smile }\n\n  - id: EXP_007\n    name: Knowing Smile\n    category: warm\n    description: A calm smile that reaches the eyes, suggesting she knows something the viewer does not.\n    visual_details: { eye_direction: steady gaze at camera, eyebrow_position: one brow subtly lifted, mouth: lips closed with one corner raised }\n\n  - id: EXP_008\n    name: Teasing Smirk\n    category: playful\n    description: A lopsided smirk with a raised chin and amused eyes.\n    visual_details: { eye_direction: amused gaze at camera, eyebrow_position: one brow raised, mouth: asymmetrical smirk }\n\n  - id: EXP_009\n    name: Playful Grin\n    category: playful\n    description: A bright, open grin with crinkled eyes and an energetic tilt of the head.\n    visual_details: { eye_direction: bright gaze at camera, eyebrow_position: lifted, mouth: wide open smile showing teeth }\n\n  - id: EXP_010\n    name: Mischievous Look\n    category: playful\n    description: A sly sideways look paired with a cheeky grin, as if planning something.\n    visual_details: { eye_direction: sly sideways glance, eyebrow_position: one brow arched, mouth: crooked grin }\n\n  - id: EXP_011\n    name: Smoldering Gaze\n    category: sultry\n    description: A slow, intense stare with heavy lids and the chin dipped slightly.\n    visual_details: { eye_direction: intense stare into camera, eyebrow_position: slightly lowered, mouth: relaxed lips barely parted }\n\n  - id: EXP_012\n    name: Dropped-Cheek Gaze\n    category: sultry\n    description: Relaxed cheeks let the lower eyelids soften downward, and a slight head tilt makes the gaze look sharp and intense.\n    visual_details: { eye_direction: sharp gaze at camera, eyebrow_position: relaxed and level, mouth: soft closed lips }\n\n  - id: EXP_013\n    name: Heavy-Lidded Stare\n    category: sultry\n    description: Half-lowered eyelids with a steady look from under the brows.\n    visual_details: { eye_direction: looking at camera through lowered lids, eyebrow_position: lowered, mouth: slightly parted lips }\n\n  - id: EXP_014\n    name: Eyes Closed Head Back\n    category: soft\n    description: Eyes closed with the head tipped back and the throat relaxed, showing quiet enjoyment.\n    visual_details: { eye_direction: eyes closed, eyebrow_position: relaxed, mouth: soft contented smile }\n\n  - id: EXP_015\n    name: Parted Lips\n    category: intimate\n    description: Lips held slightly apart while looking at the viewer, drawing attention to the mouth.\n    visual_details: { eye_direction: steady gaze at camera, eyebrow_position: relaxed, mouth: lips slightly parted }\n\n  - id: EXP_016\n    name: Triangle Gaze\n    category: intimate\n    description: The eyes move from one eye to the lips and back, with a quiet and focused expression.\n    visual_details: { eye_direction: gaze lowered toward the viewer's lips, eyebrow_position: soft and level, mouth: relaxed closed lips }\n\n  - id: EXP_017\n    name: Lower Lip Bite\n    category: intimate\n    description: A light bite of the lower lip with an uncertain, playful look.\n    visual_details: { eye_direction: looking up at camera, eyebrow_position: slightly raised, mouth: lower lip lightly held by teeth }\n\n  - id: EXP_018\n    name: Fingertip to Lips\n    category: coy\n    description: A fingertip rests lightly at the lips while the eyes look back over the shoulder.\n    visual_details: { eye_direction: glancing back over shoulder, eyebrow_position: softly arched, mouth: lips touched by a fingertip }\n\n  - id: EXP_019\n    name: Soft Sigh\n    category: intimate\n    description: A slow, relaxed exhale with lowered eyes and a loosened face.\n    visual_details: { eye_direction: eyes lowered, eyebrow_position: gently relaxed, mouth: lips softly parted }\n\n  - id: EXP_020\n    name: Languid Half-Smile\n    category: soft\n    description: A lazy, unhurried half-smile with relaxed cheeks and easy eyes.\n    visual_details: { eye_direction: relaxed gaze at camera, eyebrow_position: level, mouth: slow half-smile }\n\n  - id: EXP_021\n    name: Sleepy Smile\n    category: soft\n    description: A drowsy, content smile with slightly heavy eyelids.\n    visual_details: { eye_direction: soft unfocused gaze, eyebrow_position: relaxed, mouth: gentle closed smile }\n\n  - id: EXP_022\n    name: Calm Attentive Look\n    category: calm\n    description: A composed, listening expression with a steady and friendly gaze.\n    visual_details: { eye_direction: steady gaze at camera, eyebrow_position: neutral, mouth: relaxed closed lips }\n\n  - id: EXP_023\n    name: Intent Focus\n    category: intense\n    description: A fixed, concentrated look held on the viewer with little else moving in the face.\n    visual_details: { eye_direction: fixed gaze at camera, eyebrow_position: slightly drawn together, mouth: still closed lips }\n\n  - id: EXP_024\n    name: Challenging Smirk\n    category: intense\n    description: A raised chin and level stare with a smirk that dares the viewer to respond.\n    visual_details: { eye_direction: level stare at camera, eyebrow_position: one brow raised, mouth: firm smirk }\n\n  - id: EXP_025\n    name: Bold Raised Brow\n    category: intense\n    description: One eyebrow lifted with the chin up, showing confident curiosity.\n    visual_details: { eye_direction: direct gaze at camera, eyebrow_position: one brow clearly raised, mouth: closed lips with a slight smile }\n\n  - id: EXP_026\n    name: Wide-Eyed Surprise\n    category: playful\n    description: Eyes open wide with lips slightly open, a brief look of surprise or interest.\n    visual_details: { eye_direction: wide eyes toward camera, eyebrow_position: raised high, mouth: lips softly open }\n\n  - id: EXP_027\n    name: Absorbed Curiosity\n    category: calm\n    description: Eyes fixed on something off camera, absorbed in what she is looking at.\n    visual_details: { eye_direction: looking down and away from camera, eyebrow_position: slightly lowered, mouth: relaxed lips }\n\n  - id: EXP_028\n    name: Warm Inviting Smile\n    category: warm\n    description: An open, friendly smile with relaxed eyes that draws the viewer in.\n    visual_details: { eye_direction: warm gaze at camera, eyebrow_position: softly arched, mouth: open gentle smile }\n\n  - id: EXP_029\n    name: Demure Lowered Gaze\n    category: coy\n    description: Eyes cast downward with the head tilted slightly, and a modest smile.\n    visual_details: { eye_direction: lowered gaze toward floor, eyebrow_position: gently lowered, mouth: small modest smile }\n\n  - id: EXP_030\n    name: Over-the-Shoulder Glance\n    category: coy\n    description: The head turns back over the shoulder with the eyes finding the camera.\n    visual_details: { eye_direction: looking back at camera over shoulder, eyebrow_position: softly arched, mouth: coy half-smile }\n"
  },
  "applyImagePrompt": true,
  "badge": true,
  "detection": "keywords",
  "debug": false
};

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


/* =====================================================================
   Perchance Scene Manager — web & PDF reader module (optional)
   ---------------------------------------------------------------------
   When the user's message contains a link, fetch the page (or PDF),
   extract the readable text and give it to the AI as a hidden message.

   Browsers block most cross-site requests (CORS). If a link fails, set a
   CORS proxy at build time:  node build.js --cors-proxy "https://corsproxy.io/?"
   ===================================================================== */
(function (root) {
  "use strict";

  const BUILD = {
  "corsProxy": "",
  "charLimit": 5000,
  "timeoutMs": 15000,
  "debug": false
};

  const MARKER = "[WEB PAGE CONTENT";
  const URL_RE = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,24}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;
  const api = { debug: !!BUILD.debug };
  const log = (...a) => { if (api.debug) console.log("[WebReader]", ...a); };

  function extractUrls(text) {
    return [...String(text || "").matchAll(URL_RE)].map((m) => m[0].replace(/[.,;:!?)]+$/, ""));
  }
  function truncate(text, limit) {
    const t = String(text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return t.length > limit ? t.slice(0, limit) + "\n[...truncated]" : t;
  }
  function buildMessage(url, content) {
    return `${MARKER} \u2014 background for the previous user message. Use it to answer; do not mention this block.]\nSource: ${url}\n\n${content}`;
  }

  async function fetchBlob(url) {
    const target = BUILD.corsProxy ? BUILD.corsProxy + encodeURIComponent(url) : url;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), BUILD.timeoutMs) : null;
    try {
      const r = await fetch(target, ctrl ? { signal: ctrl.signal } : undefined);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.blob();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function pdfText(buffer) {
    if (!root.pdfjsLib) {
      root.pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/+esm").then((m) => m.default);
      root.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/build/pdf.worker.min.js";
    }
    const doc = await root.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = Array.from({ length: Math.min(doc.numPages, 20) }, async (v, i) => {
      const page = await doc.getPage(i + 1);
      return (await page.getTextContent()).items.map((t) => t.str).join(" ");
    });
    return (await Promise.all(pages)).join("\n");
  }

  async function htmlText(html) {
    if (!root.Readability) {
      root.Readability = await import("https://esm.sh/@mozilla/readability@0.4.4?no-check").then((m) => m.Readability);
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    const article = new root.Readability(doc).parse();
    if (!article) return "";
    return `# ${article.title || "(no page title)"}\n\n${article.textContent}`;
  }

  async function readUrl(url) {
    const blob = await fetchBlob(url);
    const text = blob.type === "application/pdf" ? await pdfText(await blob.arrayBuffer()) : await htmlText(await blob.text());
    return truncate(text, BUILD.charLimit);
  }

  function removeOld() {
    try {
      const msgs = oc.thread.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (m.author === "system" && typeof m.content === "string" && m.content.startsWith(MARKER)) msgs.splice(i, 1);
      }
    } catch (e) { /* ignore */ }
  }

  function insertBeforeLast(items) {
    const msgs = oc.thread.messages;
    const last = msgs[msgs.length - 1];
    if (last && last.author === "user") msgs.splice(msgs.length - 1, 0, ...items);
    else msgs.push(...items);
  }

  function attach() {
    oc.thread.on("MessageAdded", async function ({ message }) {
      if (!message || message.author !== "user") return;
      const urls = extractUrls(message.content);
      if (!urls.length) return;
      const url = urls[urls.length - 1]; // last link wins
      try {
        const content = await readUrl(url);
        removeOld();
        if (!content) throw new Error("no readable text found");
        insertBeforeLast([{ author: "system", hiddenFrom: ["user"], expectsReply: false, content: buildMessage(url, content) }]);
        log("added content from", url);
      } catch (e) {
        console.warn("[WebReader] could not read " + url + ": " + (e && e.message));
        removeOld();
        insertBeforeLast([{
          author: "system",
          hiddenFrom: ["user"],
          expectsReply: false,
          content: `${MARKER} \u2014 the link ${url} could not be opened (${e && e.message}). Tell the user you could not read it instead of guessing its contents.]`
        }]);
      }
    });
  }

  Object.assign(api, { attach, extractUrls, truncate, buildMessage, MARKER });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WebReader = api;
  if (typeof oc !== "undefined" && typeof oc.thread !== "undefined") attach();
})(typeof window !== "undefined" ? window : globalThis);
