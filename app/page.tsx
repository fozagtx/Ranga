'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalyzeResponse } from '../lib/agents';

type AgentStatus = 'idle' | 'loading' | 'complete' | 'error';
type AgentKey = keyof AnalyzeResponse;

const agents: Array<[AgentKey, string]> = [
  ['camera_agent', 'Camera Agent'],
  ['animal_detection_agent', 'Animal Detection Agent'],
  ['gps_agent', 'GPS Agent'],
  ['weather_agent', 'Weather Agent'],
  ['poaching_risk_agent', 'Poaching Risk Agent'],
  ['alert_agent', 'Alert Agent'],
  ['final_report', 'Orchestrator Agent'],
];

function statusLabel(status: AgentStatus) {
  if (status === 'loading') return 'Analyzing';
  if (status === 'complete') return 'Complete';
  if (status === 'error') return 'Error';
  return 'Idle';
}

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) return '-';
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function summarizeAgentOutput(key: AgentKey, output?: AnalyzeResponse[AgentKey]) {
  if (!output) return 'Waiting for analysis.';

  switch (key) {
    case 'camera_agent': {
      const result = output as AnalyzeResponse['camera_agent'];
      return `${result.image_quality} image, ${result.lighting}, ${result.usable ? 'usable' : 'not usable'}`;
    }
    case 'animal_detection_agent': {
      const result = output as AnalyzeResponse['animal_detection_agent'];
      const presence = [
        result.human_presence ? 'human visible' : '',
        result.vehicle_presence ? 'vehicle visible' : '',
      ]
        .filter(Boolean)
        .join(', ');
      return `${result.count} ${result.species}, ${result.behavior}${presence ? `, ${presence}` : ''}`;
    }
    case 'gps_agent': {
      const result = output as AnalyzeResponse['gps_agent'];
      return `${result.location_label}, ${result.zone_type} zone, ${result.boundary_risk} boundary risk`;
    }
    case 'weather_agent': {
      const result = output as AnalyzeResponse['weather_agent'];
      return `${result.condition}, ${result.visibility} visibility, ${result.risk_modifier} modifier`;
    }
    case 'poaching_risk_agent': {
      const result = output as AnalyzeResponse['poaching_risk_agent'];
      return `${result.risk_level} risk, ${Math.round(result.risk_score)}/100`;
    }
    case 'alert_agent': {
      const result = output as AnalyzeResponse['alert_agent'];
      return `${result.priority}, ${result.action}`;
    }
    case 'final_report': {
      const result = output as AnalyzeResponse['final_report'];
      return `${result.priority}, ${result.risk_level} risk, ${Math.round(result.risk_score)}/100`;
    }
  }
}

