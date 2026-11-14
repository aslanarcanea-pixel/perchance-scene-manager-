# Turning a photo into a pose (checklist)

Describe **body position only**: no faces, names, clothing, background, lighting or watermarks.
Poses stay non-explicit.

1. **Posture**: standing / seated / kneeling / squatting / lying.
2. **Body**: torso angle, lean, arch, shoulders.
3. **Legs**: knees, crossing, feet, weight.
4. **Arms and hands**: where they are and what they touch (use props, e.g. `cushion`).
5. **Head**: tilt and where the eyes look. **Expression**: 1-4 words (`coy`, `playful smirk`).
6. **Camera**: front, from behind, low or high angle. Put "from behind" or "low angle" in `image_prompt`
   and the camera rules in `behavior.yaml` add the right angle automatically.
7. **Optional fields**: `distance: [near, close]`, `moods: [coy]`, `expressions: [EXP_003]`, `micro: [...]`.
8. **Repeat check**: run `add-pose.js --dry-run`. It refuses poses that are 60% or more similar to an existing one.

Template (save as `new-pose.yaml`):

```yaml
id: couch_example          # lowercase, unique, scene prefix
name: Example Name
posture: seated
description: One sentence on what the body is doing.
body: torso position
legs: leg and foot position
arms: arm position
hands: what the hands do or hold
head: angle and gaze
expression: coy, knowing
props: [couch]
image_prompt: comma, separated, pose, tags
negative_prompt: extra limbs, bad hands, deformed, nudity, explicit
triggers: [example]        # distinctive words only (not "legs", "back", "hands" ...)
```

Then:

```
node tools/add-pose.js --file scenes/indoor.yaml --scene couch_sitting --activity lounging new-pose.yaml --dry-run
node tools/add-pose.js --file scenes/indoor.yaml --scene couch_sitting --activity lounging new-pose.yaml
node test/run-tests.js && node build.js
```
(A scene holds at most 8 poses. If it is full, create a new scene from `examples/scene-example.yaml`.)
