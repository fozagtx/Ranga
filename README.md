# RANGA

Next.js single-dashboard poaching-risk command center using a LangGraph multi-agent workflow. Every graph node calls Gemma 4 through Cerebras.

## Run

```bash
npm install
cp .env.example .env
# add your Cerebras API key to .env
npm run dev
```

Open `http://localhost:3000`.

## Install as an app

RANGA is a progressive web app. In development it can be installed from `http://localhost:3000`; in production it must be served over HTTPS.

- Desktop Chrome/Edge: open the site, then use the browser install button or **Install app** from the menu.
- Android Chrome: open the site, then use **Add to Home screen** or **Install app**.
- iPhone/iPad Safari: open the site, tap Share, then **Add to Home Screen**.

The app shell is cached for launch/offline viewing. Agent analysis is intentionally network-only because Gemma 4 via Cerebras must be called live.

## Use

Upload a real PNG/JPEG trail-camera image or open the camera and capture a photo. The captured frame becomes the selected image preview. Enter the actual GPS/location text, then click **Analyze**. The dashboard shows elapsed processing time while the LangGraph agents run and the final duration after the response returns. Agent outputs and the final report come from LangGraph agent nodes that call Cerebras. If `CEREBRAS_API_KEY` is missing or Cerebras fails, the app returns a real error.

## Endpoint

`POST /api/analyze`

Multipart form fields:

- `image`: PNG or JPEG, max 7 MB
- `location`: GPS coordinates or location text

Returns:

- `camera_agent`
- `animal_detection_agent`
- `gps_agent`
- `weather_agent`
- `poaching_risk_agent`
- `alert_agent`
- `final_report`
