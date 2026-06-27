import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Load types for local handling
import { Case, CaseStatus, SeverityLevel, PriorityLevel, ScenarioMode } from './src/types.js';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_FILE = path.join(process.cwd(), 'cases_db.json');

// LINE Config from env
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';

// ─── Gemini AI Client Initialization ─────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = GEMINI_API_KEY && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

interface AIClassification {
  disease: string;
  severity: SeverityLevel;
  priority: PriorityLevel;
  scenario: ScenarioMode;
  analysis: string;
}

async function classifyCaseWithAI(
  symptoms: string[],
  contactHistory: string,
  age: number
): Promise<AIClassification | null> {
  if (!ai) {
    console.warn('[Gemini AI] GEMINI_API_KEY not set. Using rule-based fallback.');
    return null;
  }

  try {
    const prompt = `You are an AI Epidemiologist assistant for Yala City Municipality, Thailand.
Analyze the following patient clinical symptoms and contact history:
- Age: ${age} years old
- Symptoms: ${symptoms.join(', ')}
- Contact History: ${contactHistory}

Determine the following:
1. Disease classification: Choose from 'Dengue Fever' (ไข้เลือดออก), 'Leptospirosis' (ฉี่หนู), 'COVID-19' (โควิด-19), 'Influenza' (ไข้หวัดใหญ่), 'Diarrhea' (อุจจาระร่วง), 'Skin Infection' (ติดเชื้อผิวหนัง), 'Cholera' (อหิวาตกโรค), 'Hand, Foot, and Mouth Disease' (มือเท้าปาก), or 'Unknown'.
2. Severity Level: 'high' (for Dengue, Leptospirosis, Cholera), 'medium' (for COVID-19, Diarrhea), or 'low' (for Influenza, Skin Infection, Hand-Foot-Mouth, or mild cases).
3. Priority Level: 'critical' (high severity, needs immediate intervention), 'moderate' (medium severity, needs monitoring), or 'low' (low severity, outpatient care).
4. Scenario Mode: 'Flood' (if symptoms/contact match Leptospirosis, Diarrhea, Skin Infection, Cholera during wading in floodwater or post-flood contamination) or 'Normal' (all other typical seasonal outbreaks).
5. Analysis: A brief 1-2 sentence medical explanation in Thai explaining why you classified this disease and severity.

Return the result as a JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            disease: { type: 'STRING' },
            severity: { 
              type: 'STRING', 
              enum: ['high', 'medium', 'low'] 
            },
            priority: { 
              type: 'STRING', 
              enum: ['critical', 'moderate', 'low'] 
            },
            scenario: { 
              type: 'STRING', 
              enum: ['Normal', 'Flood'] 
            },
            analysis: { type: 'STRING' }
          },
          required: ['disease', 'severity', 'priority', 'scenario', 'analysis']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as AIClassification;
      console.log('[Gemini AI] Case classified successfully:', parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[Gemini AI] Error during case classification:', err);
  }
  return null;
}


async function getAIConsultation(userQuery: string): Promise<string> {
  if (!ai) {
    return 'พิมพ์ "รายงาน" เพื่อเริ่มแจ้งอาการป่วยแก่เจ้าหน้าที่สาธารณสุขยะลาครับ 🏥';
  }

  try {
    const prompt = `You are the "หมอเสมือนจริง เทศบาลนครยะลา" (Yala Municipality Virtual Doctor).
A citizen of Yala is asking a question or talking to you:
"${userQuery}"

Provide a friendly, helpful response in Thai (with appropriate emojis) giving public health advice or guidance.
- Answer their question concisely based on standard medical guidelines for tropical/seasonal diseases (like Dengue, Leptospirosis, Diarrhea, Influenza, COVID-19).
- If they describe symptoms of being sick, recommend that they type the command "รายงาน" (or "report") to officially submit their case to the Yala Public Health department so officers can follow up.
- Maintain a warm, reassuring, and professional tone. Keep it concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (response.text) {
      return response.text.trim();
    }
  } catch (err) {
    console.error('[Gemini AI] Error during AI consultation:', err);
  }
  return 'ขออภัยครับ ระบบวิเคราะห์คำแนะนำของหมอชั่วคราวติดขัด สามารถพิมพ์ "รายงาน" เพื่อแจ้งประวัติอาการป่วยโดยตรงได้ครับ 🏥';
}


// ─── LINE Session State Machine ───────────────────────────────────────────
type LineStep =
  | 'IDLE'
  | 'ASK_NAME'
  | 'ASK_PHONE'
  | 'ASK_AGE'
  | 'ASK_GENDER'
  | 'ASK_DISEASE'
  | 'ASK_SYMPTOMS'
  | 'ASK_DAYS'
  | 'ASK_AREA'
  | 'ASK_CONTACT';

interface LineSession {
  step: LineStep;
  data: {
    name?: string;
    phone?: string;
    age?: number;
    gender?: string;
    disease?: string;
    symptoms?: string[];
    days?: number;
    areaName?: string;
    contactHistory?: string;
  };
}

// In-memory session store (keyed by LINE userId)
const lineSessions = new Map<string, LineSession>();