function AgentCard({
  agentKey,
  label,
  output,
  status,
  expanded,
  onToggle,
}: {
  agentKey: AgentKey;
  label: string;
  output?: AnalyzeResponse[AgentKey];
  status: AgentStatus;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cardStatus = output ? 'complete' : status;
  const isActive = status === 'loading' && !output;
  const isExpanded = Boolean(output && expanded);
  const summary = isActive ? 'Running.' : summarizeAgentOutput(agentKey, output);

  return (
    <article className={`agent-card ${isExpanded ? 'is-expanded' : ''} ${isActive ? 'is-active' : ''}`}>
      <div className="agent-card-head">
        <div className="agent-card-main">
          <div className="agent-name">{label}</div>
          <div className="agent-summary">{summary}</div>
        </div>
        <div className="agent-card-actions">
          {output ? (
            <button
              className="agent-detail-button"
              type="button"
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? 'Hide' : 'Details'}
            </button>
          ) : null}
          <div className={`status-pill status-${cardStatus}`}>{statusLabel(cardStatus)}</div>
        </div>
      </div>
      {isExpanded ? <pre className="agent-output">{JSON.stringify(output, null, 2)}</pre> : null}
    </article>
  );
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [location, setLocation] = useState('');
  const [payload, setPayload] = useState<AnalyzeResponse | null>(null);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<AgentKey | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState('');
  const [imageSourceLabel, setImageSourceLabel] = useState('');
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [completedDurationMs, setCompletedDurationMs] = useState<number | null>(null);

  const report = payload?.final_report;
  const completedAgents = useMemo(() => {
    if (!payload) return 0;
    return agents.filter(([key]) => payload[key]).length;
  }, [payload]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (status !== 'loading' || analysisStartedAt === null) return;

    const updateElapsed = () => setElapsedMs(performance.now() - analysisStartedAt);
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 250);

    return () => window.clearInterval(timer);
  }, [analysisStartedAt, status]);

  function clearReport() {
    setPayload(null);
    setExpandedAgent(null);
    setAnalysisTimestamp('');
    setAnalysisStartedAt(null);
    setElapsedMs(null);
    setCompletedDurationMs(null);
  }

  function useFile(file?: File, sourceLabel = 'Uploaded image') {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageSourceLabel(sourceLabel);
    clearReport();
    setError('');
  }

  function setLocationText(value: string) {
    setLocation(value);
    clearReport();
  }

  function markLocationUnknown() {
    setError('');
    setLocationText('Location unavailable. Operator does not know exact GPS coordinates.');
  }

  function useDeviceLocation() {
    setError('');

    if (!navigator.geolocation) {
      setError('Device location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocationText(
          `Current device location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}. Accuracy approximately ${Math.round(
            accuracy,
          )} meters.`,
        );
      },
      (locationError) => {
        setError(locationError.message || 'Could not get device location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }

  async function startCamera() {
    setCameraError('');
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (cameraAccessError) {
      setCameraActive(false);
      setCameraError(
        cameraAccessError instanceof Error ? cameraAccessError.message : 'Camera permission was denied.',
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function captureCameraFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraActive || video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Start the camera before capturing a frame.');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not capture a camera frame.');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((frameBlob) => {
        if (frameBlob) {
          resolve(frameBlob);
        } else {
          reject(new Error('Could not encode the camera frame.'));
        }
      }, 'image/jpeg', 0.92);
    });

    const file = new File([blob], `camera-frame-${Date.now()}.jpg`, { type: 'image/jpeg' });
    useFile(file, 'Captured frame');
    stopCamera();
    return file;
  }

  async function analyzeCase(imageOverride?: File) {
    setError('');

    const imageForAnalysis = imageOverride || selectedFile;

    if (!imageForAnalysis) {
      setError('Upload a PNG or JPEG trail-camera image.');
      return;
    }

    if (!location.trim()) {
      setError('Enter GPS coordinates or a location description.');
      return;
    }

    const startedAt = performance.now();
    setPayload(null);
    setExpandedAgent(null);
    setAnalysisTimestamp('');
    setAnalysisStartedAt(startedAt);
    setElapsedMs(0);
    setCompletedDurationMs(null);
    setStatus('loading');

    const formData = new FormData();
    formData.append('image', imageForAnalysis);
    formData.append('location', location.trim());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `Analysis failed with status ${response.status}.`);
      }

      const duration = performance.now() - startedAt;
      setPayload(result);
      setAnalysisTimestamp(new Date().toLocaleString());
      setElapsedMs(duration);
      setCompletedDurationMs(duration);
      setAnalysisStartedAt(null);
      setStatus('complete');
    } catch (analysisError) {
      const duration = performance.now() - startedAt;
      setElapsedMs(duration);
      setCompletedDurationMs(duration);
      setAnalysisStartedAt(null);
      setStatus('error');
      setExpandedAgent(null);
      setError(analysisError instanceof Error ? analysisError.message : 'Analysis failed.');
    }
  }

  const riskLevel = report ? String(report.risk_level).toLowerCase() : 'awaiting';
  const score = report ? `${report.risk_score}/100` : '-';
  const timerVisible = status === 'loading' || completedDurationMs !== null;
  const timerLabel = status === 'loading' ? 'Running' : status === 'error' ? 'Stopped after' : 'Finished in';
  const timerValue = status === 'loading' ? elapsedMs : completedDurationMs;

  return (
    <main className="shell">
      <section className="topbar" aria-label="Case header">
        <div className="brand-lockup">
          <img className="brand-mark" src="/icons/logo.svg" alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">RANGA</p>
            <h1>Poaching Watch Live</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="model-chip">Gemma 4 via Cerebras</div>
        </div>
      </section>

      <section className="dashboard" aria-label="Incident analysis dashboard">
        <aside className="panel input-panel" aria-label="Case input">
          <div className={`image-frame ${previewUrl || cameraActive ? 'has-image' : ''}`}>
            <video
              ref={videoRef}
              className={cameraActive ? 'camera-video is-visible' : 'camera-video'}
              muted
              playsInline
              autoPlay
            />
            {previewUrl && !cameraActive ? (
              <img src={previewUrl} alt="Uploaded trail camera preview" />
            ) : null}
            {!previewUrl && !cameraActive ? (
              <div className="image-empty">No image selected</div>
            ) : null}
            {cameraActive ? <div className="image-state-tag">Live camera</div> : null}
            {previewUrl && !cameraActive ? (
              <div className="image-state-tag">
                {imageSourceLabel === 'Captured frame' ? 'Captured frame selected' : 'Image selected'}
              </div>
            ) : null}
          </div>
          <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />

          <div className={cameraActive ? 'camera-strip is-live' : 'camera-strip'} aria-label="Camera controls">
            {cameraActive ? (
              <>
                <button
                  className="primary-button camera-action"
                  type="button"
                  disabled={status === 'loading'}
                  onClick={() =>
                    captureCameraFrame().catch((frameError) =>
                      setError(frameError instanceof Error ? frameError.message : 'Could not capture a camera frame.'),
                    )
                  }
                >
                  Capture photo
                </button>
                <button
                  className="glass-button"
                  type="button"
                  disabled={status === 'loading'}
                  onClick={stopCamera}
                >
                  Close camera
                </button>
              </>
            ) : (
              <button className="glass-button" type="button" disabled={status === 'loading'} onClick={startCamera}>
                Open camera
              </button>
            )}
          </div>
          {previewUrl && !cameraActive ? (
            <p className="image-selection-note">
              {imageSourceLabel === 'Captured frame'
                ? 'Captured frame is selected for analysis.'
                : 'Uploaded image is selected for analysis.'}
            </p>
          ) : null}
          {cameraError ? <p className="camera-error">{cameraError}</p> : null}

          <label className="field-label" htmlFor="imageInput">
            Trail-camera image
          </label>
          <input
            id="imageInput"
            className="file-input"
            type="file"
            accept="image/png,image/jpeg"
            disabled={status === 'loading'}
            onChange={(event) => useFile(event.target.files?.[0])}
          />

          <label className="field-label" htmlFor="locationInput">
            GPS or location
          </label>
          <div className="location-tools" aria-label="Location helpers">
            <button
              className="glass-button"
              type="button"
              disabled={status === 'loading'}
              onClick={useDeviceLocation}
            >
              Use device location
            </button>
            <button
              className="glass-button"
              type="button"
              disabled={status === 'loading'}
              onClick={markLocationUnknown}
            >
              Location unknown
            </button>
          </div>
          <textarea
            id="locationInput"
            rows={4}
            placeholder="GPS, patrol sector, landmark, reserve gate, or note that location is unknown"
            value={location}
            disabled={status === 'loading'}
            onChange={(event) => setLocationText(event.target.value)}
          />

          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              disabled={status === 'loading'}
              onClick={() => analyzeCase()}
            >
              {status === 'loading' ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          <p className="error-message" role="alert">
            {error}
          </p>
        </aside>

        <section className="panel report-panel" aria-label="Final incident report">
          <div className="report-head">
            <div>
              <p className="section-kicker">Incident Summary</p>
              <h2>{report ? `${report.priority} ${report.risk_level} risk incident` : 'Awaiting case analysis'}</h2>
              {analysisTimestamp ? (
                <p className="analysis-meta">
                  API result from {imageSourceLabel || 'selected image'} at {analysisTimestamp}
                </p>
              ) : null}
            </div>
            <div className="report-status-stack">
              <div className={`risk-badge risk-${riskLevel.replaceAll(' ', '-')}`}>{riskLevel}</div>
              {timerVisible ? (
                <div className="processing-meter" aria-live="polite">
                  <span>{timerLabel}</span>
                  <strong>{formatDuration(timerValue)}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <dl className="report-grid">
            <div>
              <dt>Species</dt>
              <dd>{report?.species || '-'}</dd>
            </div>
            <div>
              <dt>Count</dt>
              <dd>{report?.count ?? '-'}</dd>
            </div>
            <div>
              <dt>Risk Score</dt>
              <dd>{score}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{report?.priority || '-'}</dd>
            </div>
          </dl>

          <div className="recommendation-block">
            <p className="section-kicker">Final Recommendation</p>
            <p>{report?.recommendation || 'Run an analysis to produce a ranger recommendation.'}</p>
          </div>

          <div>
            <p className="section-kicker">Evidence</p>
            <ul className="evidence-list">
              {(report?.evidence?.length ? report.evidence : ['No evidence collected yet.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="panel agents-panel" aria-label="Specialist agents">
          <div className="agents-head">
            <p className="section-kicker">Agent Outputs</p>
            <span>{status === 'loading' ? 'Running' : completedAgents ? `${completedAgents}/7 complete` : 'Idle'}</span>
          </div>
          <div className="agent-list">
            {agents.map(([key, label]) => (
              <AgentCard
                key={key}
                agentKey={key}
                label={label}
                output={payload?.[key]}
                status={status}
                expanded={expandedAgent === key}
                onToggle={() => setExpandedAgent((current) => (current === key ? null : key))}
              />
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
