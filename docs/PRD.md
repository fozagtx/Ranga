# RANGA PRD

## Product

RANGA is a one-dashboard command center for a ranger operator reviewing a trail-camera incident. The operator uploads one PNG/JPEG trail-camera image, enters GPS coordinates or a location description, and receives specialist-agent findings plus a final poaching-risk incident report.

## Non-Negotiables

- One dashboard.
- Installable Progressive Web App for supported desktop/mobile browsers.
- Main analysis endpoint: `POST /api/analyze`.
- No database, storage, auth, user accounts, roadmap, or optional feature set.
- No mock, simulated, fallback, or hardcoded incident report.
- Every agent node is part of a LangGraph workflow and calls Gemma 4 via Cerebras with model id `gemma-4-31b`.
- Each specialist agent node has a distinct system prompt and returns structured JSON.
- The Orchestrator is the final LangGraph node and produces the final report from specialist outputs.

## Users And Roles

| Role | Description | Can | Cannot |
| --- | --- | --- | --- |
| Ranger Operator | Person reviewing one trail-camera case | Upload an image, enter exact/approximate/unknown location, run analysis, view agent outputs and final report | Persist cases, manage accounts, edit agent outputs |

## Route Map And Permissions

| Route | Purpose | Ranger Operator | Notes |
| --- | --- | --- | --- |
| `/` | Single dashboard | Allowed | No auth by requirement. |
| `POST /api/analyze` | Run the multi-agent analysis | Allowed with image and location | Rejects missing image, missing location, missing API key, oversized files, and unsupported image types. |
| `/manifest.webmanifest` | PWA install metadata | Allowed | Provides name, display mode, theme color, and icons. |
| `/sw.js` | Service worker | Allowed | Caches app shell/static assets only; does not fake AI analysis offline. |

## Page Requirements

`/`

- Purpose: analyze one trail-camera case end to end.
- Visible data: RANGA logo, image/live camera/captured-frame preview, location input, elapsed analysis time, agent statuses/results, final report.
- Allowed actions: choose image, open/stop live camera, capture a frame that becomes the selected image, enter typed location, request browser device location, mark location as unknown, analyze the selected image or captured frame.
- Blocked actions: case persistence, login, account management, manual report editing.
- Empty state: no final report until a real analyze request succeeds.
- Error state: show the real backend error and do not invent outputs.
- Loading state: show every agent row as analyzing while the request is in flight and show a live elapsed-time counter.
- Completion timing: after a successful or failed analysis request, show the measured end-to-end processing time from submit to response/error.
- Agent output behavior: agent rows stay compact by default; full structured JSON is visible only for the active/expanded row so the dashboard does not require scrolling through every agent result.
- Camera behavior: camera controls must not require separate capture and analyze-frame mental models. Capturing a frame visibly updates the image preview and marks it as selected for the normal Analyze action.
- PWA behavior: the app can be installed on supported browsers; offline state serves only the shell/offline page and must not imply Cerebras analysis can run without network.

## UI System

- Component library: local React components and CSS.
- Design system: Instrument type stack, sky-to-white background, blue-tinted neutral palette, gossamer borders, rounded glass controls, inset-glow surfaces, and the supplied CTA gradient adapted for ranger actions.
- Brand assets: transparent-background RANGA shield/field-signal mark used for header logo, favicon, and PWA icons.
- Navigation: none; one dashboard.
- Forms: native file input, camera preview/capture controls, textarea, and buttons.
- Lists: compact agent result rows and evidence list.
- Visual restrictions: no landing page, no decorative gradients, no nested cards, no fake product copy.

## No Fake Demo Rules

- No bundled sample image or prefilled incident story.
- Every analysis must call Cerebras.
- Missing `CEREBRAS_API_KEY` must return an error.
- Weather findings are model analysis from the image/location only, not live weather service data.
- No UI state may prefill or hardcode agent results.
- Changing the image or location must clear any previous report before a new analysis runs.
- Live camera view is browser camera preview only; the agents analyze captured still frames submitted to `/api/analyze`, not an invented continuous background stream.
- Service worker must not cache `/api/analyze` responses.
- Risk scoring must not treat ordinary human presence alone as high risk. Higher severity requires suspicious context such as protected wildlife, night/boundary context, vehicles, weapons/tools, restricted-zone cues, evasion, carcass evidence, or other poaching indicators.

## Acceptance Criteria

- Image upload works.
- Live camera preview can capture a still frame for analysis when the browser grants camera permission.
- Location input works.
- Location input supports exact GPS, approximate place text, browser device geolocation, or explicit unknown-location text without inventing coordinates.
- Camera capture produces a visible selected-frame preview before analysis.
- The dashboard shows a live analysis timer during processing and the final processing duration after completion.
- Gemma 4 via Cerebras is called.
- Camera, Animal Detection, GPS, Weather, Poaching Risk, and Alert agents return structured JSON.
- Orchestrator produces `final_report`.
- UI displays agent cards, final recommendation, and highlighted risk level.
- Web app manifest, icons, and service worker are present for installability.
- Header includes transparent-background RANGA logo and favicon assets.
- A real upload or captured frame can be analyzed end-to-end once `CEREBRAS_API_KEY` is configured.