// ─── LINE API helper ───────────────────────────────────────────────────────
async function lineReply(replyToken: string, messages: object[]) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN not set — skipping reply.');
    return;
  }
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

function lineText(text: string) {
  return { type: 'text', text };
}

function lineQuickReply(text: string, items: string[]) {
  return {
    type: 'text',
    text,
    quickReply: {
      items: items.map(label => ({
        type: 'action',
        action: { type: 'message', label: label.substring(0, 20), text: label },
      })),
    },
  };
}

// ─── Disease classification (shared logic) ────────────────────────────────
function classifyDisease(disease: string): { severity: SeverityLevel; priority: PriorityLevel; scenario: ScenarioMode } {
  const d = disease.toLowerCase();
  let severity: SeverityLevel = 'low';
  let priority: PriorityLevel = 'low';
  let scenario: ScenarioMode = 'Normal';

  if (
    d.includes('leptospirosis') || d.includes('ฉี่หนู') ||
    d.includes('diarrhea') || d.includes('ท้องร่วง') || d.includes('อุจจาระ') ||
    d.includes('skin') || d.includes('ผิวหนัง') || d.includes('น้ำกัดเท้า') ||
    d.includes('cholera') || d.includes('อหิวา')
  ) {
    scenario = 'Flood';
  }

  if (
    d.includes('dengue') || d.includes('ไข้เลือดออก') ||
    d.includes('leptospirosis') || d.includes('ฉี่หนู') ||
    d.includes('cholera') || d.includes('อหิวา')
  ) {
    severity = 'high';
    priority = 'critical';
  } else if (d.includes('covid') || d.includes('โควิด') || d.includes('diarrhea') || d.includes('ท้องร่วง')) {
    severity = 'medium';
    priority = 'moderate';
  }

  return { severity, priority, scenario };
}

// Parse raw body for LINE webhook BEFORE express.json() runs
// This ensures HMAC signature verification gets the correct raw bytes
app.use('/api/line/webhook', express.raw({ type: '*/*' }));

app.use(express.json());

// List of connected SSE clients
let sseClients: any[] = [];

