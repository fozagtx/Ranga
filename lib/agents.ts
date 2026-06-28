import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { z } from 'zod';

export const MODEL_ID = 'gemma-4-31b';
const maxImageBytes = 7 * 1024 * 1024;

const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
const prioritySchema = z.enum(['P3', 'P2', 'P1', 'P0']);

const cameraAgentSchema = z.object({
  image_quality: z.enum(['good', 'poor']),
  lighting: z.enum(['day', 'night', 'low_light']),
  usable: z.boolean(),
  notes: z.string(),
});

const animalDetectionAgentSchema = z.object({
  species: z.string(),
  count: z.number(),
  human_presence: z.boolean(),
  vehicle_presence: z.boolean(),
  behavior: z.enum(['walking', 'feeding', 'running', 'unknown']),
  confidence: z.number().min(0).max(1),
});

const gpsAgentSchema = z.object({
  location_label: z.string(),
  zone_type: z.enum(['core', 'boundary', 'unknown']),
  boundary_risk: z.enum(['low', 'medium', 'high']),
  notes: z.string(),
});

const weatherAgentSchema = z.object({
  condition: z.enum(['clear', 'rain', 'fog', 'storm', 'unknown']),
  visibility: z.enum(['good', 'medium', 'poor']),
  risk_modifier: z.enum(['low', 'medium', 'high']),
  notes: z.string(),
});

const poachingRiskAgentSchema = z.object({
  risk_level: riskLevelSchema,
  risk_score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
});

const alertAgentSchema = z.object({
  priority: prioritySchema,
  action: z.enum(['monitor', 'review', 'dispatch patrol', 'emergency dispatch']),
  message: z.string(),
});

const finalIncidentReportSchema = z.object({
  species: z.string(),
  count: z.number(),
  risk_level: riskLevelSchema,
  risk_score: z.number().min(0).max(100),
  priority: prioritySchema,
  recommendation: z.string(),
  evidence: z.array(z.string()),
});

export type CameraAgentResult = z.infer<typeof cameraAgentSchema>;
export type AnimalDetectionAgentResult = z.infer<typeof animalDetectionAgentSchema>;
export type GpsAgentResult = z.infer<typeof gpsAgentSchema>;
export type WeatherAgentResult = z.infer<typeof weatherAgentSchema>;
export type PoachingRiskAgentResult = z.infer<typeof poachingRiskAgentSchema>;
export type AlertAgentResult = z.infer<typeof alertAgentSchema>;
export type FinalIncidentReport = z.infer<typeof finalIncidentReportSchema>;

export type AnalyzeResponse = {
  camera_agent: CameraAgentResult;
  animal_detection_agent: AnimalDetectionAgentResult;
  gps_agent: GpsAgentResult;
  weather_agent: WeatherAgentResult;
  poaching_risk_agent: PoachingRiskAgentResult;
  alert_agent: AlertAgentResult;
  final_report: FinalIncidentReport;
};

type AgentKey =
  | 'camera_agent'
  | 'animal_detection_agent'
  | 'gps_agent'
  | 'weather_agent'
  | 'poaching_risk_agent'
  | 'alert_agent'
  | 'orchestrator_agent';

type AgentDefinition = {
  schemaName: string;
  schema: z.ZodType;
  systemPrompt: string;
};

class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

let cerebrasClient: Cerebras | undefined;

function getCerebrasClient() {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new HttpError('CEREBRAS_API_KEY is required to run real Gemma 4 analysis.', 503);
  }

  if (!cerebrasClient) {
    cerebrasClient = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
      maxRetries: 1,
      timeout: 90000,
    });
  }

  return cerebrasClient;
}

