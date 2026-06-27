import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Load types for local handling
import { Case, CaseStatus, SeverityLevel, PriorityLevel, ScenarioMode } from './src/types.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'cases_db.json');

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
app.post('/api/cases', (req, res) => {
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
  });
}

startServer();