// Seed cases for Yala Municipality
const defaultCases: Case[] = [
  {
    id: 'case_001',
    gps: { lat: 6.5412, lng: 101.2825 },
    personalInfo: {
      name: 'Somchai Jaidee',
      age: 45,
      gender: 'Male',
      phone: '081-234-5678',
      status: 'Quarantined'
    },
    clinicalInfo: {
      symptoms: ['High fever', 'Headache', 'Severe joint pain', 'Skin rash'],
      days: 4,
      contactHistory: 'Visited Sateng park near standing water breeding ground.'
    },
    disease: 'Dengue Fever',
    severity: 'high',
    status: 'Accepted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    areaName: 'Sateng Center',
    priority: 'moderate',
    scenario: 'Normal'
  },
  {
    id: 'case_002',
    gps: { lat: 6.5280, lng: 101.2990 },
    personalInfo: {
      name: 'Aminah Sama',
      age: 28,
      gender: 'Female',
      phone: '089-876-5432',
      status: 'Hospitalized'
    },
    clinicalInfo: {
      symptoms: ['Dry cough', 'Loss of smell', 'Fatigue', 'Fever'],
      days: 3,
      contactHistory: 'Close contact with a traveler returning from Bangkok.'
    },
    disease: 'COVID-19',
    severity: 'medium',
    status: 'Waiting',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    areaName: 'Sateng Nok',
    priority: 'moderate',
    scenario: 'Normal'
  },
  {
    id: 'case_003',
    gps: { lat: 6.5510, lng: 101.2680 },
    personalInfo: {
      name: 'Peera Sawat',
      age: 5,
      gender: 'Male',
      phone: '082-111-2222',
      status: 'Self-Isolating'
    },
    clinicalInfo: {
      symptoms: ['Mouth sores', 'Skin rash on hands & feet', 'Mild fever'],
      days: 2,
      contactHistory: 'Playmate at local kindergarten diagnosed with similar blisters.'
    },
    disease: 'Hand, Foot, and Mouth Disease',
    severity: 'low',
    status: 'New',
    createdAt: new Date().toISOString(),
    areaName: 'Tha Sap',
    priority: 'low',
    scenario: 'Normal'
  },
  {
    id: 'case_004',
    gps: { lat: 6.5450, lng: 101.2840 },
    personalInfo: {
      name: 'Fatimah Lateh',
      age: 62,
      gender: 'Female',
      phone: '085-333-4444',
      status: 'At Home'
    },
    clinicalInfo: {
      symptoms: ['Sore throat', 'Severe muscle aches', 'Chills', 'High fever'],
      days: 7,
      contactHistory: 'Visited crowded fresh market in Sateng Center during flu season.'
    },
    disease: 'Influenza',
    severity: 'low',
    status: 'Completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    areaName: 'Sateng Center',
    priority: 'low',
    scenario: 'Normal'
  },
  {
    id: 'case_005',
    gps: { lat: 6.5250, lng: 101.2920 },
    personalInfo: {
      name: 'Ibrahim Dolah',
      age: 34,
      gender: 'Male',
      phone: '086-444-5555',
      status: 'Quarantined'
    },
    clinicalInfo: {
      symptoms: ['Severe back pain', 'Nausea', 'Fever', 'Eye orbital pain'],
      days: 5,
      contactHistory: 'Lives near construction site with open containers and heavy mosquitoes.'
    },
    disease: 'Dengue Fever',
    severity: 'high',
    status: 'New',
    createdAt: new Date().toISOString(),
    areaName: 'Sateng Nok',
    priority: 'moderate',
    scenario: 'Normal'
  },
  {
    id: 'case_006',
    gps: { lat: 6.5480, lng: 101.2720 },
    personalInfo: {
      name: 'Kanya Raksa',
      age: 12,
      gender: 'Female',
      phone: '087-555-6666',
      status: 'At Home'
    },
    clinicalInfo: {
      symptoms: ['Fever', 'Mild headache'],
      days: 1,
      contactHistory: 'Classmate reported COVID-19 positive.'
    },
    disease: 'COVID-19',
    severity: 'medium',
    status: 'Completed',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    areaName: 'Tha Sap',
    priority: 'low',
    scenario: 'Normal'
  },
  {
    id: 'case_007',
    gps: { lat: 6.5490, lng: 101.2650 },
    personalInfo: {
      name: 'Adisak Noonui',
      age: 38,
      gender: 'Male',
      phone: '081-555-0199',
      status: 'Hospitalized'
    },
    clinicalInfo: {
      symptoms: ['High fever', 'Severe muscle pain in calves', 'Red eyes', 'Jaundice'],
      days: 5,
      contactHistory: 'Walked barefoot in stagnant floodwaters in Tha Sap lowlands near livestock farms.'
    },
    disease: 'Leptospirosis',
    severity: 'high',
    status: 'Accepted',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    areaName: 'Tha Sap',
    priority: 'critical',
    scenario: 'Flood'
  },
  {
    id: 'case_008',
    gps: { lat: 6.5385, lng: 101.2882 },
    personalInfo: {
      name: 'Ruslan Masae',
      age: 12,
      gender: 'Male',
      phone: '084-222-3434',
      status: 'At Home'
    },
    clinicalInfo: {
      symptoms: ['Watery diarrhea', 'Abdominal cramps', 'Nausea', 'Dehydration'],
      days: 2,
      contactHistory: 'Drank untreated water from temporary local wells during water supply disruption.'
    },
    disease: 'Diarrhea',
    severity: 'medium',
    status: 'New',
    createdAt: new Date().toISOString(),
    areaName: 'Sateng Center',
    priority: 'moderate',
    scenario: 'Flood'
  },
  {
    id: 'case_009',
    gps: { lat: 6.5305, lng: 101.2954 },
    personalInfo: {
      name: 'Mariyam Lateh',
      age: 55,
      gender: 'Female',
      phone: '086-777-8899',
      status: 'Self-Isolating'
    },
    clinicalInfo: {
      symptoms: ['Itching', 'Redness and peeling between toes', 'Pus-filled blisters'],
      days: 6,
      contactHistory: 'Prolonged wading in stagnant mud and standing wastewater around her house in Sateng Nok.'
    },
    disease: 'Skin Infection',
    severity: 'low',
    status: 'New',
    createdAt: new Date().toISOString(),
    areaName: 'Sateng Nok',
    priority: 'low',
    scenario: 'Flood'
  },
  {
    id: 'case_010',
    gps: { lat: 6.5445, lng: 101.2612 },
    personalInfo: {
      name: 'Kamilah Waesama',
      age: 42,
      gender: 'Female',
      phone: '089-999-0011',
      status: 'Hospitalized'
    },
    clinicalInfo: {
      symptoms: ['Severe watery diarrhea resembling rice-water', 'Rapid heart rate', 'Severe vomiting', 'Muscle cramps'],
      days: 3,
      contactHistory: 'Consumed raw seafood washed in contaminated flood water near the canal.'
    },
    disease: 'Cholera',
    severity: 'high',
    status: 'Waiting',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    areaName: 'Tha Sap',
    priority: 'critical',
    scenario: 'Flood'
  }
];

// Helper functions for database
function loadCases(): Case[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultCases, null, 2), 'utf-8');
      return defaultCases;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Auto-upgrade database if case items lack new scenario / priority fields
    if (parsed.length > 0 && (!parsed[0].priority || !parsed[0].scenario)) {
      console.log('Upgrading local cases database with priority and scenario fields...');
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultCases, null, 2), 'utf-8');
      return defaultCases;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading cases:', err);
    return defaultCases;
  }
}

function saveCases(cases: Case[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cases, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving cases:', err);
  }
}

// Broadcast updates to all SSE clients
function broadcast(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  sseClients.forEach(client => {
    client.write(`data: ${payload}\n\n`);
  });
}

// Ensure the DB file is initialized on start
loadCases();

