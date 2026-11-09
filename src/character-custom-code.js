/* =====================================================================
   GENERATED FILE — do not edit. Rebuild with:  node build.js
   Built: 2026-11-09T12:10:42.969Z
   Scenes: embedded (shared.yaml, indoor.yaml, physical.yaml)
   Web reader: included
   Paste this whole file into Perchance -> your character -> Custom code.
   ===================================================================== */

/* =====================================================================
   Perchance Scene Manager — scene & pose module
   ---------------------------------------------------------------------
   Reads the YAML scene library, detects which scene the conversation is
   in (trigger words), picks an activity and a pose, and injects a hidden
   "body position" directive for the AI character before it replies.

   Works in two places:
     - Perchance (browser): attaches itself to oc.thread automatically.
     - Node (tests): exports the pure functions; no `oc` needed.
   ===================================================================== */
(function (root) {
  "use strict";

  const BUILD = {
  "mode": "embedded",
  "baseUrl": "",
  "files": {
    "index.yaml": "# =====================================================================\n#  Perchance Scene Manager — library entry point\n# =====================================================================\nschema_version: 1\nlibrary_version: \"1.0.0\"\n\ninclude:\n  - shared.yaml\n  - indoor.yaml\n  - physical.yaml\n\nsettings:\n  default_scene: general/neutral\n  default_selection: mixed\n  avoid_immediate_repeat: true\n  pose_history_limit: 5\n  pose_refresh_every: 4\n  prefer_same_posture: true\n  scene_change_threshold: 2.5\n  scene_change_margin: 1\n  activity_change_threshold: 1\n  user_text_weight: 1.0\n  ai_text_weight: 0.8\n  transition_cue_bonus: 1.5\n\ntransition_cues:\n  - let's go\n  - lets go\n  - let us go\n  - head* to\n  - head* over\n  - mov* to\n  - walk* over\n  - walk* into\n  - stand* up and\n  - get* up and\n  - after that\n  - time for\n  - time to\n  - shall we\n  - why don't we\n",
    "shared.yaml": "# =====================================================================\n#  Shared definitions: reusable poses, transition rules, fallback scene\n# =====================================================================\n\npose_library:\n  standing_relaxed:\n    name: Standing relaxed\n    posture: standing\n    description: Standing in a relaxed, natural stance.\n    body: Upright, weight resting slightly on one leg.\n    legs: Feet about hip-width apart.\n    arms: Hanging loosely at the sides.\n    hands: Relaxed, fingers slightly curled.\n    head: Facing the companion.\n    expression: Calm, attentive.\n    image_prompt: standing, relaxed natural stance, arms at sides\n    negative_prompt: stiff pose, extra limbs\n\n  standing_arms_folded:\n    name: Standing with arms loosely folded\n    posture: standing\n    description: Standing with arms loosely folded.\n    body: Upright, shoulders relaxed.\n    legs: Weight shifted onto one hip.\n    arms: Folded loosely across the chest.\n    hands: Tucked against the upper arms.\n    head: Tilted slightly, listening.\n    expression: Thoughtful, slightly amused.\n    image_prompt: standing, arms loosely crossed, head slightly tilted\n    negative_prompt: extra limbs, angry\n\n  seated_relaxed:\n    name: Seated relaxed\n    posture: seated\n    description: Sitting comfortably and relaxed.\n    body: Leaning back slightly against the backrest.\n    legs: One leg crossed over the other.\n    arms: Resting on the lap or armrest.\n    hands: Loosely clasped.\n    head: Turned toward the companion.\n    expression: Easy, friendly.\n    image_prompt: sitting relaxed, legs crossed, hands in lap\n    negative_prompt: slouching badly, extra limbs\n\ntransitions:\n  scene:\n    - from: provocative/kitchen_cooking\n      to: provocative/meal_table\n      text: \"{char} sets the finished food on the table and sits down to eat.\"\n    - from: provocative/meal_table\n      to: provocative/couch_sitting\n      text: \"{char} finishes eating, gets up from the table and settles onto the couch.\"\n    - from: \"*\"\n      to: provocative/bed_lying\n      text: \"{char} walks to the bed and lies down.\"\n\n  posture:\n    - { from: seated,    to: standing,  text: \"rises from the seat\" }\n    - { from: seated,    to: kneeling,  text: \"gets up and kneels down\" }\n    - { from: seated,    to: lying,     text: \"lies back\" }\n    - { from: standing,  to: seated,    text: \"sits down\" }\n    - { from: standing,  to: kneeling,  text: \"kneels down\" }\n    - { from: standing,  to: lying,     text: \"lies down\" }\n    - { from: standing,  to: squatting, text: \"crouches down\" }\n    - { from: squatting, to: \"*\",       text: \"straightens up\" }\n    - { from: kneeling,  to: \"*\",       text: \"gets back up\" }\n    - { from: lying,     to: seated,    text: \"sits up\" }\n    - { from: lying,     to: \"*\",       text: \"gets up\" }\n\nscenes:\n  general:\n    neutral:\n      subtitle: General\n      description: No specific activity.\n      environment: \"\"\n      sticky: false\n      poses:\n        - standing_relaxed\n        - seated_relaxed\n        - standing_arms_folded",
    "indoor.yaml": "scenes:\n  provocative:\n    couch_sitting:\n      subtitle: Sitting on Couch\n      environment: living room couch\n      triggers: [couch, sofa, \"on the couch\", \"sit down\"]\n      exit_triggers: [\"get up\", \"stand up\", \"leave the couch\"]\n      entry: settles onto the couch\n      default_activity: lounging\n      activities:\n        lounging:\n          description: lounging back lazily\n          triggers: [relax, lounge, comfy]\n          selection: random\n          poses: [couch_sprawl, couch_curl, couch_legs_up, couch_hands_raised]\n        attentive:\n          description: leaning in to talk\n          triggers: [talk, listen, close]\n          selection: random\n          poses: [couch_lean_in, couch_cross, couch_knees_wide, couch_knee_on_cushion]\n      poses:\n        - id: couch_sprawl\n          name: Lazy Sprawl\n          posture: seated\n          description: Sinks into the cushions with one arm draped along the backrest.\n          body: reclined, back against cushion, chest open\n          legs: knees apart slightly, one foot flat, other stretched out\n          arms: right arm along backrest, left resting on thigh\n          hands: fingers relaxed, loosely curled\n          head: tilted back slightly, gaze lowered toward viewer\n          expression: lazy half-smile\n          props: [cushion]\n          image_prompt: sitting on couch, reclined, arm along backrest, relaxed sprawl, one leg extended\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sprawl, lazy]\n        - id: couch_curl\n          name: Curled Up\n          posture: seated\n          description: Tucks both legs beneath her and leans sideways into the armrest.\n          body: angled sideways, shoulder against armrest\n          legs: both legs folded beneath, feet tucked\n          arms: one arm hugging a cushion\n          hands: fingers gripping cushion edge\n          head: resting toward shoulder, eyes looking up\n          expression: soft, shy smile\n          props: [cushion, armrest]\n          image_prompt: curled up on couch, legs tucked, hugging cushion, leaning on armrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [curl, cozy]\n        - id: couch_legs_up\n          name: Legs Over Arm\n          posture: seated\n          description: Sits sideways with both legs swung over the armrest.\n          body: leaning back, torso twisted slightly\n          legs: both legs draped over armrest, ankles crossed\n          arms: hands behind head\n          hands: fingers laced behind head\n          head: tipped back, chin raised\n          expression: playful smirk\n          props: [armrest]\n          image_prompt: sitting sideways on couch, legs over armrest, hands behind head, ankles crossed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [legs, drape]\n        - id: couch_lean_in\n          name: Leaning In\n          posture: seated\n          description: Perches on the cushion edge and leans forward toward the viewer.\n          body: torso forward, back arched slightly\n          legs: knees together, feet flat\n          arms: forearms on thighs\n          hands: fingers clasped between knees\n          head: chin lowered, eyes up\n          expression: intent, teasing\n          props: []\n          image_prompt: sitting on couch edge, leaning forward, forearms on knees, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [lean, closer]\n        - id: couch_cross\n          name: Legs Crossed\n          posture: seated\n          description: Sits upright with one leg crossed over the other, one hand resting on the cushion beside her.\n          body: upright, shoulders back\n          legs: crossed at knee, top foot pointed\n          arms: one hand on knee, other on cushion\n          hands: fingertips lightly tracing fabric\n          head: turned over shoulder, eyes sideways\n          expression: coy\n          props: []\n          image_prompt: sitting on couch, legs crossed, upright posture, glancing sideways\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [cross, poised]\n        - id: couch_knees_wide\n          name: Wide Knees\n          posture: seated\n          description: Sits on the couch leaning slightly forward with knees wide apart and a hand on each thigh.\n          body: leaning slightly forward, spine upright, shoulders square\n          legs: knees wide apart, feet planted flat and apart\n          arms: both arms extended down to the thighs\n          hands: one hand on each thigh, fingers spread\n          head: chin level, gaze direct\n          expression: confident, intent\n          props: [couch]\n          image_prompt: sitting on couch, knees wide apart, feet flat, hands on thighs, leaning forward, direct gaze\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [wide, thighs]\n        - id: couch_hands_raised\n          name: Hands Beside Head\n          posture: seated\n          description: Sits back on the couch with legs stretched out wide and both hands raised beside her head.\n          body: leaning back slightly, spine straight\n          legs: knees apart, legs stretched out wide, feet extended\n          arms: both elbows bent, hands raised to head height\n          hands: open palms facing inward beside the head\n          head: chin level, looking forward\n          expression: animated, expressive\n          props: [couch]\n          image_prompt: sitting on couch, legs stretched wide, both hands raised beside head, expressive\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [raised, gesture]\n        - id: couch_knee_on_cushion\n          name: Knee on Cushion\n          posture: kneeling\n          description: Leans forward over the couch with one knee on the cushion and arms braced, looking back at the viewer.\n          body: leaning forward over the backrest, back slightly arched, torso angled\n          legs: one knee on the cushion, other leg straight with heel lifted\n          arms: one arm braced on the backrest, other on the armrest\n          hands: palms gripping the couch back\n          head: turned over shoulder, gaze direct\n          expression: coy, direct\n          props: [couch, backrest]\n          image_prompt: leaning over couch, one knee on cushion, hands on backrest, looking over shoulder\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [cushion, backrest]\n\n    chair_sitting:\n      subtitle: Sitting on Chair\n      environment: bedroom chair\n      triggers: [chair, armchair, \"on the chair\", \"take a seat\"]\n      exit_triggers: [\"stand up\", \"get up\", \"leave the chair\"]\n      entry: sits down on the chair\n      default_activity: seated_pose\n      activities:\n        seated_pose:\n          description: sitting upright, composed\n          triggers: [sit, upright, posed]\n          selection: random\n          poses: [chair_upright, chair_cross, chair_perch]\n        casual:\n          description: slouching or leaning back\n          triggers: [slouch, relax, tilt]\n          selection: random\n          poses: [chair_tilt, chair_sideways, chair_legs_raised, chair_feet_on_desk, chair_wide_grip]\n      poses:\n        - id: chair_upright\n          name: Upright Poise\n          posture: seated\n          description: Sits tall with spine straight and hands folded in her lap.\n          body: upright, shoulders back, chin level\n          legs: knees together, feet flat\n          arms: elbows close, forearms in lap\n          hands: fingers interlaced on lap\n          head: level, gaze direct\n          expression: calm, composed\n          props: [chair]\n          image_prompt: sitting on chair, upright posture, hands folded in lap, knees together\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [upright, formal]\n        - id: chair_cross\n          name: Crossed Legs\n          posture: seated\n          description: Crosses her legs and rests one elbow on the chair arm.\n          body: leaning slightly to one side\n          legs: crossed at knee, foot dangling\n          arms: elbow on armrest\n          hands: chin resting on fingertips\n          head: tilted, gaze steady\n          expression: thoughtful smirk\n          props: [chair]\n          image_prompt: sitting on chair, legs crossed, elbow on armrest, chin on hand\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [cross, elbow]\n        - id: chair_perch\n          name: Edge Perch\n          posture: seated\n          description: Perches on the front edge with her torso angled forward.\n          body: leaning forward, back arched\n          legs: knees apart slightly, heels lifted\n          arms: hands braced on knees\n          hands: palms flat on knees\n          head: chin down, eyes up\n          expression: eager, teasing\n          props: [chair]\n          image_prompt: sitting on edge of chair, leaning forward, hands on knees, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [edge, forward]\n        - id: chair_tilt\n          name: Tilted Back\n          posture: seated\n          description: Leans back with the chair tilted and one foot propped.\n          body: reclined, relaxed shoulders\n          legs: one foot propped on edge of table or rung, other extended\n          arms: hands behind head\n          hands: fingers laced behind head\n          head: tilted back, eyes half-lidded\n          expression: lazy confidence\n          props: [chair]\n          image_prompt: leaning back in chair, hands behind head, foot propped, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tilt, lean back]\n        - id: chair_sideways\n          name: Sideways Sit\n          posture: seated\n          description: Sits sideways with both legs draped over the chair arm.\n          body: twisted, back against the other arm\n          legs: both legs over armrest, ankles crossed\n          arms: one arm along backrest\n          hands: fingers trailing loosely\n          head: turned toward viewer, gaze playful\n          expression: mischievous grin\n          props: [chair]\n          image_prompt: sitting sideways in chair, legs over armrest, arm along backrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sideways, drape]\n        - id: chair_legs_raised\n          name: Legs Raised\n          posture: seated\n          description: Reclines deeply in the chair with one leg lifted high and the other knee bent.\n          body: reclined deep into chair, torso angled\n          legs: one leg raised high in the air, other knee bent with foot on desk edge\n          arms: one hand resting on raised thigh\n          hands: fingers resting on thigh\n          head: tilted, gaze direct\n          expression: smoldering, confident\n          props: [office chair, desk]\n          image_prompt: reclined in office chair, one leg raised high, other knee bent, hand on thigh, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [raised, reclined]\n        - id: chair_feet_on_desk\n          name: Feet on Desk\n          posture: seated\n          description: Reclines in the chair with both legs extended and heels resting on the desk.\n          body: reclined, shoulders relaxed, torso angled toward viewer\n          legs: both legs fully extended, heels resting on desk\n          arms: arms bent in front of lap\n          hands: both hands holding at her waist\n          head: tilted, eyes direct\n          expression: playful, knowing smile\n          props: [office chair, desk]\n          image_prompt: reclined in office chair, both legs extended, heels on desk, hands at waist, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [feet, desk]\n        - id: chair_wide_grip\n          name: Gripping the Seat\n          posture: seated\n          description: Sits in a low chair with knees wide, torso leaning slightly forward and hands gripping the seat edges.\n          body: leaning slightly forward, shoulders drawn in\n          legs: knees wide apart, feet planted flat and apart\n          arms: both arms down and in, elbows slightly bent\n          hands: fingers gripping the seat edge beside the hips\n          head: tilted, chin lowered, eyes up\n          expression: coy smirk\n          props: [chair]\n          image_prompt: sitting in low chair, knees wide, hands gripping seat edges, leaning forward, chin down, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [grip, wide]\n\n    bed_lying:\n      subtitle: Lying on the Bed\n      environment: bedroom bed\n      triggers: [bed, \"lie down\", \"on the bed\", \"lying\"]\n      exit_triggers: [\"get up\", \"sit up\", \"leave the bed\"]\n      entry: lies down on the bed\n      default_activity: resting\n      activities:\n        resting:\n          description: lying and relaxing\n          triggers: [rest, relax, sleep]\n          selection: random\n          poses: [bed_back_stretch, bed_side, bed_curl, bed_side_crossed]\n        playful:\n          description: lying in a teasing pose\n          triggers: [tease, roll, play]\n          selection: random\n          poses: [bed_stomach, bed_propped, bed_forearms_hips_up, bed_hands_knees]\n      poses:\n        - id: bed_back_stretch\n          name: Back Stretch\n          posture: lying\n          description: Lies on her back with arms stretched above her head.\n          body: flat on back, spine slightly arched\n          legs: one knee bent, other extended\n          arms: both arms overhead\n          hands: fingers loosely curled on pillow\n          head: turned to one side, gaze toward viewer\n          expression: sleepy smile\n          props: [pillow]\n          image_prompt: lying on back on bed, arms overhead, one knee bent, stretching\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stretch, back]\n        - id: bed_side\n          name: Side Recline\n          posture: lying\n          description: Lies on her side propped on one elbow.\n          body: side-lying, torso lifted on elbow\n          legs: stacked, top knee bent forward\n          arms: lower elbow supporting head\n          hands: free hand resting on hip\n          head: held up by hand, eyes direct\n          expression: warm, inviting\n          props: [pillow]\n          image_prompt: lying on side on bed, propped on elbow, hand on hip, knee bent\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [side, elbow]\n        - id: bed_curl\n          name: Curled Sleep\n          posture: lying\n          description: Curls into a ball on her side hugging a pillow.\n          body: curled, shoulders rounded\n          legs: knees drawn toward chest\n          arms: both arms around pillow\n          hands: gripping pillow\n          head: nestled into pillow, eyes half-closed\n          expression: peaceful\n          props: [pillow]\n          image_prompt: curled up on bed, hugging pillow, knees to chest, side view\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [curl, sleep]\n        - id: bed_stomach\n          name: Stomach Kick\n          posture: lying\n          description: Lies on her stomach with ankles crossed in the air.\n          body: prone, chest raised on forearms\n          legs: knees bent, ankles crossed in air\n          arms: forearms flat on mattress\n          hands: chin resting on stacked fists\n          head: lifted, gaze forward\n          expression: playful grin\n          props: []\n          image_prompt: lying on stomach on bed, ankles crossed in air, chin on hands\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stomach, kick]\n        - id: bed_propped\n          name: Propped on Pillows\n          posture: lying\n          description: Reclines against stacked pillows with one leg bent.\n          body: semi-upright, back against pillows\n          legs: one knee up, other flat\n          arms: one arm behind head\n          hands: other hand resting on stomach\n          head: tilted back, eyes lidded\n          expression: languid\n          props: [pillows]\n          image_prompt: reclining on bed against pillows, one knee up, hand behind head\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [propped, pillows]\n        - id: bed_side_crossed\n          name: Side Recline, Ankles Crossed\n          posture: lying\n          description: Lies propped on one side with legs extended and crossed at the ankles, holding the edges of a jacket.\n          body: side-lying, upper body propped up\n          legs: legs extended, ankles crossed\n          arms: both arms bent in front of chest\n          hands: both hands holding jacket edges\n          head: tilted, eyes up toward viewer\n          expression: sultry\n          props: []\n          image_prompt: lying on side on bed, propped up, legs extended, ankles crossed, hands holding jacket, viewed from above\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [crossed, jacket]\n        - id: bed_forearms_hips_up\n          name: Forearms and Knees\n          posture: kneeling\n          description: Rests on forearms and knees on the bed, hips raised, looking back at the viewer.\n          body: forearms down, hips raised, back arched\n          legs: knees apart, lower legs resting flat\n          arms: both forearms flat on mattress\n          hands: hands folded under chin\n          head: turned back toward viewer\n          expression: sly, playful\n          props: []\n          image_prompt: on forearms and knees on bed, back arched, looking back over shoulder, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [forearms, knees]\n        - id: bed_hands_knees\n          name: Hands and Knees on Bed\n          posture: kneeling\n          description: Rests on hands and knees on the bed with lower legs flat, looking back over her shoulder.\n          body: horizontal, spine slightly arched\n          legs: knees apart, lower legs resting flat behind\n          arms: arms straight, shoulders over wrists\n          hands: palms flat on the mattress\n          head: turned back over shoulder, gaze direct\n          expression: playful, warm\n          props: [bed]\n          image_prompt: on hands and knees on bed, lower legs flat, looking back over shoulder, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hands and knees, crawl]\n\n    room_standing:\n      subtitle: Standing in the Room\n      environment: bedroom\n      triggers: [standing, stand, \"in the room\", \"stands\"]\n      exit_triggers: [\"sit down\", \"lie down\", \"kneel\"]\n      entry: stands in the middle\n      default_activity: posing\n      activities:\n        posing:\n          description: posing confidently\n          triggers: [pose, confident, hips]\n          selection: random\n          poses: [stand_hip, stand_arms_crossed, stand_over_shoulder, stand_hands_knees]\n        idle:\n          description: standing casually\n          triggers: [wait, idle, casual]\n          selection: random\n          poses: [stand_hand_hair, stand_stretch, stand_lean_papers]\n      poses:\n        - id: stand_hip\n          name: Hip Pop\n          posture: standing\n          description: Stands with weight on one leg and a hand on her hip.\n          body: weight shifted, hip jutting out\n          legs: one leg straight, other bent, toe pointing out\n          arms: one hand on hip, other at side\n          hands: fingers splayed on hip\n          head: tilted, gaze direct\n          expression: confident smile\n          props: []\n          image_prompt: standing, weight on one leg, hand on hip, hip tilted, confident\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [hip, confident]\n        - id: stand_arms_crossed\n          name: Arms Crossed\n          posture: standing\n          description: Stands with arms crossed beneath her chest and feet apart.\n          body: upright, shoulders squared\n          legs: feet shoulder-width apart\n          arms: crossed under chest\n          hands: fingers resting on opposite elbows\n          head: chin raised, eyes level\n          expression: challenging smirk\n          props: []\n          image_prompt: standing, arms crossed, feet apart, chin raised, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [crossed, arms]\n        - id: stand_over_shoulder\n          name: Over the Shoulder\n          posture: standing\n          description: Stands with her back to the viewer, glancing over her shoulder.\n          body: turned away, torso twisted back\n          legs: one foot slightly ahead\n          arms: hands behind or at sides\n          hands: fingers loosely clasped behind her\n          head: turned over shoulder, eyes direct\n          expression: coy, knowing\n          props: []\n          image_prompt: standing from behind, looking over shoulder, torso twisted, hands clasped behind\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [shoulder, behind]\n        - id: stand_hand_hair\n          name: Hand in Hair\n          posture: standing\n          description: Stands relaxed and runs one hand up through her hair.\n          body: slightly arched, chest open\n          legs: feet together, one knee softly bent\n          arms: one arm raised to head\n          hands: fingers threading through hair\n          head: tilted back slightly, eyes half-closed\n          expression: relaxed, sultry\n          props: []\n          image_prompt: standing, hand in hair, arm raised, head tilted back, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [hair, raise]\n        - id: stand_stretch\n          name: Standing Stretch\n          posture: standing\n          description: Stretches both arms overhead with her back arching.\n          body: elongated, back arched\n          legs: feet apart, up on toes\n          arms: both arms overhead, fingers interlaced\n          hands: palms facing up\n          head: tilted back, eyes closed\n          expression: contented sigh\n          props: []\n          image_prompt: standing stretch, arms overhead, back arched, on tiptoes, eyes closed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stretch, yawn]\n        - id: stand_hands_knees\n          name: Hands on Knees\n          posture: standing\n          description: Stands bent forward with both hands resting on her knees, looking at the viewer.\n          body: bent forward at the hips, torso angled toward viewer\n          legs: knees bent and together, feet apart\n          arms: arms straight down to the knees\n          hands: both hands resting on the knees\n          head: raised, eyes direct\n          expression: open, wide-eyed\n          props: []\n          image_prompt: standing bent forward, hands on knees, knees bent, looking at viewer\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [bend, knees]\n        - id: stand_lean_papers\n          name: Leaning Over Papers\n          posture: standing\n          description: Leans a hip against a shelf with one hand flat on a stack of papers and the other at her neckline, looking down.\n          body: weight shifted, hip against shelf, slight twist\n          legs: one leg straight, other knee bent forward and out\n          arms: one arm extended to the surface, other bent to the chest\n          hands: one hand flat on papers, other at the neckline\n          head: turned toward the surface, gaze lowered\n          expression: absorbed, curious\n          props: [shelf, papers]\n          image_prompt: standing, hip against shelf, hand flat on papers, other hand at neckline, looking down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [papers, shelf, lean]\n\n    meal_table:\n      subtitle: Having a Meal\n      environment: kitchen table\n      triggers: [meal, eat, dinner, lunch, breakfast, \"having dinner\", \"have dinner\", \"for dinner\", \"at the table\", \"sit at the table\"]\n      exit_triggers: [\"finished eating\", \"clear the table\", \"leave the table\"]\n      entry: sits at the table\n      default_activity: eating\n      activities:\n        eating:\n          description: eating a meal\n          triggers: [eat, bite, fork]\n          selection: random\n          poses: [meal_fork, meal_sip, meal_lean]\n        chatting:\n          description: talking over food\n          triggers: [talk, chat, laugh]\n          selection: random\n          poses: [meal_chin_hand, meal_feed]\n      poses:\n        - id: meal_fork\n          name: Fork to Lips\n          posture: seated\n          description: Raises a forkful of food to her lips.\n          body: upright, slight forward lean\n          legs: legs crossed under table\n          arms: one elbow on table, other hand holding fork\n          hands: fork raised, other hand on table\n          head: tilted slightly, eyes on viewer\n          expression: playful\n          props: [fork, plate]\n          image_prompt: sitting at table, raising fork to lips, eating, eye contact\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [fork, bite]\n        - id: meal_sip\n          name: Sipping Drink\n          posture: seated\n          description: Sips from a glass with her gaze over the rim.\n          body: leaning back slightly\n          legs: crossed at the ankle\n          arms: one arm bent holding glass\n          hands: fingers around glass stem\n          head: tilted, eyes over rim\n          expression: knowing look\n          props: [glass]\n          image_prompt: sitting at table, sipping glass, eyes over rim, relaxed\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [sip, drink]\n        - id: meal_lean\n          name: Elbows on Table\n          posture: seated\n          description: Leans forward with both elbows on the table.\n          body: forward lean, shoulders relaxed\n          legs: feet tucked back\n          arms: both elbows on table\n          hands: hands clasped under chin\n          head: chin on hands, eyes bright\n          expression: attentive, warm\n          props: [table]\n          image_prompt: sitting at table, leaning forward, elbows on table, chin on clasped hands\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [elbows, lean]\n        - id: meal_chin_hand\n          name: Chin in Hand\n          posture: seated\n          description: Rests her cheek on one hand and toys with her food.\n          body: slouched slightly, relaxed\n          legs: one knee over the other\n          arms: one elbow on table\n          hands: free hand pushing food with fork\n          head: tilted into hand, eyes lowered then up\n          expression: amused\n          props: [fork, plate]\n          image_prompt: sitting at table, cheek on hand, poking food with fork, amused\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chin, toy]\n        - id: meal_feed\n          name: Offering a Bite\n          posture: seated\n          description: Holds out a bite of food on a fork toward the viewer.\n          body: leaning forward, arm extended\n          legs: feet flat under table\n          arms: one arm extended\n          hands: fork offered, other hand beneath it\n          head: tilted, eyes direct\n          expression: inviting smile\n          props: [fork]\n          image_prompt: sitting at table, offering fork forward, leaning in, inviting smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [offer, feed]\n\n    kitchen_cooking:\n      subtitle: Cooking\n      environment: kitchen\n      triggers: [cook, cooking, \"in the kitchen\", stove]\n      exit_triggers: [\"dinner is ready\", \"stop cooking\", \"leave the kitchen\"]\n      entry: turns to the stove\n      default_activity: stirring\n      activities:\n        stirring:\n          description: stirring and tasting\n          triggers: [stir, taste, pan]\n          selection: random\n          poses: [cook_stir, cook_taste, cook_lean_counter]\n        prepping:\n          description: chopping and preparing\n          triggers: [chop, prep, knife]\n          selection: random\n          poses: [cook_chop, cook_reach_shelf]\n      poses:\n        - id: cook_stir\n          name: Stirring Pot\n          posture: standing\n          description: Stands at the stove stirring a pot with a wooden spoon.\n          body: slight forward lean, shoulders relaxed\n          legs: feet apart, weight shifted\n          arms: one arm extended with spoon\n          hands: one hand on spoon, other on counter\n          head: lowered toward pot, eyes sideways\n          expression: focused, content\n          props: [pot, spoon]\n          image_prompt: standing at stove, stirring pot with spoon, leaning slightly, looking sideways\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [stir, pot]\n        - id: cook_taste\n          name: Tasting Spoon\n          posture: standing\n          description: Lifts a spoon to her lips to taste with her free hand cupped beneath.\n          body: upright, head tilted\n          legs: feet together\n          arms: one arm raised, other hand under spoon\n          hands: spoon at lips, palm cupped below\n          head: tilted, eyes closed or lowered\n          expression: savoring\n          props: [spoon]\n          image_prompt: standing, tasting spoon, hand cupped beneath, eyes closed, savoring\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [taste, spoon]\n        - id: cook_lean_counter\n          name: Leaning on Counter\n          posture: standing\n          description: Leans a hip on the counter while waiting, arms folded.\n          body: leaning sideways, relaxed\n          legs: legs crossed at ankle\n          arms: folded in front\n          hands: fingers tucked into elbows\n          head: tilted, eyes on viewer\n          expression: patient, teasing\n          props: [counter]\n          image_prompt: standing, hip against counter, arms folded, legs crossed at ankle, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [lean, wait]\n        - id: cook_chop\n          name: Chopping\n          posture: standing\n          description: Chops vegetables with her focus on the board.\n          body: bent slightly forward over counter\n          legs: feet shoulder-width apart\n          arms: both arms forward, elbows bent\n          hands: one holding knife, other steadying vegetable\n          head: lowered, eyes on board\n          expression: concentrated\n          props: [knife, cutting board]\n          image_prompt: standing at counter, chopping vegetables, leaning forward, focused\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chop, knife]\n        - id: cook_reach_shelf\n          name: Reaching Up\n          posture: standing\n          description: Rises on tiptoe to reach a jar on a high shelf.\n          body: stretched upward, back lengthened\n          legs: up on tiptoes, one knee slightly bent\n          arms: one arm fully extended upward\n          hands: fingers stretching toward jar, other hand on counter\n          head: tilted back, eyes on shelf\n          expression: determined, amused\n          props: [shelf, jar]\n          image_prompt: standing on tiptoe, reaching high shelf, arm extended, other hand on counter\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [reach, shelf]\n\n    wall_lean:\n      subtitle: Leaning Against Wall\n      environment: hallway wall\n      triggers: [wall, \"against the wall\", \"lean on the wall\", leaning]\n      exit_triggers: [\"step away\", \"walk off\", \"push off\"]\n      entry: leans back against the wall\n      default_activity: casual_lean\n      activities:\n        casual_lean:\n          description: leaning back casually\n          triggers: [casual, lean, relax]\n          selection: random\n          poses: [wall_back, wall_shoulder, wall_foot_up]\n        inviting:\n          description: leaning in invitingly\n          triggers: [lure, beckon, near]\n          selection: random\n          poses: [wall_hand_beside, wall_beckon]\n      poses:\n        - id: wall_back\n          name: Back to Wall\n          posture: standing\n          description: Leans her back flat against the wall with arms crossed.\n          body: back flat on wall, shoulders relaxed\n          legs: feet forward, one knee slightly bent\n          arms: crossed in front\n          hands: fingers on opposite arms\n          head: tilted, eyes direct\n          expression: cool, amused\n          props: [wall]\n          image_prompt: standing, back against wall, arms crossed, knee bent, cool look\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [back, arms]\n        - id: wall_shoulder\n          name: Shoulder Lean\n          posture: standing\n          description: Leans a shoulder on the wall with one hand in her pocket.\n          body: turned sideways, shoulder to wall\n          legs: ankles crossed\n          arms: one hand in pocket\n          hands: other hand resting on wall\n          head: tilted toward viewer\n          expression: easy smirk\n          props: [wall]\n          image_prompt: leaning shoulder on wall, hand in pocket, ankles crossed, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [shoulder, pocket]\n        - id: wall_foot_up\n          name: Foot on Wall\n          posture: standing\n          description: Leans back with one foot planted flat on the wall behind her.\n          body: leaning back, hips forward\n          legs: one leg straight, other knee bent with sole on wall\n          arms: arms loose at sides\n          hands: palms flat on wall\n          head: tilted back against wall, eyes lidded\n          expression: nonchalant\n          props: [wall]\n          image_prompt: leaning on wall, one foot on wall, palms on wall, nonchalant\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [foot, bent knee]\n        - id: wall_hand_beside\n          name: Hand Beside Her Head\n          posture: standing\n          description: Leans with one forearm on the wall beside her head, facing the viewer.\n          body: turned toward viewer, one shoulder on wall\n          legs: feet apart slightly\n          arms: one forearm on wall above head\n          hands: other hand on hip\n          head: tilted against forearm, eyes direct\n          expression: confident, inviting\n          props: [wall]\n          image_prompt: leaning on wall, forearm above head, hand on hip, facing viewer, inviting\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [forearm, beside]\n        - id: wall_beckon\n          name: Beckoning Finger\n          posture: standing\n          description: Leans on the wall and beckons the viewer closer with one finger.\n          body: relaxed lean, hips tilted\n          legs: legs crossed at ankle\n          arms: one arm extended toward viewer\n          hands: index finger curling to beckon\n          head: head tilted, eyes direct\n          expression: sly smile\n          props: [wall]\n          image_prompt: leaning on wall, beckoning with finger, ankles crossed, sly smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [beckon, finger]\n    desk_perch:\n      subtitle: Perched on Desk\n      environment: office desk\n      triggers: [desk, laptop, computer, \"on the desk\", \"at the desk\", \"at her desk\", \"office desk\", \"sit on the desk\"]\n      exit_triggers: [\"get off the desk\", \"stand up\", \"leave the desk\"]\n      entry: perches on the desk edge\n      default_activity: sitting_on_desk\n      activities:\n        sitting_on_desk:\n          description: sitting on the desk\n          triggers: [sit, perch, edge]\n          selection: random\n          poses: [desk_side_perch, desk_knees_apart, desk_knee_recline, desk_feet_planted]\n        leaning_on_desk:\n          description: leaning against the desk\n          triggers: [lean, pose, stretch]\n          selection: random\n          poses: [desk_hip_lean, desk_foot_up, desk_bend_knee_up]\n        working_at_desk:\n          description: seated at the desk working\n          triggers: [work, type, laptop, computer]\n          selection: random\n          poses: [desk_seated_typing]\n      poses:\n        - id: desk_side_perch\n          name: Side Perch\n          posture: seated\n          description: Sits on the desk edge with both legs extended long toward the floor.\n          body: upright, torso angled toward viewer\n          legs: legs extended and angled to one side, feet pointed\n          arms: one hand on thigh, other hand resting on knee\n          hands: fingers resting lightly on knee\n          head: tilted slightly, gaze direct\n          expression: poised, confident\n          props: [desk]\n          image_prompt: sitting on desk edge, legs extended long, hands on thigh and knee, torso angled, poised\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [side, edge]\n        - id: desk_knees_apart\n          name: Leaning Back, Knees Apart\n          posture: seated\n          description: Sits on the desktop leaning back with knees apart and one hand on her ankle.\n          body: leaning back, shoulders relaxed\n          legs: knees wide apart, feet planted flat on desktop\n          arms: one arm reaching down, other braced behind\n          hands: one hand holding ankle\n          head: tilted to the side, gaze direct\n          expression: confident, smoldering\n          props: [desk]\n          image_prompt: sitting on desk, leaning back, knees apart, feet on desktop, hand on ankle, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [knees, apart]\n        - id: desk_knee_recline\n          name: Knee-Up Recline\n          posture: seated\n          description: Reclines on the desktop propped on one hand with one knee raised high.\n          body: leaning back and sideways, propped on one arm\n          legs: one knee raised high, other leg extended along desk\n          arms: one arm braced behind, other resting on desk\n          hands: fingers splayed on desktop\n          head: tilted, gaze toward viewer\n          expression: warm, playful smile\n          props: [desk]\n          image_prompt: sitting on desk, leaning back on one hand, one knee raised, other leg extended, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [recline, knee]\n        - id: desk_feet_planted\n          name: Feet Planted\n          posture: seated\n          description: Sits on the desk with knees apart and feet planted, leaning forward slightly.\n          body: leaning forward, shoulders rounded in\n          legs: knees apart, both feet flat on desktop\n          arms: both elbows tucked in\n          hands: both hands clasped together at the chest\n          head: tilted, chin lowered, eyes up\n          expression: coy, knowing\n          props: [desk]\n          image_prompt: sitting on desk, knees apart, feet flat on desktop, hands clasped at chest, chin down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [feet, clasp]\n        - id: desk_hip_lean\n          name: Hip Against Desk\n          posture: standing\n          description: Leans one hip against the desk edge with one hand gripping it and the other behind her neck.\n          body: torso arched, leaning sideways into desk\n          legs: legs crossed loosely, one foot forward\n          arms: one hand gripping desk edge, other raised behind neck\n          hands: fingers curled over desk edge\n          head: tilted back, eyes closed\n          expression: dreamy, sultry\n          props: [desk]\n          image_prompt: standing, hip against desk, hand behind neck, back arched, head tilted back, eyes closed\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hip, neck]\n        - id: desk_foot_up\n          name: One Foot Up\n          posture: standing\n          description: Stands against the desk with one foot raised and resting behind her, both hands in her hair.\n          body: twisted toward viewer, hips against desk\n          legs: standing leg straight, other knee bent with foot raised behind\n          arms: both arms raised overhead\n          hands: fingers running through hair\n          head: tilted, looking toward viewer\n          expression: playful smile\n          props: [desk]\n          image_prompt: standing, one foot raised behind, hips against desk, both hands in hair, twisted torso, smiling\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [foot, hair]\n        - id: desk_bend_knee_up\n          name: Knee on Desk\n          posture: standing\n          description: Leans forward onto the desk with one knee raised onto it, looking back over her shoulder.\n          body: bent forward at waist, torso resting on desk edge\n          legs: one leg straight on floor, other knee raised onto desk\n          arms: forearm braced on desktop\n          hands: other hand on desk edge\n          head: turned over shoulder, gaze direct\n          expression: coy, direct\n          props: [desk]\n          image_prompt: leaning on desk, one knee raised onto desk, looking over shoulder, forearm braced\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [knee, over shoulder]\n        - id: desk_seated_typing\n          name: Working at Laptop\n          posture: seated\n          description: Sits at a desk facing it with knees wide, one hand on a laptop and the other at her collar, gazing at the screen.\n          body: upright, turned slightly toward the screen\n          legs: knees wide apart, feet planted flat on the floor\n          arms: one arm forward on the desk, other bent to the chest\n          hands: one hand on the laptop, other at the neckline\n          head: turned toward the screen, gaze on the screen\n          expression: absorbed, curious\n          props: [desk, laptop, office chair]\n          image_prompt: seated at desk, knees wide, hand on laptop, other hand at collar, looking at screen\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [laptop, work, type]\n\n    bed_sitting:\n      subtitle: Sitting on the Bed\n      environment: bedroom bed\n      triggers: [\"sit on the bed\", \"sits on the bed\", \"edge of the bed\", \"sitting on the bed\"]\n      exit_triggers: [\"get up\", \"stand up\", \"lie back\"]\n      entry: sits on the bed edge\n      default_activity: edge_sit\n      activities:\n        edge_sit:\n          description: sitting on the bed edge\n          triggers: [edge, sit, perch]\n          selection: random\n          poses: [bedsit_edge_holding, bedsit_arms_overhead, bedsit_edge_cross]\n        leaning:\n          description: leaning in or back\n          triggers: [lean, recline, headboard]\n          selection: random\n          poses: [bedsit_headboard, bedsit_lean_forward, bedsit_headboard_kneel]\n      poses:\n        - id: bedsit_headboard\n          name: Against Headboard\n          posture: seated\n          description: Reclines against the pillows with knees raised and apart and one hand behind her head.\n          body: leaning back against pillows, relaxed\n          legs: knees raised and apart, feet flat on mattress\n          arms: one arm raised behind head\n          hands: fingers touching hair behind ear\n          head: tilted, eyes direct\n          expression: sly, inviting\n          props: [pillows, headboard]\n          image_prompt: sitting against headboard, knees raised, hand behind head, reclined, head tilted, sly smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [headboard, pillows]\n        - id: bedsit_edge_holding\n          name: Holding a Coat\n          posture: seated\n          description: Sits on the bed edge with knees apart, holding a coat draped across her lap.\n          body: slight lean toward viewer, one shoulder dropped\n          legs: knees apart, lower legs crossed at the ankle\n          arms: both arms resting on the coat in her lap\n          hands: both hands gripping the coat\n          head: tilted, eyes direct\n          expression: playful, lips parted\n          props: [coat]\n          image_prompt: sitting on bed edge, knees apart, ankles crossed, holding coat in lap, head tilted\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [coat, hold]\n        - id: bedsit_arms_overhead\n          name: Arms Overhead\n          posture: seated\n          description: Sits on the bed edge with both arms raised and hands clasped above her head.\n          body: upright, back slightly arched, chest lifted\n          legs: knees apart, feet flat on floor\n          arms: both arms raised overhead\n          hands: hands clasped above head\n          head: tilted, gaze direct\n          expression: confident, sultry\n          props: []\n          image_prompt: sitting on bed edge, arms raised overhead, hands clasped, knees apart, back arched\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [arms, overhead]\n        - id: bedsit_lean_forward\n          name: Leaning Toward Viewer\n          posture: seated\n          description: Leans toward the viewer holding the front of her top closed with both hands.\n          body: torso leaning forward, shoulders rounded\n          legs: knees together, feet tucked beneath bed edge\n          arms: elbows pressed in\n          hands: both hands holding top closed at chest\n          head: chin lowered, eyes up\n          expression: coy, teasing\n          props: []\n          image_prompt: sitting on bed, leaning forward, hands at chest, elbows in, chin down, looking up\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [lean, collar]\n        - id: bedsit_edge_cross\n          name: Crossed at the Edge\n          posture: seated\n          description: Sits on the bed edge with legs crossed, leaning back on both hands.\n          body: leaning back, chest open\n          legs: legs crossed at the knee, top foot pointed\n          arms: both arms straight behind her\n          hands: palms flat on mattress\n          head: tilted back slightly, gaze direct\n          expression: relaxed, flirty\n          props: []\n          image_prompt: sitting on bed edge, legs crossed, leaning back on hands, head tilted back\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [cross, hands]\n        - id: bedsit_headboard_kneel\n          name: Facing Headboard\n          posture: kneeling\n          description: Kneels on the bed facing the headboard with forearms resting on it, looking back over her shoulder with a fingertip at her lips.\n          body: leaning forward onto the headboard, back arched, torso twisted\n          legs: knees apart, kneeling on the mattress\n          arms: forearms stacked along the top of the headboard\n          hands: one hand raised with fingertip to lips\n          head: turned back over shoulder, eyes sideways\n          expression: coy, teasing\n          props: [bed, headboard]\n          image_prompt: kneeling on bed facing headboard, forearms on headboard, looking over shoulder, fingertip at lips\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [headboard, kneel]\n\n    bedside_standing:\n      subtitle: Standing by the Bed\n      environment: bedside\n      triggers: [bedside, \"beside the bed\", \"by the bed\", \"next to the bed\"]\n      exit_triggers: [\"get on the bed\", \"sit down\", \"walk away\"]\n      entry: stops beside the bed\n      default_activity: standing_pose\n      activities:\n        standing_pose:\n          description: posing upright by the bed\n          triggers: [stand, pose, glance]\n          selection: random\n          poses: [bedside_arms_up, bedside_rail_glance]\n        bending_low:\n          description: bending or crouching low\n          triggers: [bend, crouch, reach]\n          selection: random\n          poses: [bedside_bend_thighs, bedside_bend_low, bedside_squat]\n      poses:\n        - id: bedside_arms_up\n          name: Hands Behind Head\n          posture: standing\n          description: Stands with feet wide and both arms raised, hands behind her head.\n          body: hip tilted, torso stretched, chest lifted\n          legs: feet wide apart, weight on one leg\n          arms: both arms raised, elbows out\n          hands: fingers laced behind head\n          head: chin lowered, eyes direct\n          expression: confident, smoldering\n          props: [bed]\n          image_prompt: standing, feet apart, both hands behind head, elbows out, hip tilted, chin down\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [arms, elbows]\n        - id: bedside_rail_glance\n          name: Rail Glance\n          posture: standing\n          description: Stands with her back to the viewer, leaning against the bed rail and glancing over her shoulder.\n          body: back to viewer, torso twisted, leaning on rail\n          legs: feet together, legs straight\n          arms: one hand resting at hip\n          hands: other hand lightly on rail\n          head: over shoulder, eyes direct\n          expression: coy smile\n          props: [bed rail]\n          image_prompt: standing from behind, leaning on bed rail, looking over shoulder, hand on hip, feet together\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [rail, shoulder]\n        - id: bedside_bend_thighs\n          name: Hands on Thighs\n          posture: standing\n          description: Bends forward at the waist beside the bed with hands resting on her thighs.\n          body: bent forward, back flat, seen from behind\n          legs: feet apart, knees slightly bent\n          arms: arms extended down\n          hands: palms resting on thighs\n          head: lowered, hair falling forward\n          expression: unseen, head dipped\n          props: [bed]\n          image_prompt: standing bent forward at waist, hands on thighs, feet apart, from behind, low angle\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [thighs, bend]\n        - id: bedside_bend_low\n          name: Deep Bend\n          posture: standing\n          description: Folds deeply forward with legs wide and one hand on her shin.\n          body: folded forward, torso hanging low\n          legs: legs wide apart, straight\n          arms: one arm hanging, other reaching to shin\n          hands: one hand gripping shin\n          head: hanging low, hair falling forward\n          expression: unseen, head down\n          props: [bed]\n          image_prompt: deep forward bend, legs wide, hand on shin, head hanging, from behind, low angle\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [deep, shin]\n        - id: bedside_squat\n          name: Crouched Twist\n          posture: squatting\n          description: Crouches in a deep squat beside the bed, twisting back with one arm extended behind her.\n          body: deep squat, torso twisted toward viewer\n          legs: knees bent deeply, feet planted flat\n          arms: one arm extended back for balance\n          hands: loose open hand\n          head: turned over shoulder, eyes direct\n          expression: intense, direct\n          props: [bed]\n          image_prompt: deep squat beside bed, torso twisted, one arm extended behind, looking over shoulder\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [squat, crouch]\n",
    "physical.yaml": "scenes:\n  provocative:\n    floor_kneeling:\n      subtitle: Kneeling on the Floor\n      environment: bedroom floor\n      triggers: [kneel, kneeling, \"on the floor\", \"on her knees\"]\n      exit_triggers: [\"stand up\", \"get up\", \"rise\"]\n      entry: sinks to her knees\n      default_activity: upright_kneel\n      activities:\n        upright_kneel:\n          description: kneeling tall\n          triggers: [tall, upright, kneel]\n          selection: random\n          poses: [floor_tall, floor_sit_heels, floor_one_knee]\n        low_kneel:\n          description: kneeling low or leaning\n          triggers: [low, lean, crawl]\n          selection: random\n          poses: [floor_hands_knees, floor_side_sit]\n      poses:\n        - id: floor_tall\n          name: Tall Kneel\n          posture: kneeling\n          description: Kneels tall with thighs vertical and hands on her thighs.\n          body: upright, hips over knees, shoulders back\n          legs: knees hip-width apart, tops of feet on floor\n          arms: relaxed at sides\n          hands: palms resting on thighs\n          head: chin level, eyes forward\n          expression: calm, attentive\n          props: []\n          image_prompt: kneeling upright on floor, hands on thighs, back straight\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tall, upright]\n        - id: floor_sit_heels\n          name: Sitting on Heels\n          posture: kneeling\n          description: Sits back on her heels with hands folded in her lap.\n          body: sitting low, back straight\n          legs: knees together, feet beneath\n          arms: forearms in lap\n          hands: fingers interlaced\n          head: slightly bowed, eyes lifted\n          expression: demure\n          props: []\n          image_prompt: kneeling sitting on heels, hands in lap, knees together\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [heels, sit back]\n        - id: floor_one_knee\n          name: One Knee Up\n          posture: kneeling\n          description: Rests on one knee with the other foot planted flat.\n          body: leaning slightly forward\n          legs: one knee down, other foot flat in front\n          arms: forearm resting on raised knee\n          hands: hand dangling off knee\n          head: tilted, gaze direct\n          expression: confident smirk\n          props: []\n          image_prompt: half kneeling on one knee, forearm on raised knee, leaning forward\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [one knee, half]\n        - id: floor_hands_knees\n          name: Hands and Knees\n          posture: kneeling\n          description: Supports herself on hands and knees with her head lifted.\n          body: horizontal, spine neutral\n          legs: knees hip-width apart\n          arms: arms straight, shoulders over wrists\n          hands: palms flat on floor\n          head: raised, looking forward\n          expression: curious, playful\n          props: []\n          image_prompt: on hands and knees on floor, head raised, looking at viewer\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [crawl, hands and knees]\n        - id: floor_side_sit\n          name: Side Sit\n          posture: kneeling\n          description: Sits beside her folded legs with one hand braced on the floor.\n          body: leaning on braced arm, hips to the side\n          legs: both knees bent to one side, feet tucked\n          arms: one arm braced on floor\n          hands: palm flat on floor\n          head: tilted toward shoulder, eyes up\n          expression: soft smile\n          props: []\n          image_prompt: sitting sideways on floor, legs folded to side, one hand on floor\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [side, mermaid]\n\n    chair_straddle:\n      subtitle: Straddling a Chair\n      environment: bedroom chair\n      triggers: [straddle, \"backwards chair\", \"sit backwards\", \"straddling\"]\n      exit_triggers: [\"stand up\", \"get off\", \"turn around\"]\n      entry: swings a leg over\n      default_activity: backward_sit\n      activities:\n        backward_sit:\n          description: sitting backward on chair\n          triggers: [backward, sit, lean]\n          selection: random\n          poses: [strad_rest_chin, strad_arms_back, strad_tilt]\n        playful:\n          description: teasing from the chair\n          triggers: [tease, smirk, grip]\n          selection: random\n          poses: [strad_grip, strad_rock]\n      poses:\n        - id: strad_rest_chin\n          name: Chin on Backrest\n          posture: seated\n          description: Sits backward with her chin resting on her folded arms over the backrest.\n          body: leaning forward onto backrest\n          legs: legs straddling seat, knees wide, feet flat\n          arms: folded across top of backrest\n          hands: fingers tucked under elbows\n          head: chin on forearms, gaze direct\n          expression: teasing smile\n          props: [chair]\n          image_prompt: sitting backwards on chair, chin on arms on backrest, legs straddling\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [chin, rest]\n        - id: strad_arms_back\n          name: Arms on Backrest\n          posture: seated\n          description: Sits backward with her arms spread along the top of the backrest.\n          body: upright, chest forward\n          legs: knees wide, feet flat or on toes\n          arms: both arms draped along backrest\n          hands: fingers curled over the top rail\n          head: tilted, eyes forward\n          expression: confident smirk\n          props: [chair]\n          image_prompt: straddling chair backwards, arms spread along backrest, upright, smirk\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [arms, spread]\n        - id: strad_tilt\n          name: Tipped Forward\n          posture: seated\n          description: Leans far forward over the backrest so only her toes touch the floor.\n          body: tilted forward, weight on backrest\n          legs: straddling seat, heels lifted\n          arms: elbows on backrest\n          hands: hands dangling over the top\n          head: lowered, eyes up\n          expression: mischievous\n          props: [chair]\n          image_prompt: straddling chair backwards, leaning forward, heels lifted, elbows on backrest\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [tipped, forward]\n        - id: strad_grip\n          name: Gripping the Back\n          posture: seated\n          description: Sits backward gripping the backrest with both hands and looking over her shoulder.\n          body: torso twisted slightly toward viewer\n          legs: knees wide, feet flat\n          arms: arms extended onto backrest\n          hands: both hands gripping top rail\n          head: turned toward viewer, eyes locked\n          expression: bold, playful\n          props: [chair]\n          image_prompt: straddling chair backwards, gripping backrest, looking over shoulder, bold\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [grip, hold]\n        - id: strad_rock\n          name: Rocked Back\n          posture: seated\n          description: Rocks the chair back on two legs with one hand on the rail.\n          body: leaning back, relaxed\n          legs: knees wide, feet braced on floor\n          arms: one hand on backrest, other raised\n          hands: raised hand pushing hair back\n          head: tilted back, eyes half-lidded\n          expression: lazy grin\n          props: [chair]\n          image_prompt: straddling chair, tilted back on two legs, hand pushing hair back\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [rock, tilt]\n\n    undressing_tease:\n      subtitle: Undressing Tease\n      environment: bedroom\n      triggers: [strip, undress, \"take off\", \"undressing\"]\n      exit_triggers: [\"stop\", \"put back on\", \"dress again\"]\n      entry: begins to undress slowly\n      default_activity: removing_layer\n      activities:\n        removing_layer:\n          description: removing an outer layer\n          triggers: [jacket, shirt, remove]\n          selection: random\n          poses: [strip_jacket, strip_shirt_lift, strip_glove]\n        teasing:\n          description: teasing before the next step\n          triggers: [tease, pause, turn]\n          selection: random\n          poses: [strip_turn_away, strip_hand_hem]\n      poses:\n        - id: strip_jacket\n          name: Slipping Off Jacket\n          posture: standing\n          description: Slides a jacket off one shoulder while looking at the viewer.\n          body: shoulders rolled, torso angled\n          legs: feet together, weight on one leg\n          arms: one arm pulling jacket down\n          hands: fingers holding jacket collar\n          head: chin dipped, eyes up\n          expression: coy, teasing\n          props: [jacket]\n          image_prompt: standing, sliding jacket off shoulder, looking at viewer, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [jacket, slip]\n        - id: strip_shirt_lift\n          name: Hem Pause\n          posture: standing\n          description: Holds the hem of her top and pauses with a playful look.\n          body: upright, chest forward\n          legs: feet apart slightly\n          arms: both arms down, hands at hem\n          hands: fingers gripping hem\n          head: tilted, eyes direct\n          expression: playful, daring\n          props: []\n          image_prompt: standing, hands holding hem of shirt, pause, playful, tilted head\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [hem, shirt]\n        - id: strip_glove\n          name: Pulling Off Glove\n          posture: standing\n          description: Pulls off a glove one finger at a time.\n          body: relaxed, slight lean\n          legs: one foot crossed in front\n          arms: one arm raised, other holding glove\n          hands: fingers pulling glove fingertip\n          head: lowered, eyes watching hands then up\n          expression: slow smile\n          props: [glove]\n          image_prompt: standing, pulling off glove finger by finger, eyes up, slow smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [glove, fingers]\n        - id: strip_turn_away\n          name: Turning Away\n          posture: standing\n          description: Turns her back and looks over her shoulder while loosening her hair.\n          body: back to viewer, torso twisted\n          legs: one foot slightly forward\n          arms: both arms up to hair\n          hands: fingers releasing hair clip\n          head: over shoulder, eyes direct\n          expression: knowing smile\n          props: []\n          image_prompt: standing from behind, hands in hair, looking over shoulder, knowing smile\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [turn, back]\n        - id: strip_hand_hem\n          name: Fingers on Collar\n          posture: standing\n          description: Traces her collar with one hand while leaning her head to the side.\n          body: slightly arched, shoulders back\n          legs: legs crossed at ankle\n          arms: one hand at collar, other at side\n          hands: fingertips tracing neckline\n          head: tilted, eyes lidded\n          expression: sultry\n          props: []\n          image_prompt: standing, fingers tracing collar, head tilted, lidded eyes\n          negative_prompt: extra limbs, bad hands, deformed, nudity, explicit\n          triggers: [collar, trace]\n\n    table_bend:\n      subtitle: Bending Over Table\n      environment: table\n      triggers: [table, \"over the table\", \"lean on the table\", bending]\n      exit_triggers: [\"stand upright\", \"step back\", \"leave the table\"]\n      entry: leans toward the table\n      default_activity: leaning_forward\n      activities:\n        leaning_forward:\n          description: leaning forward on table\n          triggers: [lean, forward, elbows]\n          selection: random\n          poses: [table_forearms, table_palms, table_pick_up]\n        reaching:\n          description: reaching across table\n          triggers: [reach, stretch, across]\n          selection: random\n          poses: [table_reach, table_look_back]\n      poses:\n        - id: table_forearms\n          name: Forearms Down\n          posture: standing\n          description: Bends forward with both forearms flat on the table.\n          body: bent at the waist, back flat\n          legs: feet apart, knees slightly bent\n          arms: forearms flat on table\n          hands: fingers loosely interlaced\n          head: lifted, eyes forward\n          expression: teasing\n          props: [table]\n          image_prompt: standing, bent forward at waist, forearms on table, head raised, teasing\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [forearms, bend]\n        - id: table_palms\n          name: Palms Flat\n          posture: standing\n          description: Braces both palms on the table edge and leans her weight forward.\n          body: leaning forward, arms straight\n          legs: feet shoulder-width, one foot back\n          arms: arms straight, locked\n          hands: palms flat on table edge\n          head: chin up, gaze direct\n          expression: bold, confident\n          props: [table]\n          image_prompt: standing, palms flat on table, leaning forward, arms straight, bold look\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [palms, brace]\n        - id: table_pick_up\n          name: Picking Up Item\n          posture: standing\n          description: Bends from the waist to pick up something on the far side of the table.\n          body: bent forward, one arm extended\n          legs: one leg lifted slightly behind\n          arms: one arm extended, other on table\n          hands: fingers closing on object\n          head: lowered, eyes on object\n          expression: absorbed\n          props: [table, item]\n          image_prompt: standing, bent over table, reaching for object, one leg lifted behind\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [pick, grab]\n        - id: table_reach\n          name: Reaching Across\n          posture: standing\n          description: Stretches across the table toward the viewer, one hand extended.\n          body: stretched long, torso low over tabletop\n          legs: up on toes, feet together\n          arms: one arm fully extended\n          hands: open palm reaching toward viewer\n          head: chin on table-level, eyes on viewer\n          expression: playful\n          props: [table]\n          image_prompt: stretched across table, arm extended toward viewer, on tiptoe, playful\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [across, reach]\n        - id: table_look_back\n          name: Glance Back\n          posture: standing\n          description: Leans on the table with her back to the viewer and looks back over her shoulder.\n          body: bent forward, spine arched\n          legs: feet apart, knees soft\n          arms: hands on table, elbows slightly bent\n          hands: palms on table\n          head: turned over shoulder, eyes direct\n          expression: coy\n          props: [table]\n          image_prompt: from behind, leaning on table, palms down, looking over shoulder, coy\n          negative_prompt: extra limbs, bad hands, deformed, nudity\n          triggers: [glance, back]"
  },
  "applyImagePrompt": true,
  "debug": false
};

  const VERSION = "1.0.0";
  const MARKER = "[SCENE & POSE";

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
    transition_cue_bonus: 1.5
  };

  const api = { version: VERSION, debug: !!BUILD.debug, status: "idle", current: null };
  const log = (...a) => { if (api.debug) console.log("[SceneManager]", ...a); };

  /* ---------------------------------------------------------------
     Text matching
     --------------------------------------------------------------- */
  function norm(t) {
    return String(t || "").toLowerCase().replace(/[\u2018\u2019]/g, "'");
  }
  function esc(s) {
    return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }

  // Compile one trigger ("couch", "on the couch", "head* to") to a regex.
  // `*` = any word ending. Plain words also match -s/-es/-ed/-ing.
  function compileTrigger(raw) {
    const t = norm(raw).trim();
    if (!t) return null;
    const parts = t.split(/\s+/);
    // `*` = any word ending; every plain word of 3+ letters also accepts -s/-es/-ed/-ing
    const pat = parts
      .map((w) => (!w.includes("*") && /^[a-z]{3,}$/.test(w) ? w + "(?:s|es|ed|ing)?" : esc(w).replace(/\*/g, "[a-z0-9']*")))
      .join("\\s+");
    return {
      raw: t,
      // multi-word phrases are stronger evidence than single words
      weight: 1 + 0.5 * (parts.length - 1),
      re: new RegExp("(?<![a-z0-9'])" + pat + "(?![a-z0-9])", "g")
    };
  }
  function compileList(list) {
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    return arr.map(compileTrigger).filter(Boolean);
  }

  function scoreText(text, compiled, maxHits) {
    const cap = maxHits || 2;
    const t = norm(text);
    let score = 0;
    const hits = [];
    if (!t) return { score, hits };
    for (const c of compiled) {
      const m = t.match(c.re);
      if (m) {
        score += Math.min(m.length, cap) * c.weight;
        hits.push(c.raw);
      }
    }
    return { score, hits };
  }

  function weightedScore(parts, compiled) {
    let score = 0;
    const hits = new Set();
    for (const p of parts) {
      const r = scoreText(p.text, compiled);
      score += r.score * p.w;
      r.hits.forEach((h) => hits.add(h));
    }
    return { score, hits: [...hits] };
  }

  /* ---------------------------------------------------------------
     Library building
     --------------------------------------------------------------- */
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
    p.compiled = compileList(p.triggers);
    return p;
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
          triggers: compileList(a.triggers)
        };
      }
    } else {
      acts.default = { key: "default", description: "", selection: "random", defined_pose: null, poses: order.slice(), triggers: [] };
    }
    const defaultActivity = acts[sc.default_activity] ? sc.default_activity : Object.keys(acts)[0];
    if (sc.default_activity && !acts[sc.default_activity]) {
      lib.warnings.push(`${id}: default_activity "${sc.default_activity}" does not exist`);
    }

    return {
      id, category, sid, file,
      subtitle: sc.subtitle || sid,
      description: sc.description || "",
      environment: sc.environment || "",
      entry: sc.entry || "",
      sticky: sc.sticky !== false,
      triggers: compileList(sc.triggers),
      exits: compileList(sc.exit_triggers),
      activities: acts,
      defaultActivity,
      poses,
      poseOrder: order
    };
  }

  // indexDoc = parsed index.yaml; included = [{name, doc}] in include order
  function buildLibrary(indexDoc, included) {
    indexDoc = indexDoc || {};
    const lib = {
      settings: Object.assign({}, DEFAULT_SETTINGS, indexDoc.settings || {}),
      cues: compileList(indexDoc.transition_cues),
      poseLibrary: {},
      transitions: { scene: [], posture: [] },
      scenes: {},
      warnings: [],
      defaultSceneId: null
    };
    const pending = [];
    for (const { name, doc } of included) {
      if (!doc || typeof doc !== "object") { lib.warnings.push(`${name}: file is empty or not valid YAML`); continue; }
      Object.assign(lib.poseLibrary, doc.pose_library || {});
      const tr = doc.transitions || {};
      lib.transitions.scene.push(...(tr.scene || []));
      lib.transitions.posture.push(...(tr.posture || []));
      for (const [cat, scenes] of Object.entries(doc.scenes || {})) {
        for (const [sid, sc] of Object.entries(scenes || {})) pending.push({ cat, sid, sc, name });
      }
    }
    for (const { cat, sid, sc, name } of pending) {
      const id = cat + "/" + sid;
      if (lib.scenes[id]) lib.warnings.push(`${name}: scene "${id}" defined twice; the later one wins`);
      lib.scenes[id] = prepareScene(lib, id, cat, sid, sc, name);
    }
    const ids = Object.keys(lib.scenes);
    if (!ids.length) lib.warnings.push("No scenes were loaded");
    lib.defaultSceneId = lib.scenes[lib.settings.default_scene] ? lib.settings.default_scene : ids[0] || null;
    if (!lib.scenes[lib.settings.default_scene]) {
      lib.warnings.push(`default_scene "${lib.settings.default_scene}" does not exist; using "${lib.defaultSceneId}"`);
    }
    return lib;
  }

  async function loadLibrary(readText, parse) {
    const indexDoc = parse(await readText("index.yaml")) || {};
    const included = [];
    for (const name of indexDoc.include || []) {
      included.push({ name, doc: parse(await readText(name)) });
    }
    return buildLibrary(indexDoc, included);
  }

  /* ---------------------------------------------------------------
     State
     --------------------------------------------------------------- */
  function createState() {
    return { sceneId: null, activity: null, poseId: null, history: [], turnsInPose: 0, announced: null, lock: false, origPrefix: undefined, appliedPrefix: "" };
  }
  function record(state, poseId) {
    if (!poseId) return;
    state.history = (state.history || []).concat(poseId).slice(-20);
    state.turnsInPose = 0;
  }

  /* ---------------------------------------------------------------
     Scene detection
     --------------------------------------------------------------- */
  function detectScene(lib, state, parts, userText) {
    const st = lib.settings;
    const scores = {};
    for (const sc of Object.values(lib.scenes)) {
      if (!sc.triggers.length) continue;
      const r = weightedScore(parts, sc.triggers);
      scores[sc.id] = { score: r.score, total: r.score, hits: r.hits };
    }
    const cur = state.sceneId && lib.scenes[state.sceneId] ? lib.scenes[state.sceneId] : null;
    const exit = !!(cur && cur.exits.length && weightedScore(parts, cur.exits).score > 0);
    const cue = !!(userText && lib.cues.length && scoreText(userText, lib.cues).score > 0);

    let best = null;
    for (const [id, r] of Object.entries(scores)) {
      if (cur && id === cur.id) continue;
      if (cue && r.score > 0) r.total = r.score + st.transition_cue_bonus;
      if (!best || r.total > best.total) best = { id, total: r.total, hits: r.hits };
    }
    const curScore = cur && scores[cur.id] ? scores[cur.id].score : 0;
    const threshold = exit ? Math.min(st.scene_change_threshold, 1) : st.scene_change_threshold;

    const out = { scores, exit, cue, sceneId: null, reason: "" };
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

  /* ---------------------------------------------------------------
     Pose selection
     --------------------------------------------------------------- */
  function explicitPose(sc, userText, currentId, threshold) {
    let best = null;
    let bs = 0;
    for (const id of sc.poseOrder) {
      const p = sc.poses[id];
      if (!p.compiled.length) continue;
      const r = scoreText(userText, p.compiled);
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

  /* ---------------------------------------------------------------
     One step: update the state from new text
     input: { userText, aiText, userTurn }
     --------------------------------------------------------------- */
  function advance(lib, state, input, opts) {
    const rng = (opts && opts.rng) || Math.random;
    const st = lib.settings;
    const userText = (input && input.userText) || "";
    const aiText = (input && input.aiText) || "";
    const userTurn = !!(input && input.userTurn);

    const parts = [];
    if (userText) parts.push({ text: userText, w: st.user_text_weight });
    if (aiText) parts.push({ text: aiText, w: userText ? st.ai_text_weight : 1 });

    const info = { scores: {}, exit: false, cue: false, sceneChanged: false, activityChanged: false, poseChanged: false, reason: "" };

    if (!lib.scenes[state.sceneId]) state.sceneId = null;

    // 1. scene
    if (!state.lock) {
      const det = detectScene(lib, state, parts, userText);
      info.scores = det.scores;
      info.exit = det.exit;
      info.cue = det.cue;
      if (det.sceneId && det.sceneId !== state.sceneId) {
        state.sceneId = det.sceneId;
        info.sceneChanged = true;
        info.reason = det.reason;
      }
    }
    if (!state.sceneId) {
      state.sceneId = lib.defaultSceneId;
      info.sceneChanged = true;
      info.reason = info.reason || "default scene";
    }
    const sc = lib.scenes[state.sceneId];
    if (!sc) return { state, info };

    // 2. activity
    let act = !info.sceneChanged && sc.activities[state.activity] ? state.activity : null;
    let bestA = null;
    let bestS = 0;
    for (const a of Object.values(sc.activities)) {
      if (!a.triggers.length) continue;
      const r = weightedScore(parts, a.triggers);
      if (r.score > bestS) { bestS = r.score; bestA = a.key; }
    }
    if (bestA && bestS >= st.activity_change_threshold) act = bestA;
    if (!act) act = sc.defaultActivity;
    if (act !== state.activity) { info.activityChanged = true; state.activity = act; }

    // 3. pose
    if (userTurn) state.turnsInPose = (state.turnsInPose || 0) + 1;
    const refresh = userTurn && st.pose_refresh_every > 0 && state.turnsInPose >= st.pose_refresh_every;
    const needNew = info.sceneChanged || info.activityChanged || !sc.poses[state.poseId] || refresh;
    const explicit = userTurn && userText ? explicitPose(sc, userText, state.poseId, st.pose_trigger_threshold) : null;

    let next = state.poseId;
    if (explicit) next = explicit;
    else if (needNew) next = pickPose(lib, sc, act, state, rng, refresh && !info.sceneChanged && !info.activityChanged);
    if (next && next !== state.poseId) { state.poseId = next; info.poseChanged = true; }
    if (info.poseChanged || needNew) record(state, state.poseId);

    return { state, info };
  }

  /* ---------------------------------------------------------------
     Directive text for the AI
     --------------------------------------------------------------- */
  function fill(text, ctx) {
    return String(text || "").replace(/\{(\w+)\}/g, (m, k) => (ctx[k] !== undefined ? ctx[k] : m));
  }
  function matchRule(rules, from, to, fromPosture, toPosture, kind) {
    let best = null;
    let bestScore = -1;
    for (const r of rules) {
      if (kind === "scene") {
        if ((r.from !== "*" && r.from !== from) || (r.to !== "*" && r.to !== to)) continue;
        const s = (r.from !== "*" ? 1 : 0) + (r.to !== "*" ? 1 : 0);
        if (s > bestScore) { best = r; bestScore = s; }
      } else {
        if ((r.from !== "*" && r.from !== fromPosture) || (r.to !== "*" && r.to !== toPosture)) continue;
        const s = (r.from !== "*" ? 1 : 0) + (r.to !== "*" ? 1 : 0);
        if (s > bestScore) { best = r; bestScore = s; }
      }
    }
    return best;
  }

  function buildDirective(lib, state, names) {
    const sc = lib.scenes[state.sceneId];
    if (!sc) return "";
    const pose = sc.poses[state.poseId];
    const act = sc.activities[state.activity];
    const ctx = { char: (names && names.char) || "the character", user: (names && names.user) || "the user" };

    const prev = state.announced;
    const prevScene = prev && lib.scenes[prev.sceneId];
    const prevPose = prevScene && prevScene.poses[prev.poseId];
    ctx.to_scene = sc.id;
    ctx.to_activity = state.activity;
    ctx.to_pose = state.poseId;
    ctx.from_scene = prev ? prev.sceneId : "";
    ctx.from_pose = prev ? prev.poseId : "";
    ctx.from_activity = prev ? prev.activity || "" : "";

    let move = "";
    const bridge = (fromP, toP) => {
      const r = matchRule(lib.transitions.posture, null, null, fromP, toP, "posture");
      return r && fromP !== toP ? `${ctx.char} ${r.text}.` : "";
    };
    if (!prev) {
      move = sc.entry ? `${ctx.char} ${sc.entry}.` : "";
    } else if (prev.sceneId !== state.sceneId) {
      const r = matchRule(lib.transitions.scene, prev.sceneId, state.sceneId, null, null, "scene");
      if (r) move = fill(r.text, ctx);
      else if (sc.entry) move = `${ctx.char} ${sc.entry}.`;
      else if (prevPose && pose) move = bridge(prevPose.posture, pose.posture);
    } else if (prev.poseId !== state.poseId && prevPose && pose) {
      move = bridge(prevPose.posture, pose.posture);
    }

    const lines = [];
    lines.push(`${MARKER} \u2014 private direction for ${ctx.char}. Never quote or mention this block.]`);
    lines.push(`Scene: ${sc.subtitle}${sc.environment ? " (" + sc.environment + ")" : ""}`);
    if (act && act.description) lines.push(`Activity: ${act.description}`);
    if (move) lines.push(`Movement this turn: ${move}`);
    if (pose) {
      lines.push(`${ctx.char}'s current body position: ${pose.description || pose.name}`);
      const field = (label, v) => { if (v && String(v).trim()) lines.push(`- ${label}: ${String(v).trim()}`); };
      field("Body", pose.body);
      field("Legs", pose.legs);
      field("Arms", pose.arms);
      field("Hands", pose.hands);
      field("Head", pose.head);
      field("Expression", pose.expression);
      if (Array.isArray(pose.props) && pose.props.length) field("Props", pose.props.join(", "));
    }
    lines.push(`Keep ${ctx.char}'s actions, narration and dialogue consistent with this position. Change position only when the story calls for it.`);

    state.announced = { sceneId: state.sceneId, poseId: state.poseId, activity: state.activity };
    return lines.join("\n");
  }

  /* ---------------------------------------------------------------
     Slash commands (typed by the user in chat)
     /scene list | /scene auto | /scene <id>   /pose list | /pose <id>
     --------------------------------------------------------------- */
  function findScene(lib, key) {
    const k = key.toLowerCase();
    if (lib.scenes[k]) return lib.scenes[k];
    return Object.values(lib.scenes).find((s) => s.sid.toLowerCase() === k) || null;
  }
  function handleCommand(lib, state, text, rng) {
    const m = /^\s*\/(scene|pose)\b\s*(.*)$/i.exec(text || "");
    if (!m) return { handled: false };
    const cmd = m[1].toLowerCase();
    const arg = m[2].trim();
    if (cmd === "scene") {
      if (!arg || arg === "list") {
        return { handled: true, reply: "Scenes: " + Object.keys(lib.scenes).join(", ") + "\n/scene <id> locks a scene, /scene auto unlocks." };
      }
      if (arg === "auto") { state.lock = false; return { handled: true, reply: "Scene detection is automatic again." }; }
      const sc = findScene(lib, arg);
      if (!sc) return { handled: true, reply: `Unknown scene "${arg}". Try /scene list.` };
      state.sceneId = sc.id;
      state.lock = true;
      state.activity = sc.defaultActivity;
      state.poseId = pickPose(lib, sc, state.activity, state, rng, false);
      record(state, state.poseId);
      return { handled: true, reply: `Scene locked: ${sc.id}. Use /scene auto to unlock.` };
    }
    const sc = lib.scenes[state.sceneId];
    if (!sc) return { handled: true, reply: "No active scene yet." };
    if (!arg || arg === "list") return { handled: true, reply: `Poses in ${sc.id}: ${sc.poseOrder.join(", ")}` };
    if (sc.poses[arg]) { state.poseId = arg; record(state, arg); return { handled: true, reply: `Pose set: ${arg}.` }; }
    return { handled: true, reply: `Unknown pose "${arg}". Try /pose list.` };
  }

  /* ---------------------------------------------------------------
     Perchance integration (only runs when `oc` exists)
     --------------------------------------------------------------- */
  let parseYaml = null;
  let libPromise = null;
  let memState = null;

  async function ensureParser() {
    if (parseYaml) return parseYaml;
    // a parser that is already on the page (window.jsyaml) is used first
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
          const lib = await loadLibrary(readText, parse);
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

  function loadState() {
    try {
      const cd = oc.thread.customData;
      if (cd && cd.__sceneManager) return JSON.parse(JSON.stringify(cd.__sceneManager));
    } catch (e) { /* ignore */ }
    return memState ? JSON.parse(JSON.stringify(memState)) : createState();
  }
  function saveState(s) {
    memState = JSON.parse(JSON.stringify(s));
    try {
      oc.thread.customData = oc.thread.customData || {};
      oc.thread.customData.__sceneManager = memState;
    } catch (e) { /* ignore */ }
  }

  function lastText(author) {
    try {
      const msgs = oc.thread.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].author === author) return String(msgs[i].content || "");
      }
    } catch (e) { /* ignore */ }
    return "";
  }

  function removeOldDirectives() {
    try {
      const msgs = oc.thread.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (m.author === "system" && typeof m.content === "string" && m.content.startsWith(MARKER)) msgs.splice(i, 1);
      }
    } catch (e) { /* ignore */ }
  }

  function applyImagePrompt(lib, state) {
    const sc = lib.scenes[state.sceneId];
    const pose = sc && sc.poses[state.poseId];
    api.current = pose ? { scene: sc.id, activity: state.activity, pose: pose.id, image_prompt: pose.image_prompt || "", negative_prompt: pose.negative_prompt || "" } : null;
    if (!BUILD.applyImagePrompt || !pose || !pose.image_prompt) return;
    try {
      if (!oc.character) return;
      let base = oc.character.imagePromptPrefix || "";
      if (state.appliedPrefix && base.endsWith(state.appliedPrefix)) base = base.slice(0, base.length - state.appliedPrefix.length);
      if (state.origPrefix === undefined) state.origPrefix = base;
      const add = (state.origPrefix ? ", " : "") + pose.image_prompt;
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

  async function onMessage(message) {
    if (!message || message.author === "system") return;
    const lib = await ensureLibrary();
    if (!lib) return;
    const state = loadState();

    if (message.author === "user") {
      const text = String(message.content || "");
      const cmd = handleCommand(lib, state, text, Math.random);
      let info = null;
      if (!cmd.handled) info = advance(lib, state, { userText: text, aiText: lastText("ai"), userTurn: true }).info;
      else if (state.lock) advance(lib, state, { userText: "", aiText: "", userTurn: true });
      applyImagePrompt(lib, state);
      removeOldDirectives();
      const directive = buildDirective(lib, state, names());
      saveState(state);
      if (info) log("user turn", info.reason || "(no change)", state.sceneId, state.activity, state.poseId);
      if (directive) oc.thread.messages.push({ author: "system", hiddenFrom: ["user"], content: directive });
      if (cmd.reply) oc.thread.messages.push({ author: "system", content: cmd.reply, expectsReply: false });
    } else if (message.author === "ai") {
      if (!state.lock) advance(lib, state, { userText: "", aiText: String(message.content || ""), userTurn: false });
      applyImagePrompt(lib, state);
      saveState(state);
    }
  }

  function attach() {
    ensureLibrary();
    oc.thread.on("MessageAdded", async function ({ message }) {
      try { await onMessage(message); } catch (e) { console.error("[SceneManager]", e); }
    });
    log("attached");
  }

  Object.assign(api, {
    attach, reload: () => { libPromise = null; return ensureLibrary(); },
    getState: () => (typeof oc !== "undefined" ? loadState() : null),
    getNegativePrompt: () => (api.current ? api.current.negative_prompt : ""),
    // pure functions (used by tests and the probe tool)
    DEFAULT_SETTINGS, MARKER, compileTrigger, scoreText, buildLibrary, loadLibrary,
    createState, advance, buildDirective, handleCommand, detectScene, pickPose
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
        oc.thread.messages.push({ author: "system", hiddenFrom: ["user"], content: buildMessage(url, content) });
        log("added content from", url);
      } catch (e) {
        console.warn("[WebReader] could not read " + url + ": " + (e && e.message));
        removeOld();
        oc.thread.messages.push({
          author: "system",
          hiddenFrom: ["user"],
          content: `${MARKER} \u2014 the link ${url} could not be opened (${e && e.message}). Tell the user you could not read it instead of guessing its contents.]`
        });
      }
    });
  }

  Object.assign(api, { attach, extractUrls, truncate, buildMessage, MARKER });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WebReader = api;
  if (typeof oc !== "undefined" && typeof oc.thread !== "undefined") attach();
})(typeof window !== "undefined" ? window : globalThis);