const agentDefinitions = {
  camera_agent: {
    schemaName: 'CameraAgentResult',
    schema: cameraAgentSchema,
    systemPrompt:
      'You are the Camera Agent for a wildlife ranger command center. Assess only image usability, image quality, lighting, and a short reason. Return conservative values when uncertain.',
  },
  animal_detection_agent: {
    schemaName: 'AnimalDetectionAgentResult',
    schema: animalDetectionAgentSchema,
    systemPrompt:
      'You are the Animal Detection Agent for a wildlife ranger command center. Identify visible wildlife species, animal count, behavior, and whether humans or vehicles are visible. Use unknown when uncertain and keep confidence between 0 and 1.',
  },
  gps_agent: {
    schemaName: 'GpsAgentResult',
    schema: gpsAgentSchema,
    systemPrompt:
      'You are the GPS Agent for a wildlife ranger command center. Analyze only the provided GPS/location text plus visible reserve-boundary clues. The location may be exact GPS, approximate text, a browser device location, or explicitly unknown. Classify core, boundary, or unknown and state boundary risk. Do not invent coordinates or protected-area facts.',
  },
  weather_agent: {
    schemaName: 'WeatherAgentResult',
    schema: weatherAgentSchema,
    systemPrompt:
      'You are the Weather Agent for a wildlife ranger command center. Infer visible weather and visibility risk from the image and location text. Do not claim live or current weather service data. Use unknown when the image does not support a conclusion.',
  },
  poaching_risk_agent: {
    schemaName: 'PoachingRiskAgentResult',
    schema: poachingRiskAgentSchema,
    systemPrompt:
      'You are the Poaching Risk Agent for a wildlife ranger command center. Combine specialist evidence into a poaching-risk score from 0 to 100. Be conservative: ordinary human presence alone, food/cooking activity, staff/tourist/researcher-like scenes, or unknown location must not become high risk without suspicious poaching indicators. High or critical risk requires clear evidence such as protected wildlife plus night/boundary context, vehicle intrusion, weapons/tools/traps, carcass/blood, evasive behavior, poor visibility with restricted-zone cues, or multiple corroborating red flags. Return concise reasons grounded only in the specialist JSON.',
  },
  alert_agent: {
    schemaName: 'AlertAgentResult',
    schema: alertAgentSchema,
    systemPrompt:
      'You are the Alert Agent for a wildlife ranger command center. Convert calibrated risk evidence into ranger action. Use P3 monitor for low, P2 review for medium, P1 dispatch patrol for high, and P0 emergency dispatch for critical. Do not escalate ordinary human presence without corroborating poaching indicators.',
  },
  orchestrator_agent: {
    schemaName: 'FinalIncidentReport',
    schema: finalIncidentReportSchema,
    systemPrompt:
      'You are the Orchestrator Agent for a wildlife ranger command center. Coordinate only: produce the final incident report strictly from specialist JSON outputs. Preserve the calibrated Poaching Risk Agent risk level and score unless the specialist JSON directly contradicts it. Do not add evidence that is not supported by the agents.',
  },
} satisfies Record<AgentKey, AgentDefinition>;

const RangerGraphState = Annotation.Root({
  location: Annotation<string>(),
  imageDataUri: Annotation<string>(),
  camera_agent: Annotation<CameraAgentResult | undefined>(),
  animal_detection_agent: Annotation<AnimalDetectionAgentResult | undefined>(),
  gps_agent: Annotation<GpsAgentResult | undefined>(),
  weather_agent: Annotation<WeatherAgentResult | undefined>(),
  poaching_risk_agent: Annotation<PoachingRiskAgentResult | undefined>(),
  alert_agent: Annotation<AlertAgentResult | undefined>(),
  final_report: Annotation<FinalIncidentReport | undefined>(),
});

type RangerState = typeof RangerGraphState.State;

function makeCaseText(state: RangerState, extraContext: Record<string, unknown> = {}) {
  const contextText = Object.keys(extraContext).length
    ? `\n\nSpecialist evidence:\n${JSON.stringify(extraContext, null, 2)}`
    : '';

  return [
    'Case data for one trail-camera incident.',
    `Location or GPS text: ${state.location}`,
    'Analyze the supplied image and location for this exact case.',
    'Return only structured data matching your assigned schema.',
    'If evidence is uncertain, use unknown, false, or a lower confidence instead of guessing.',
    contextText,
  ].join('\n');
}

async function invokeGemmaAgent<Schema extends z.ZodType<Record<string, unknown>>>(
  agentKey: AgentKey,
  schema: Schema,
  state: RangerState,
  extraContext: Record<string, unknown> = {},
): Promise<z.infer<Schema>> {
  const definition = agentDefinitions[agentKey];
  const completion = (await getCerebrasClient().chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: 'system', content: definition.systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: makeCaseText(state, extraContext) },
          { type: 'image_url', image_url: { url: state.imageDataUri } },
        ],
      },
    ],
    temperature: 0.1,
    max_completion_tokens: 700,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: definition.schemaName,
        strict: true,
        schema: z.toJSONSchema(schema),
      },
    },
  })) as { choices?: Array<{ message?: { content?: unknown } }> };

  const content = completion.choices?.[0]?.message?.content;
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;
  return schema.parse(parsed) as z.infer<Schema>;
}