// GET /api/ai/outbreak-report - Generates outbreak analysis using Gemini AI
app.get('/api/ai/outbreak-report', async (req, res) => {
  const cases = loadCases();
  
  if (!ai) {
    // Mock report fallback
    const reportText = `### 📊 รายงานวิเคราะห์โรคระบาดนครยะลาโดย AI (จำลอง)

*หมายเหตุ: จำลองรายงานเนื่องจากไม่ได้ตั้งค่า GEMINI_API_KEY*

#### 1. สถานการณ์ปัจจุบัน
จากการวิเคราะห์คลังข้อมูลเคสระบาดวิทยา เทศบาลนครยะลา พบสถิติผู้ป่วยที่บันทึกรวม **${cases.length} ราย**
- **สภาวะปกติ (Normal Scenario):** พบเคส **โรคไข้เลือดออก (Dengue Fever)** เป็นพาหะระบาดหลักในเขต *สะเตง Center* และ *สะเตงนอก*
- **สภาวะอุทกภัย (Flood Scenario):** พบประวัติการรายงานโรคกลุ่มภัยพิบัติน้ำท่วม ได้แก่ **โรคฉี่หนู (Leptospirosis)** และ **โรคอุจจาระร่วงเฉียบพลัน (Diarrhea)** ในเขตพื้นที่ลุ่มน้ำท่วมขัง *ท่าสาป*

#### 2. แนะนำมาตรการควบคุมโรคและจัดการเร่งด่วนสำหรับเทศบาล
- เร่งฉีดพ่นละอองสารเคมีกำจัดแหล่งเพาะพันธุ์ยุงลายในรัศมี 35 เมตรรอบพิกัดระบาดสะเตงกลาง
- จัดแจกเครื่องกรองและสารคลอรีนในระบบประปาตำบลท่าสาปและสะเตงนอก เพื่อป้องกันอุจจาระร่วงปนเปื้อนช่วงอุทกภัย
- ประชาสัมพันธ์ให้ประชาชนสวมใส่รองเท้าบูททุกครั้งเมื่อเดินย่ำน้ำโคลนขัง`;
    return res.json({ report: reportText });
  }

  try {
    // Prepare data summary
    const diseaseCounts: Record<string, number> = {};
    const areaCounts: Record<string, number> = {};
    let highRiskCount = 0;
    
    cases.forEach(c => {
      diseaseCounts[c.disease] = (diseaseCounts[c.disease] || 0) + 1;
      areaCounts[c.areaName] = (areaCounts[c.areaName] || 0) + 1;
      if (c.severity === 'high') highRiskCount++;
    });

    const dataSummary = `
Total Cases: ${cases.length}
High Severity Cases: ${highRiskCount}
Disease distribution: ${JSON.stringify(diseaseCounts)}
Area distribution: ${JSON.stringify(areaCounts)}
Recent cases ledger (anonymized):
${cases.slice(-10).map(c => `- ${c.createdAt.substring(0,10)}: ${c.disease} in ${c.areaName} (Severity: ${c.severity}, Scenario: ${c.scenario})`).join('\n')}
`;

    const prompt = `You are a Senior Epidemiologist and Public Health Advisor for Yala City Municipality, Thailand.
Using the following anonymized municipal outbreak statistics:
${dataSummary}

Write a comprehensive, professional epidemiological outbreak report (รายงานวิเคราะห์และประเมินสถานการณ์ระบาดวิทยา) in Thai.
The report should include:
1. **บทสรุปสำหรับผู้บริหาร (Executive Summary)**: Overview of the current active outbreaks and risk indicators in Yala.
2. **การกระจายเชิงพื้นที่และกลุ่มโรค (Spatial & Disease Distribution)**: Highlight hotspots (Sateng Center, Sateng Nok, Tha Sap) and flood-related vs normal-season diseases.
3. **การวิเคราะห์ระดับความเสี่ยง (Risk Assessment)**: Assessment of high-severity and critical-priority cases.
4. **มาตรการและข้อเสนอแนะควบคุมโรค (Recommended Interventions)**: Specific actionable advice for the Yala municipality public health officers, such as fogging schedules, boot distribution in flood areas, or public communications.

Format the output strictly as clean Markdown. Do not include raw JSON or codeblocks wrapping the markdown. Keep the tone authoritative, helpful, and highly detailed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (response.text) {
      return res.json({ report: response.text });
    }
  } catch (err) {
    console.error('[Gemini AI] Error generating outbreak report:', err);
  }
  
  return res.status(500).json({ error: 'Failed to generate outbreak report' });
});

// Realtime Server-Sent Events Endpoint
app.get('/api/realtime', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Keep connection alive with simple heartbeat ping
  const interval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  sseClients.push(res);

  req.on('close', () => {
    clearInterval(interval);
    sseClients = sseClients.filter(c => c !== res);
  });
});

// Authentication Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'naeef.benyakal@gmail.com' && password === 'NFLANDii403190') {
    return res.json({
      success: true,
      token: 'mock-jwt-token-yala-epidemic-sec',
      user: {
        name: 'Naeef Benyakal',
        email: 'naeef.benyakal@gmail.com',
        role: 'official',
        department: 'Yala Public Health Municipality'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password. Please try again.'
  });
});

// LINE Chatbot Ingestion Point
// POST /api/cases
app.post('/api/cases', async (req, res) => {
  const payload = req.body;

  // Basic validation
  if (!payload.disease) {
    return res.status(400).json({ success: false, error: 'Disease is required' });
  }

  const cases = loadCases();

  // Determine severity, scenario, and priority
  let severity: SeverityLevel = 'low';
  let priority: PriorityLevel = 'low';
  let scenario: ScenarioMode = 'Normal';

  const symptoms = Array.isArray(payload.clinicalInfo?.symptoms)
    ? payload.clinicalInfo.symptoms
    : [payload.clinicalInfo?.symptoms || 'Fever', 'Fatigue'];
  const contactHistory = payload.clinicalInfo?.contactHistory || 'No known contact history reported.';
  const age = payload.personalInfo?.age ? parseInt(payload.personalInfo.age) : 30;

  // Try AI Classification first
  const aiClass = await classifyCaseWithAI(symptoms, contactHistory, age);
  if (aiClass) {
    severity = aiClass.severity;
    priority = aiClass.priority;
    scenario = aiClass.scenario;
    if (aiClass.disease && aiClass.disease !== 'Unknown') {
      payload.disease = aiClass.disease;
    }
  } else {
    // Rule-based fallback classification
    const diseaseNormalized = (payload.disease || '').toLowerCase();

    // Classify Scenario
    if (
      diseaseNormalized.includes('leptospirosis') || diseaseNormalized.includes('ฉี่หนู') ||
      diseaseNormalized.includes('diarrhea') || diseaseNormalized.includes('ท้องร่วง') || diseaseNormalized.includes('อุจจาระ') ||
      diseaseNormalized.includes('skin') || diseaseNormalized.includes('ผิวหนัง') || diseaseNormalized.includes('น้ำกัดเท้า') ||
      diseaseNormalized.includes('cholera') || diseaseNormalized.includes('อหิวา')
    ) {
      scenario = 'Flood';
    }

    // Determine severity & priority
    if (
      diseaseNormalized.includes('dengue') || diseaseNormalized.includes('ไข้เลือดออก') ||
      diseaseNormalized.includes('leptospirosis') || diseaseNormalized.includes('ฉี่หนู') ||
      diseaseNormalized.includes('cholera') || diseaseNormalized.includes('อหิวา')
    ) {
      severity = 'high';
      priority = 'critical';
    } else if (
      diseaseNormalized.includes('covid') || diseaseNormalized.includes('โควิด') ||
      diseaseNormalized.includes('diarrhea') || diseaseNormalized.includes('ท้องร่วง')
    ) {
      severity = 'medium';
      priority = 'moderate';
    }
  }

  // Override if explicitly supplied
  if (payload.severity) severity = payload.severity;
  if (payload.priority) priority = payload.priority;
  if (payload.scenario) scenario = payload.scenario;

  // Generate random coordinates in Yala Municipality bounds if not provided
  // Yala Center: 6.5399, 101.2813
  const defaultLat = 6.5399 + (Math.random() - 0.5) * 0.025;
  const defaultLng = 101.2813 + (Math.random() - 0.5) * 0.025;

  const areaNames = ['Sateng Center', 'Sateng Nok', 'Tha Sap'];
  const randomArea = areaNames[Math.floor(Math.random() * areaNames.length)];

  const newCase: Case = {
    id: `case_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    gps: {
      lat: payload.gps?.lat ? parseFloat(payload.gps.lat) : defaultLat,
      lng: payload.gps?.lng ? parseFloat(payload.gps.lng) : defaultLng
    },
    personalInfo: {
      name: payload.personalInfo?.name || 'Anonymous Patient',
      age: payload.personalInfo?.age ? parseInt(payload.personalInfo.age) : Math.floor(Math.random() * 50) + 10,
      gender: payload.personalInfo?.gender || (Math.random() > 0.5 ? 'Male' : 'Female'),
      phone: payload.personalInfo?.phone || '08X-XXX-XXXX',
      status: payload.personalInfo?.status || 'Quarantined',
      occupation: payload.personalInfo?.occupation || 'Unspecified',
      residencyStatus: payload.personalInfo?.residencyStatus || 'คนในพื้นที่',
      allergies: payload.personalInfo?.allergies || 'ไม่มี',
      demands: payload.personalInfo?.demands || 'ไม่มี'
    },
    clinicalInfo: {
      symptoms: Array.isArray(payload.clinicalInfo?.symptoms)
        ? payload.clinicalInfo.symptoms
        : [payload.clinicalInfo?.symptoms || 'Fever', 'Fatigue'],
      days: payload.clinicalInfo?.days ? parseInt(payload.clinicalInfo.days) : Math.floor(Math.random() * 5) + 1,
      contactHistory: payload.clinicalInfo?.contactHistory || 'No known contact history reported.'
    },
    disease: payload.disease,
    severity: severity,
    status: 'New',
    createdAt: new Date().toISOString(),
    areaName: payload.areaName || randomArea,
    priority: priority,
    scenario: scenario
  };

  cases.push(newCase);
  saveCases(cases);

  // Broadcast the new case realtime
  broadcast('NEW_CASE', newCase);

  return res.status(201).json({
    success: true,
    message: 'Case successfully received and registered',
    data: newCase
  });
});

