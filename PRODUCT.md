# Product

## Register

product

## Users

Two distinct profiles served by the same system, differentiated at onboarding:

**Primary — The Serious Athlete (Intermediate/Advanced)**
Context: 2+ years training, trains 4–6x/week, understands RIR/RPE, follows periodization, wants a tool that matches their level of precision. Uses the app in the gym, between sets, on a phone with sweaty hands. Every second matters. They hate apps that talk down to them.

**Secondary — The Committed Beginner**
Context: 6–18 months in, wants to train properly from the start, needs structure and education embedded in the experience without it feeling like onboarding tutorials. They benefit from guided programs, auto-progression, and explanations that don't feel condescending.

Both share: seriousness about results, frustration with generic fitness apps, willingness to invest in quality tools.

## Product Purpose

FORJA is the premium training intelligence platform for hypertrophy. It exists because every serious tool for muscle-building is either too clinical (Symmetry), too generic (MyFitnessPal), or too shallow (Hevy). FORJA is the one that treats training as a craft — methodical, data-driven, but with the intensity and soul of the forge it's named after.

Success looks like: an athlete using FORJA as their single source of truth — programs, sessions, progress, nutrition, all connected — with smart suggestions replacing manual guesswork, and a visual experience that feels like the tool takes training as seriously as they do.

## Brand Personality

**Intense. Motivating. Premium.**

Voice: Direct, expert, never preachy. Military precision without military rigidity. Uses terminology athletes already know (RIR, RPE, mesociclo, V-taper, deload). Names things with intent — sessions are "Misiones", the exercise library is "Biblioteca de Hierro", the app itself means "to forge".

Tone: High-signal, low-noise. Every word earns its place. The app speaks like a coach who knows what they're doing, not a lifestyle brand trying to be your friend.

Emotional goal: Users should feel capable, focused, and proud to use the tool. Never babied. Never overwhelmed. The interface should feel like putting on training gear — it signals it's time to work.

## Anti-references

- **Nike Training Club**: Too consumer, too lifestyle, too friendly. Forgets that training is hard and should feel that way. Pastel gradients and "You got this!" copy is the opposite of FORJA.
- **Generic fitness apps** (MyFitnessPal, Lose It): Functional but personality-free. Utilitarian UIs that feel built by accountants. FORJA has character.
- **Symmetry**: Good data, cold execution. The analytics are powerful but the app feels like a spreadsheet with a dark theme. FORJA has the same analytical depth with the intensity and motivation that Symmetry lacks.

## Design Principles

1. **Precision over personality** — Every element is there because it serves the user's training, not to decorate the interface. When in doubt, cut.
2. **Data that motivates** — Numbers aren't just information; they're fuel. Volume PR, weekly tonnage, symmetry score — frame them to drive action, not just record history.
3. **Expert fluency** — Assume the user knows their craft. Use the right terminology. Don't explain what RIR is; just show it.
4. **Progressive intensity** — The interface matches the energy of a session. Calm on the dashboard (planning), focused during workout (execution), proud at the summary (achievement).
5. **Both users, one system** — Beginners get structure and guidance embedded in the experience. Advanced users get raw control and data. Neither feels like they're using a different version of the app.

## Accessibility & Inclusion

- WCAG AA minimum; target AAA for text contrast given the very dark base (#0A0A0B)
- Reduced motion support via `prefers-reduced-motion` — Framer Motion variants should respond to this
- Touch targets minimum 44×44px — app is used in the gym, on phones, with tired hands
- All interactive inputs labeled (not just placeholder text)
- Color is never the only signal — always pair with text or shape