function riskLevelFromScore(score: number): z.infer<typeof riskLevelSchema> {
  if (score >= 86) return 'critical';
  if (score >= 68) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function clampRiskScore<T extends { risk_score: number; risk_level?: z.infer<typeof riskLevelSchema> }>(result: T): T {
  const risk_score = Math.max(0, Math.min(100, Math.round(result.risk_score)));

  return {
    ...result,
    risk_score,
    ...(result.risk_level ? { risk_level: riskLevelFromScore(risk_score) } : {}),
  } as T;
}

const protectedWildlifeTerms = [
  'elephant',
  'rhino',
  'rhinoceros',
  'lion',
  'leopard',
  'cheetah',
  'pangolin',
  'gorilla',
  'chimpanzee',
  'tiger',
  'bear',
  'antelope',
  'giraffe',
  'buffalo',
  'zebra',
];

function containsAnyTerm(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function addCalibrationReason(reasons: string[], reason: string) {
  if (reasons.some((item) => item.toLowerCase() === reason.toLowerCase())) return reasons;
  return [...reasons, reason].slice(0, 4);
}

function calibratePoachingRisk(
  result: PoachingRiskAgentResult,
  evidence: {
    camera_agent: CameraAgentResult;
    animal_detection_agent: AnimalDetectionAgentResult;
    gps_agent: GpsAgentResult;
    weather_agent: WeatherAgentResult;
  },
): PoachingRiskAgentResult {
  const clamped = clampRiskScore(result);
  const { camera_agent, animal_detection_agent, gps_agent, weather_agent } = evidence;
  const species = animal_detection_agent.species.toLowerCase();
  const notes = [camera_agent.notes, gps_agent.notes, weather_agent.notes, ...clamped.reasons]
    .join(' ')
    .toLowerCase();

  const protectedWildlife = containsAnyTerm(species, protectedWildlifeTerms);
  const vehicle = animal_detection_agent.vehicle_presence;
  const human = animal_detection_agent.human_presence;
  const nightOrLowLight = camera_agent.lighting === 'night' || camera_agent.lighting === 'low_light';
  const boundaryContext = gps_agent.zone_type === 'boundary' || gps_agent.boundary_risk === 'high';
  const poorVisibility =
    weather_agent.visibility === 'poor' ||
    weather_agent.risk_modifier === 'high' ||
    weather_agent.condition === 'fog' ||
    weather_agent.condition === 'storm';
  const explicitThreatCue = containsAnyTerm(notes, [
    'weapon',
    'rifle',
    'gun',
    'snare',
    'trap',
    'carcass',
    'blood',
    'ivory',
    'horn',
    'evasion',
    'trespass',
    'poacher',
  ]);

  const severeIndicators = [
    protectedWildlife,
    vehicle,
    nightOrLowLight && boundaryContext,
    poorVisibility && boundaryContext,
    explicitThreatCue,
  ].filter(Boolean).length;
  let scoreCap: number | null = null;
  let reason = '';

  if (human && !vehicle && !protectedWildlife && !boundaryContext && !nightOrLowLight && !poorVisibility && !explicitThreatCue) {
    scoreCap = 30;
    reason = 'Human presence alone is not enough for high poaching risk.';
  } else if (human && !vehicle && !protectedWildlife && severeIndicators < 2 && !explicitThreatCue) {
    scoreCap = 55;
    reason = 'Human presence needs corroborating poaching indicators before dispatch severity.';
  } else if (!protectedWildlife && !vehicle && severeIndicators === 0 && !explicitThreatCue) {
    scoreCap = 40;
    reason = 'No protected wildlife or suspicious poaching cue was confirmed.';
  }

  if (scoreCap === null || clamped.risk_score <= scoreCap) return clamped;

  return {
    ...clamped,
    risk_score: scoreCap,
    risk_level: riskLevelFromScore(scoreCap),
    reasons: addCalibrationReason(clamped.reasons, reason),
  };
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`${label} missing from LangGraph state.`);
  }

  return value;
}

const cameraAgentNode = async (state: RangerState) => ({
  camera_agent: await invokeGemmaAgent('camera_agent', cameraAgentSchema, state),
});

const animalDetectionAgentNode = async (state: RangerState) => ({
  animal_detection_agent: await invokeGemmaAgent(
    'animal_detection_agent',
    animalDetectionAgentSchema,
    state,
  ),
});

const gpsAgentNode = async (state: RangerState) => ({
  gps_agent: await invokeGemmaAgent('gps_agent', gpsAgentSchema, state),
});

const weatherAgentNode = async (state: RangerState) => ({
  weather_agent: await invokeGemmaAgent('weather_agent', weatherAgentSchema, state),
});