// GET /api/cases - Retrieves the cases list
app.get('/api/cases', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const isOfficial = authHeader === 'Bearer mock-jwt-token-yala-epidemic-sec' || req.query.role === 'official';

  const cases = loadCases();

  if (isOfficial) {
    // Return full patient list to authorized officials
    return res.json(cases);
  } else {
    // Public user: Hide all personal details, return only spatial/epidemiologic data
    const safeCases = cases.map(c => ({
      id: c.id,
      gps: c.gps,
      disease: c.disease,
      severity: c.severity,
      status: c.status,
      createdAt: c.createdAt,
      areaName: c.areaName,
      priority: c.priority,
      scenario: c.scenario,
      // Personal details completely hidden
      personalInfo: {
        name: 'Patient (Confidential)',
        age: 0,
        gender: 'Confidential',
        phone: 'Confidential',
        status: 'Confidential',
        occupation: 'Confidential',
        residencyStatus: 'Confidential',
        allergies: 'Confidential',
        demands: 'Confidential'
      },
      clinicalInfo: {
        symptoms: [],
        days: 0,
        contactHistory: 'Confidential'
      }
    }));
    return res.json(safeCases);
  }
});

// PUT /api/cases/:id - Updates status of a case (Officials only)
app.put('/api/cases/:id', (req, res) => {
  const { id } = req.params;
  const { status, disease, priority, severity } = req.body;

  const authHeader = req.headers.authorization || '';
  const isOfficial = authHeader === 'Bearer mock-jwt-token-yala-epidemic-sec';

  if (!isOfficial) {
    return res.status(403).json({ success: false, error: 'Unauthorized. Official clearance required.' });
  }

  const cases = loadCases();
  const caseIndex = cases.findIndex(c => c.id === id);

  if (caseIndex === -1) {
    return res.status(404).json({ success: false, error: 'Case not found' });
  }

  // Update status if provided and valid
  if (status) {
    const validStatuses: CaseStatus[] = ['New', 'Accepted', 'Waiting', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }
    cases[caseIndex].status = status;
  }

  // Update disease if provided
  if (disease) {
    cases[caseIndex].disease = disease;
    // Auto-update scenario, priority, and severity based on new disease if not explicitly overridden
    const diseaseNormalized = disease.toLowerCase();

    let targetScenario: ScenarioMode = 'Normal';
    if (
      diseaseNormalized.includes('leptospirosis') || diseaseNormalized.includes('ฉี่หนู') ||
      diseaseNormalized.includes('diarrhea') || diseaseNormalized.includes('ท้องร่วง') || diseaseNormalized.includes('อุจจาระ') ||
      diseaseNormalized.includes('skin') || diseaseNormalized.includes('ผิวหนัง') || diseaseNormalized.includes('น้ำกัดเท้า') ||
      diseaseNormalized.includes('cholera') || diseaseNormalized.includes('อหิวา')
    ) {
      targetScenario = 'Flood';
    }
    cases[caseIndex].scenario = targetScenario;

    if (!priority) {
      if (
        diseaseNormalized.includes('dengue') || diseaseNormalized.includes('ไข้เลือดออก') ||
        diseaseNormalized.includes('leptospirosis') || diseaseNormalized.includes('ฉี่หนู') ||
        diseaseNormalized.includes('cholera') || diseaseNormalized.includes('อหิวา')
      ) {
        cases[caseIndex].severity = 'high';
        cases[caseIndex].priority = 'critical';
      } else if (
        diseaseNormalized.includes('covid') || diseaseNormalized.includes('โควิด') ||
        diseaseNormalized.includes('diarrhea') || diseaseNormalized.includes('ท้องร่วง')
      ) {
        cases[caseIndex].severity = 'medium';
        cases[caseIndex].priority = 'moderate';
      } else {
        cases[caseIndex].severity = 'low';
        cases[caseIndex].priority = 'low';
      }
    }
  }

  // Update priority and severity if explicitly provided
  if (priority) cases[caseIndex].priority = priority;
  if (severity) cases[caseIndex].severity = severity;

  // Update personalInfo and clinicalInfo if provided
  if (req.body.personalInfo) {
    cases[caseIndex].personalInfo = {
      ...cases[caseIndex].personalInfo,
      ...req.body.personalInfo
    };
  }
  if (req.body.clinicalInfo) {
    cases[caseIndex].clinicalInfo = {
      ...cases[caseIndex].clinicalInfo,
      ...req.body.clinicalInfo
    };
  }

  saveCases(cases);

  // Broadcast state change
  broadcast('UPDATE_CASE', cases[caseIndex]);

  return res.json({
    success: true,
    message: `Case successfully updated`,
    data: cases[caseIndex]
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LINE Messaging API Webhook
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/line/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  // 1. Verify LINE Signature
  const signature = req.headers['x-line-signature'] as string;
  if (LINE_CHANNEL_SECRET && signature) {
    const hmac = crypto.createHmac('sha256', LINE_CHANNEL_SECRET);
    hmac.update(req.body);
    const digest = hmac.digest('base64');
    if (digest !== signature) {
      console.warn('[LINE] Invalid signature — rejected request.');
      return res.status(403).json({ error: 'Invalid signature' });
    }
  }

  let body: any;
  try {
    body = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // 2. Process each event
  for (const event of body.events || []) {
    const userId: string = event.source?.userId;
    const replyToken: string = event.replyToken;

    if (!userId) continue;

    // ── Follow event: user adds the bot as friend ──────────────────────────
    if (event.type === 'follow') {
      lineSessions.delete(userId);
      await lineReply(replyToken, [
        lineText(
          '🏥 สวัสดีครับ! ยินดีต้อนรับสู่ระบบแจ้งโรคระบาด เทศบาลนครยะลา\n\n' +
          'พิมพ์ "รายงาน" หรือ "report" เพื่อเริ่มแจ้งอาการของท่านได้เลยครับ'
        ),
      ]);
      continue;
    }

    // ── Message event ──────────────────────────────────────────────────────
    if (event.type !== 'message' || event.message?.type !== 'text') continue;
    const text: string = (event.message.text || '').trim();

    // Get or create session
    let session = lineSessions.get(userId);

    // Trigger word to start
    if (!session || session.step === 'IDLE') {
      if (text === 'รายงาน' || text.toLowerCase() === 'report') {
        lineSessions.set(userId, { step: 'ASK_NAME', data: {} });
        await lineReply(replyToken, [
          lineText(
            '📋 เริ่มต้นการแจ้งอาการป่วย\n\n' +
            'กรุณากรอกข้อมูลทีละขั้น ระบบจะส่งข้อมูลให้เจ้าหน้าที่สาธารณสุขโดยอัตโนมัติ\n\n' +
            '⬇️ ขั้นที่ 1/9 — กรุณาระบุ ชื่อ-นามสกุล ของท่าน'
          ),
        ]);
      } else {
        const aiResponse = await getAIConsultation(text);
        await lineReply(replyToken, [
          lineText(aiResponse),
        ]);
      }
      continue;
    }

    // Cancel anytime
    if (text === 'ยกเลิก' || text.toLowerCase() === 'cancel') {
      lineSessions.delete(userId);
      await lineReply(replyToken, [
        lineText('❌ ยกเลิกการแจ้งอาการแล้ว\nพิมพ์ "รายงาน" เพื่อเริ่มใหม่ได้เลยครับ'),
      ]);
      continue;
    }

    // ── State machine ──────────────────────────────────────────────────────
    switch (session.step) {

      case 'ASK_NAME': {
        session.data.name = text;
        session.step = 'ASK_PHONE';
        await lineReply(replyToken, [
          lineText('✅ ชื่อ: ' + text + '\n\n⬇️ ขั้นที่ 2/9 — กรุณาระบุ เบอร์โทรศัพท์ติดต่อ'),
        ]);
        break;
      }

      case 'ASK_PHONE': {
        session.data.phone = text;
        session.step = 'ASK_AGE';
        await lineReply(replyToken, [
          lineText('✅ เบอร์โทร: ' + text + '\n\n⬇️ ขั้นที่ 3/9 — กรุณาระบุ อายุ (ปี) เช่น 35'),
        ]);
        break;
      }

      case 'ASK_AGE': {
        const age = parseInt(text);
        if (isNaN(age) || age < 1 || age > 120) {
          await lineReply(replyToken, [lineText('⚠️ กรุณาระบุอายุเป็นตัวเลข เช่น 35')]);
          break;
        }
        session.data.age = age;
        session.step = 'ASK_GENDER';
        await lineReply(replyToken, [
          lineQuickReply('⬇️ ขั้นที่ 4/9 — กรุณาเลือก เพศ ของท่าน', ['ชาย', 'หญิง', 'ไม่ระบุ']),
        ]);
        break;
      }

      case 'ASK_GENDER': {
        session.data.gender = text;
        session.step = 'ASK_DISEASE';
        await lineReply(replyToken, [
          lineQuickReply(
            '⬇️ ขั้นที่ 5/9 — ท่านสงสัยว่าเป็นโรคอะไร? (เลือกหรือพิมพ์เอง)',
            ['ไข้เลือดออก', 'COVID-19', 'ฉี่หนู', 'ท้องร่วง', 'ไข้หวัดใหญ่', 'ผิวหนัง', 'อหิวา', 'มือเท้าปาก', 'อื่นๆ']
          ),
        ]);
        break;
      }

      case 'ASK_DISEASE': {
        // Map Thai names to English for database
        const diseaseMap: Record<string, string> = {
          'ไข้เลือดออก': 'Dengue Fever',
          'ฉี่หนู': 'Leptospirosis',
          'ฉี่หนู (leptospirosis)': 'Leptospirosis',
          'ท้องร่วง': 'Diarrhea',
          'ไข้หวัดใหญ่': 'Influenza',
          'ผิวหนัง': 'Skin Infection',
          'อหิวา': 'Cholera',
          'มือเท้าปาก': 'Hand, Foot, and Mouth Disease',
        };
        session.data.disease = diseaseMap[text.toLowerCase()] || text;
        session.step = 'ASK_SYMPTOMS';
        await lineReply(replyToken, [
          lineText(
            '⬇️ ขั้นที่ 6/9 — กรุณาระบุ อาการที่พบ ของท่าน\n' +
            '(สามารถพิมพ์หลายอาการ คั่นด้วยจุลภาค เช่น ไข้สูง, ปวดศีรษะ, ผื่นขึ้น)'
          ),
        ]);
        break;
      }

      case 'ASK_SYMPTOMS': {
        session.data.symptoms = text.split(/[,،،,]/u).map(s => s.trim()).filter(Boolean);
        session.step = 'ASK_DAYS';
        await lineReply(replyToken, [
          lineText('⬇️ ขั้นที่ 7/9 — ท่านมีอาการมาแล้วกี่วัน? (ระบุเป็นตัวเลข เช่น 3)'),
        ]);
        break;
      }

      case 'ASK_DAYS': {
        const days = parseInt(text);
        if (isNaN(days) || days < 0) {
          await lineReply(replyToken, [lineText('⚠️ กรุณาระบุจำนวนวันเป็นตัวเลข เช่น 3')]);
          break;
        }
        session.data.days = days;
        session.step = 'ASK_AREA';
        await lineReply(replyToken, [
          lineQuickReply(
            '⬇️ ขั้นที่ 8/9 — ท่านอาศัยอยู่ในพื้นที่ใด?',
            ['สะเตง', 'สะเตงนอก', 'ท่าสาป', 'อื่นๆ']
          ),
        ]);
        break;
      }

      case 'ASK_AREA': {
        const areaMap: Record<string, string> = {
          'สะเตงกลาง': 'Sateng Center',
          'สะเตงนอก': 'Sateng Nok',
          'ท่าสาป': 'Tha Sap',
          'สะเตงกลาง (sateng center)': 'Sateng Center',
          'สะเตงนอก (sateng nok)': 'Sateng Nok',
          'ท่าสาป (tha sap)': 'Tha Sap',
        };
        session.data.areaName = areaMap[text.toLowerCase()] || text;
        session.step = 'ASK_CONTACT';
        await lineReply(replyToken, [
          lineText(
            '⬇️ ขั้นที่ 9/9 — ประวัติการสัมผัสโรค\n' +
            'เช่น "ไปตลาดนัด", "สัมผัสน้ำท่วม", "ใกล้ชิดผู้ป่วย" หรือพิมพ์ "ไม่มี" หากไม่มี'
          ),
        ]);
        break;
      }

      case 'ASK_CONTACT': {
        session.data.contactHistory = text;

        // ── All data collected — save case ──────────────────────────────────
        const cases = loadCases();
        const { disease, name, phone, age, gender, symptoms, days, areaName, contactHistory } = session.data;
        const { severity, priority, scenario } = classifyDisease(disease || 'Unknown');

        const defaultLat = 6.5399 + (Math.random() - 0.5) * 0.025;
        const defaultLng = 101.2813 + (Math.random() - 0.5) * 0.025;

        const newCase: Case = {
          id: `line_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          gps: { lat: defaultLat, lng: defaultLng },
          personalInfo: {
            name: name || 'ไม่ระบุ',
            age: age || 0,
            gender: gender || 'ไม่ระบุ',
            phone: phone || 'LINE Chat',
            status: 'Quarantined',
            occupation: 'ไม่ระบุ',
            residencyStatus: 'คนในพื้นที่',
            allergies: 'ไม่มี',
            demands: 'ไม่มี',
          },
          clinicalInfo: {
            symptoms: symptoms || ['ไม่ระบุ'],
            days: days || 0,
            contactHistory: contactHistory || 'ไม่มี',
          },
          disease: disease || 'Unknown',
          severity,
          status: 'New',
          createdAt: new Date().toISOString(),
          areaName: areaName || 'Sateng Center',
          priority,
          scenario,
        };

        cases.push(newCase);
        saveCases(cases);
        broadcast('NEW_CASE', newCase);

        // Clear session
        lineSessions.delete(userId);

        await lineReply(replyToken, [
          lineText(
            '✅ ขอบคุณครับ! ระบบได้รับข้อมูลของท่านเรียบร้อยแล้ว\n\n' +
            `📋 สรุปข้อมูล:\n` +
            `• ชื่อ: ${newCase.personalInfo.name}\n` +
            `• โรค: ${newCase.disease}\n` +
            `• อาการ: ${newCase.clinicalInfo.symptoms.join(', ')}\n` +
            `• พื้นที่: ${newCase.areaName}\n` +
            `• สถานะ: รอการตรวจสอบจากเจ้าหน้าที่\n\n` +
            '🏥 เจ้าหน้าที่สาธารณสุขจะติดต่อกลับภายใน 24 ชั่วโมง\n' +
            'พิมพ์ "รายงาน" หากต้องการแจ้งเคสใหม่'
          ),
        ]);
        console.log(`[LINE Bot] New case registered from LINE: ${newCase.id} — ${newCase.disease} in ${newCase.areaName}`);
        break;
      }
    }
  }

  return res.status(200).json({ ok: true });
});

// ─── LINE Webhook verification endpoint (for LINE console) ────────────────
app.get('/api/line/webhook', (_req, res) => {
  res.status(200).send('LINE webhook active — Yala Epidemic Monitor 🏥');
});

// Start integration server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yala Epidemic Server] running at http://localhost:${PORT}`);
    if (LINE_CHANNEL_ACCESS_TOKEN) {
      console.log(`[LINE Bot] Webhook ready at /api/line/webhook`);
    } else {
      console.warn(`[LINE Bot] LINE_CHANNEL_ACCESS_TOKEN not set — webhook inactive`);
    }
  });
}

startServer();