const poachingRiskAgentNode = async (state: RangerState) => {
  const evidence = {
    camera_agent: required(state.camera_agent, 'Camera Agent'),
    animal_detection_agent: required(state.animal_detection_agent, 'Animal Detection Agent'),
    gps_agent: required(state.gps_agent, 'GPS Agent'),
    weather_agent: required(state.weather_agent, 'Weather Agent'),
  };

  const result = await invokeGemmaAgent('poaching_risk_agent', poachingRiskAgentSchema, state, evidence);
  return { poaching_risk_agent: calibratePoachingRisk(result, evidence) };
};

const alertAgentNode = async (state: RangerState) => {
  const evidence = {
    camera_agent: required(state.camera_agent, 'Camera Agent'),
    animal_detection_agent: required(state.animal_detection_agent, 'Animal Detection Agent'),
    gps_agent: required(state.gps_agent, 'GPS Agent'),
    weather_agent: required(state.weather_agent, 'Weather Agent'),
    poaching_risk_agent: required(state.poaching_risk_agent, 'Poaching Risk Agent'),
  };

  return {
    alert_agent: await invokeGemmaAgent('alert_agent', alertAgentSchema, state, evidence),
  };
};

const orchestratorAgentNode = async (state: RangerState) => {
  const evidence = {
    camera_agent: required(state.camera_agent, 'Camera Agent'),
    animal_detection_agent: required(state.animal_detection_agent, 'Animal Detection Agent'),
    gps_agent: required(state.gps_agent, 'GPS Agent'),
    weather_agent: required(state.weather_agent, 'Weather Agent'),
    poaching_risk_agent: required(state.poaching_risk_agent, 'Poaching Risk Agent'),
    alert_agent: required(state.alert_agent, 'Alert Agent'),
  };

  const report = await invokeGemmaAgent(
    'orchestrator_agent',
    finalIncidentReportSchema,
    state,
    evidence,
  );

  return { final_report: clampRiskScore(report) };
};

function createRangerAgentGraph() {
  return new StateGraph(RangerGraphState)
    .addNode('camera_node', cameraAgentNode)
    .addNode('animal_detection_node', animalDetectionAgentNode)
    .addNode('gps_node', gpsAgentNode)
    .addNode('weather_node', weatherAgentNode)
    .addNode('poaching_risk_node', poachingRiskAgentNode)
    .addNode('alert_node', alertAgentNode)
    .addNode('orchestrator_node', orchestratorAgentNode)
    .addEdge(START, 'camera_node')
    .addEdge(START, 'animal_detection_node')
    .addEdge(START, 'gps_node')
    .addEdge(START, 'weather_node')
    .addEdge('camera_node', 'poaching_risk_node')
    .addEdge('animal_detection_node', 'poaching_risk_node')
    .addEdge('gps_node', 'poaching_risk_node')
    .addEdge('weather_node', 'poaching_risk_node')
    .addEdge('poaching_risk_node', 'alert_node')
    .addEdge('alert_node', 'orchestrator_node')
    .addEdge('orchestrator_node', END)
    .compile();
}

export function validateAnalyzeInput({
  imageBuffer,
  mimeType,
  location,
}: {
  imageBuffer: Buffer;
  mimeType: string;
  location: string;
}) {
  if (!imageBuffer || imageBuffer.length === 0) {
    return 'Upload a PNG or JPEG trail-camera image.';
  }

  if (!['image/png', 'image/jpeg'].includes(mimeType)) {
    return 'Only PNG and JPEG images are supported.';
  }

  if (imageBuffer.length > maxImageBytes) {
    return 'Image must be 7 MB or smaller.';
  }

  if (!location.trim()) {
    return 'Enter GPS coordinates or a location description.';
  }

  return '';
}

export async function analyzeCase({
  imageBuffer,
  mimeType,
  location,
}: {
  imageBuffer: Buffer;
  mimeType: string;
  location: string;
}): Promise<AnalyzeResponse> {
  const validationError = validateAnalyzeInput({ imageBuffer, mimeType, location });
  if (validationError) {
    throw new HttpError(validationError, validationError.includes('7 MB') ? 413 : 400);
  }
  getCerebrasClient();

  const imageDataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  const graph = createRangerAgentGraph();
  const result = await graph.invoke({
    location,
    imageDataUri,
  });

  return {
    camera_agent: required(result.camera_agent, 'Camera Agent'),
    animal_detection_agent: required(result.animal_detection_agent, 'Animal Detection Agent'),
    gps_agent: required(result.gps_agent, 'GPS Agent'),
    weather_agent: required(result.weather_agent, 'Weather Agent'),
    poaching_risk_agent: required(result.poaching_risk_agent, 'Poaching Risk Agent'),
    alert_agent: required(result.alert_agent, 'Alert Agent'),
    final_report: required(result.final_report, 'Orchestrator Agent'),
  };
}
