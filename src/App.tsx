import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Users, Calendar, Filter, CircleDot, 
  CheckSquare, Shield, Eye, LogOut, HeartPulse, Sparkles, 
  Bell, Check, AlertTriangle, BookOpen, Layers, Languages,
  Search, ShieldCheck, HelpCircle, ArrowRight, TrendingUp, Info, Lock,
  Home, Map, BarChart3, ClipboardList, ChevronLeft, ChevronRight
} from 'lucide-react';

// Custom Sub-components
import MapSystem from './components/MapSystem';
import StatsDashboard from './components/StatsDashboard';
import CaseManagement from './components/CaseManagement';
import PreventionGuides from './components/PreventionGuides';
import LoginDialog from './components/LoginDialog';
import YalaEpidemicLogo from './components/YalaEpidemicLogo';
import UserTutorial from './components/UserTutorial';

// Data types
import { Case, CaseStatus, PriorityLevel, ScenarioMode } from './types';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'alert';
  title: string;
  message: string;
}

const translations = {
  th: {
    title: "ศูนย์ข้อมูลภัยพิบัติทางสาธารณสุขยะลา",
    subtitle: "ระบบเฝ้าระวังโรคระบาด เทศบาลนครยะลา",
    liveConnection: "เชื่อมต่อเรียลไทม์",
    registeredClusters: "คลัสเตอร์โรคเสี่ยง",
    highAlerts: "แจ้งเตือนระดับสูง",
    publicView: "มุมมองประชาชน",
    officialsPortal: "ส่วนเจ้าหน้าที่",
    authenticatedAs: "ยืนยันตัวตนในฐานะ",
    signOut: "ออกจากระบบ",
    satengDistrictContainment: "โครงการเฝ้าระวังและสกัดกั้นการแพร่ระบาดชุมชนสะเตง-ท่าสาป",
    sanitarySurveillancePortal: "พอร์ทัลความมั่นคงและคุ้มครองสุขภาวะ เทศบาลนครยะลา",
    portalIntro: "ระบบติดตามข้อมูลระบาดวิทยาทางภูมิสารสนเทศ (GIS) ทำงานร่วมกับแชทบอทรายงานตนของเทศบาลนครยะลา เพื่อควบคุมพื้นที่เสี่ยงจำกัดวงแพร่ระบาด บันทึกข้อมูลประวัติผู้ป่วย และเผยแพร่แนวทางป้องกันความเสี่ยงอย่างเป็นทางการ",
    kpiMonitoredCases: "เคสระบาดที่บันทึก",
    kpiQuarantined: "อยู่ระหว่างกักตัว",
    kpiWaiting: "รอผลแล็บยืนยัน",
    kpiCompleted: "พ้นระยะเสี่ยง/หายดี",
    actionError: "เกิดข้อผิดพลาดในการดำเนินการ",
    actionErrorDesc: "ไม่สามารถอัปเดตสถานะของผู้ป่วยได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
    newIntakeAlert: "🚨 รายงานโรคระบาดรายใหม่",
    newIntakeAlertDesc: "พบเคสใหม่ %disease% ในพื้นที่ชุมชน %area% ได้รับการขึ้นทะเบียนแล้ว",
    caseLedgerUpdated: "📈 อัปเดตแฟ้มประวัติสำเร็จ",
    caseLedgerUpdatedDesc: "สถานะควบคุมของ %name% ถูกปรับเปลี่ยนเป็น %status% แล้ว",
    loadingLedger: "กำลังโหลดข้อมูลสารสนเทศภูมิศาสตร์สาธารณสุข...",
    welcomeOfficer: "🔐 ยืนยันสิทธิ์สำเร็จ",
    welcomeOfficerDesc: "ยินดีต้อนรับเจ้าหน้าที่ %name% เข้าสู่ระบบควบคุมการระบาด",
    loggedOut: "🔒 ออกจากระบบแล้ว",
    loggedOutDesc: "คุณออกจากระบบรักษาความปลอดภัยเรียบร้อยแล้ว",
  },
  en: {
    title: "YALA EPEDERMIC HEALTH",
    subtitle: "Yala Municipal Disease Surveillance Portal",
    liveConnection: "Live Stream Active",
    registeredClusters: "Monitored Clusters",
    highAlerts: "High Alerts",
    publicView: "Public View",
    officialsPortal: "Officials Portal",
    authenticatedAs: "Authenticated as",
    signOut: "Sign Out",
    satengDistrictContainment: "Sateng District Outbreak Control Program",
    sanitarySurveillancePortal: "Yala Municipality Sanitary Surveillance Portal",
    portalIntro: "Integrated GIS epidemic mapping and tracking system synced with municipal reports. Isolate risk neighborhoods (Sateng, Sateng Nok, Tha Sap), manage active case workflows, and review clinical guides.",
    kpiMonitoredCases: "Monitored Cases",
    kpiQuarantined: "Quarantined",
    kpiWaiting: "Waiting Test",
    kpiCompleted: "Discharged / Free",
    actionError: "⚠️ Connection Error",
    actionErrorDesc: "Could not sync patient status updates. Please check network link.",
    newIntakeAlert: "🚨 NEW INTAKE REPORTED",
    newIntakeAlertDesc: "A new case of %disease% was registered in neighborhood %area%!",
    caseLedgerUpdated: "📈 LEDGER STATE UPDATED",
    caseLedgerUpdatedDesc: "Epidemiological status of %name% transitioned to %status%.",
    loadingLedger: "Loading Municipal GIS Ledgers...",
    welcomeOfficer: "🔐 ACCESS GRANTED",
    welcomeOfficerDesc: "Welcome Officer %name%. Authorization clearance active for Sateng sectors.",
    loggedOut: "🔒 LOGGED OUT",
    loggedOutDesc: "You have signed out of the official municipal portal safely.",
  }
};

export default function App() {
  const [role, setRole] = useState<'public' | 'official'>('public');
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'th' | 'en'>('th'); // Default to Thai

  // Active Sidebar Tab State
  const [activeSidebarTab, setActiveSidebarTab] = useState<'dashboard' | 'map' | 'statistics' | 'prevention' | 'cases'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Interactive User Tutorial Walkthrough state
  const [showTutorial, setShowTutorial] = useState(false);
  const [floatingStatusExpanded, setFloatingStatusExpanded] = useState(false);

  // Scenario Mode Toggle (Normal vs Flood)
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>('Normal');

  // Search Filter state (removed from topbar, but preserved here to prevent potential breaking reference checks)
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics Dashboard States
  const [selectedDisease, setSelectedDisease] = useState('All Diseases');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Notifications bell mock state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; titleTh: string; titleEn: string; date: string; unread: boolean; type: string }>>([
    { id: '1', titleTh: 'ตรวจพบดัชนีเสี่ยงโรคฉี่หนูเพิ่มขึ้น 15% หลังน้ำลดในเขตตำบลท่าสาป', titleEn: 'Leptospirosis index rose by 15% post-flood in Tha Sap district', date: 'Just now', unread: true, type: 'Flood' },
    { id: '2', titleTh: 'ประกาศเปิดใช้ระบบพอร์ทัลตรวจโรคภัยพิบัติ YALA EPEDERMIC HEALTH', titleEn: 'Official launch of YALA EPEDERMIC HEALTH public monitoring system', date: '2 hours ago', unread: true, type: 'Info' },
    { id: '3', titleTh: 'พบการรายงานโรคอุจจาระร่วงเฉียบพลันรายใหม่ในชุมชนสะเตงนอก', titleEn: 'New acute diarrhea cases registered in Sateng Nok village', date: 'Yesterday', unread: false, type: 'Alert' }
  ]);

  // Sound effects or visual haptics refs
  const sseConnectedRef = useRef(false);

  const t = translations[lang];

  // Load auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('yala_epid_auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth(parsed);
        setRole('official'); // default to official if logged in
      } catch (err) {
        console.error('Error parsing saved authentication details', err);
      }
    }
    
    const savedLang = localStorage.getItem('yala_epid_lang');
    if (savedLang === 'th' || savedLang === 'en') {
      setLang(savedLang);
    }

    const completed = localStorage.getItem('surveillance_tutorial_completed');
    if (completed !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  const handleLanguageToggle = () => {
    const nextLang = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
    localStorage.setItem('yala_epid_lang', nextLang);
  };

  // Fetch Cases from API
  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = role === 'official' && auth 
        ? `/api/cases?role=official` 
        : `/api/cases`;
        
      const headers: HeadersInit = {};
      if (role === 'official' && auth) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Failed to load epidemiology cases ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger refetch when role, auth state changes
  useEffect(() => {
    fetchCases();
  }, [role, auth]);

  // Establish SSE Live Realtime Stream
  useEffect(() => {
    if (sseConnectedRef.current) return;

    const sse = new EventSource('/api/realtime');
    sseConnectedRef.current = true;

    sse.addEventListener('open', () => {
      console.log('Real-time epidemiological stream connected successfully.');
    });

    sse.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        const { type, data } = packet;

        if (type === 'NEW_CASE') {
          const newCase = data as Case;
          
          setCases(prev => {
            if (prev.some(c => c.id === newCase.id)) return prev;
            return [...prev, newCase];
          });

          // Add notification to navbar list
          setNotifications(prev => [
            {
              id: `notif_${Date.now()}`,
              titleTh: `พบเคสผู้ป่วยใหม่: ${newCase.disease} พื้นที่ ${newCase.areaName}`,
              titleEn: `New case registered: ${newCase.disease} in ${newCase.areaName}`,
              date: 'Just now',
              unread: true,
              type: 'NewCase'
            },
            ...prev
          ]);

          showToast({
            id: `toast_${Date.now()}`,
            type: 'alert',
            title: t.newIntakeAlert,
            message: t.newIntakeAlertDesc
              .replace('%disease%', newCase.disease)
              .replace('%area%', newCase.areaName)
          });
        } 
        
        else if (type === 'UPDATE_CASE') {
          const updatedCase = data as Case;
          setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
          
          showToast({
            id: `toast_${Date.now()}`,
            type: 'success',
            title: t.caseLedgerUpdated,
            message: t.caseLedgerUpdatedDesc
              .replace('%name%', role === 'official' ? updatedCase.personalInfo.name : (lang === 'th' ? 'ผู้ป่วย' : 'Patient'))
              .replace('%status%', updatedCase.status)
          });
        }
      } catch (err) {
        console.error('Error handling live update packet:', err);
      }
    };

    sse.onerror = (err) => {
      console.warn('Real-time connection stream notice: reconnecting if dropped.', err);
    };

    return () => {
      sse.close();
      sseConnectedRef.current = false;
    };
  }, [role, lang]);

  // Helper to trigger floating toasts
  const showToast = (toast: Toast) => {
    setToasts(prev => [toast, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 6000);
  };

  const handleLoginSuccess = (token: string, user: any) => {
    const session = { token, user };
    localStorage.setItem('yala_epid_auth', JSON.stringify(session));
    setAuth(session);
    setRole('official');
    setActiveSidebarTab('cases'); // Redirect to management automatically
    showToast({
      id: `toast_login_${Date.now()}`,
      type: 'success',
      title: t.welcomeOfficer,
      message: t.welcomeOfficerDesc.replace('%name%', user.name)
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('yala_epid_auth');
    setAuth(null);
    setRole('public');
    setActiveSidebarTab('dashboard'); // Redirect back to public dashboard
    showToast({
      id: `toast_logout_${Date.now()}`,
      type: 'info',
      title: t.loggedOut,
      message: t.loggedOutDesc
    });
  };

  // Put /api/cases/:id handler
  const handleStatusUpdate = async (
    id: string,
    newStatus?: CaseStatus,
    newDisease?: string,
    newPriority?: string,
    personalInfo?: any,
    clinicalInfo?: any
  ) => {
    if (!auth) return;
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          disease: newDisease, 
          priority: newPriority,
          personalInfo,
          clinicalInfo
        })
      });

      if (!res.ok) {
        throw new Error('Status transition rejected by server.');
      }
    } catch (err) {
      console.error(err);
      showToast({
        id: `toast_err_${Date.now()}`,
        type: 'info',
        title: t.actionError,
        message: t.actionErrorDesc
      });
    }
  };

  // Set selected case for full inspection
  const handleSelectCase = (c: Case) => {
    setSelectedCaseId(c.id);
  };

  // Perform search querying
  const filteredSearchCases = cases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesDisease = c.disease.toLowerCase().includes(q);
    const matchesArea = c.areaName.toLowerCase().includes(q);
    const matchesPatientName = role === 'official' && c.personalInfo?.name?.toLowerCase().includes(q);
    return matchesDisease || matchesArea || matchesPatientName;
  });

  // KPI Calculations
  const filteredByScenarioCases = filteredSearchCases.filter(c => c.scenario === scenarioMode);

  const totalCases = filteredByScenarioCases.length;
  const highRiskCount = filteredByScenarioCases.filter(c => c.severity === 'high').length;
  const waitingCount = filteredByScenarioCases.filter(c => c.status === 'Waiting').length;
  const completedCount = filteredByScenarioCases.filter(c => c.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row" id="app_root">
      
      {/* 1. FLOATING TOASTS BANNER PANEL */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`p-4 rounded-xl shadow-lg border text-xs leading-relaxed flex items-start space-x-3.5 transition duration-150 ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white border-green-700' 
                : toast.type === 'alert' 
                ? 'bg-rose-600 text-white border-rose-700' 
                : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}
          >
            <div className="flex-1">
              <p className="font-extrabold tracking-wider uppercase text-[10px] opacity-90">{toast.title}</p>
              <p className="mt-0.5 font-bold leading-normal">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== toast.id))}
              className="opacity-75 hover:opacity-100 font-bold px-1"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 2. RESPONSIVE SIDEBAR (COLLAPSIBLE ON DESKTOP & SCROLLABLE ON MOBILE/TABLET) */}
      <aside className={`relative bg-slate-900 text-slate-200 flex shrink-0 border-slate-800 sticky top-0 z-40 transition-all duration-300
        ${sidebarCollapsed 
          ? 'md:w-20 md:flex-col h-auto md:h-screen border-b md:border-b-0 md:border-r flex-row w-full p-2' 
          : 'md:w-64 md:flex-col h-auto md:h-screen border-b md:border-b-0 md:border-r flex-row w-full p-2 md:p-0'
        }`} id="left_sidebar">
        
        {/* Brand Header */}
        <div className={`border-slate-800 flex items-center justify-between transition-all duration-300 w-full md:w-auto
          ${sidebarCollapsed 
            ? 'md:p-4 md:border-b-0 md:justify-center flex-row px-2 shrink-0' 
            : 'md:p-6 md:border-b flex-row px-3 md:px-6 shrink-0'
          }`}>
          <div className="flex items-center gap-3">
            <YalaEpidemicLogo size={sidebarCollapsed ? 38 : 48} className="flex-shrink-0 transition-all duration-300" />
            <div className={`${sidebarCollapsed ? 'md:hidden' : 'block'} min-w-0`}>
              <h1 className="font-black text-white text-[12px] md:text-[15px] tracking-tight leading-none uppercase whitespace-normal break-words max-w-[170px]">
                YALA EPEDERMIC HEALTH
              </h1>
              <span className="text-[9px] md:text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase block mt-1.5 whitespace-nowrap">
                {lang === 'th' ? 'ระบบเฝ้าระวังควบคุมโรค' : 'EPIDEMIC CONTROL'}
              </span>
            </div>
          </div>
        </div>

        {/* Centered Sidebar Collapse toggle button for Desktop (placed relative to aside border) */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white items-center justify-center cursor-pointer transition z-50 shadow-md"
          title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Navigation - Horizontal scrolls on mobile, vertical stack on desktop */}
        <nav className={`flex overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal p-2 flex-1 scrollbar-none
          ${sidebarCollapsed 
            ? 'md:flex-col md:items-center flex-row gap-2' 
            : 'md:flex-col flex-row gap-2 md:gap-1 md:p-4'
          }`}>
          
          {/* Home */}
          <button
            onClick={() => setActiveSidebarTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-black transition duration-150 cursor-pointer shrink-0
              ${activeSidebarTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'md:justify-center md:w-12 md:px-0' : 'w-full'}`}
            title={lang === 'th' ? 'หน้าหลัก' : 'Main Dashboard'}
          >
            <Home size={16} className="shrink-0" />
            <span className={sidebarCollapsed ? 'md:hidden' : 'inline'}>{lang === 'th' ? 'หน้าหลัก' : 'Dashboard'}</span>
          </button>

          {/* Map */}
          <button
            onClick={() => setActiveSidebarTab('map')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-black transition duration-150 cursor-pointer shrink-0
              ${activeSidebarTab === 'map' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'md:justify-center md:w-12 md:px-0' : 'w-full'}`}
            title={lang === 'th' ? 'แผนที่ระบาด' : 'Epidemic Map'}
          >
            <Map size={16} className="shrink-0" />
            <span className={sidebarCollapsed ? 'md:hidden' : 'inline'}>{lang === 'th' ? 'แผนที่ระบาด' : 'GIS Map'}</span>
          </button>

          {/* Statistics */}
          <button
            onClick={() => setActiveSidebarTab('statistics')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-black transition duration-150 cursor-pointer shrink-0
              ${activeSidebarTab === 'statistics' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'md:justify-center md:w-12 md:px-0' : 'w-full'}`}
            title={lang === 'th' ? 'สถิติโรค' : 'Disease Analytics'}
          >
            <BarChart3 size={16} className="shrink-0" />
            <span className={sidebarCollapsed ? 'md:hidden' : 'inline'}>{lang === 'th' ? 'สถิติโรค' : 'Statistics'}</span>
          </button>

          {/* Prevention */}
          <button
            onClick={() => setActiveSidebarTab('prevention')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-black transition duration-150 cursor-pointer shrink-0
              ${activeSidebarTab === 'prevention' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'md:justify-center md:w-12 md:px-0' : 'w-full'}`}
            title={lang === 'th' ? 'คู่มือป้องกัน' : 'Prevention'}
          >
            <HeartPulse size={16} className="shrink-0" />
            <span className={sidebarCollapsed ? 'md:hidden' : 'inline'}>{lang === 'th' ? 'คู่มือป้องกัน' : 'Guides'}</span>
          </button>

          {/* Desktop Divider */}
          <div className="hidden md:block border-t border-slate-800 my-2 w-full" />

          {/* Official cases */}
          <button
            onClick={() => {
              if (auth) {
                setActiveSidebarTab('cases');
              } else {
                setRole('official');
                setActiveSidebarTab('cases');
              }
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black transition duration-150 cursor-pointer shrink-0
              ${activeSidebarTab === 'cases' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${sidebarCollapsed ? 'md:justify-center md:w-12 md:px-0' : 'w-full'}`}
            title={lang === 'th' ? 'จัดการเคส' : 'Cases Control'}
          >
            <div className="flex items-center space-x-2">
              <ClipboardList size={16} className="shrink-0" />
              <span className={sidebarCollapsed ? 'md:hidden' : 'inline'}>{lang === 'th' ? 'จัดการเคส' : 'Officials'}</span>
            </div>
            {!sidebarCollapsed && !auth && <Lock size={11} className="text-slate-500 hidden md:block" />}
          </button>

        </nav>

        {/* Live sync badge (hidden if collapsed or on mobile to stay hyper compact) */}
        {!sidebarCollapsed && (
          <div className="hidden md:block p-4 border-t border-slate-800">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">
                {lang === 'th' ? 'ระบบตรวจสดทำงาน' : 'GIS LIVE'}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0" id="main_workspace">
        
        {/* TOP NAVBAR */}
        {activeSidebarTab !== 'map' && (
        <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-30 flex items-center justify-between px-6 shadow-2xs">
          
          {/* Brand header / Walkthrough toggle button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTutorial(true)}
              type="button"
              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-black px-3 py-1.5 rounded-lg border border-cyan-200 text-[10px] flex items-center space-x-1.5 transition cursor-pointer uppercase tracking-wider"
              id="walkthrough_trigger_btn"
            >
              <HelpCircle size={13} className="text-cyan-600" />
              <span>{lang === 'th' ? 'สอนการใช้งาน' : 'Show Walkthrough'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language switch button */}
            <button
              onClick={handleLanguageToggle}
              type="button"
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-black px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Languages size={13} className="text-blue-600" />
              <span>{lang === 'th' ? 'EN' : 'ไทย'}</span>
            </button>

            {/* Notifications Alert Bell Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 text-slate-600 transition cursor-pointer relative"
              >
                <Bell size={15} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wide">
                      {lang === 'th' ? 'แจ้งเตือนสถานการณ์ด่วน' : 'Active Health Alerts'}
                    </span>
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                        setNotificationsOpen(false);
                      }}
                      className="text-[9px] text-blue-600 font-bold hover:underline"
                    >
                      {lang === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`pt-2 flex flex-col space-y-0.5 ${notif.unread ? 'bg-blue-50/10 -mx-1 px-1 rounded' : ''}`}>
                        <div className="flex items-center space-x-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${notif.type === 'Flood' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <p className="font-bold text-slate-800 leading-normal">
                            {lang === 'th' ? notif.titleTh : notif.titleEn}
                          </p>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold font-mono pl-2.5">{notif.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile authentication block */}
            {auth ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="flex flex-col items-end text-right">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{t.authenticatedAs}</span>
                  <span className="text-[11px] font-extrabold text-slate-800 leading-none">{auth.user?.name}</span>
                </div>
                <div className="h-8 w-8 rounded-full border border-blue-500 p-0.5 shadow-2xs">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Naeef" alt="Profile" className="rounded-full bg-slate-50" />
                </div>
                <button
                  onClick={handleSignOut}
                  type="button"
                  className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 p-2 rounded-lg border border-slate-200 transition cursor-pointer"
                  title={t.signOut}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <button
                  onClick={() => {
                    setRole('official');
                    setActiveSidebarTab('cases');
                  }}
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-xs shadow-blue-500/10"
                >
                  <Shield size={13} />
                  <span>{lang === 'th' ? 'เข้าสู่ระบบ (เจ้าหน้าที่)' : 'Officials Login'}</span>
                </button>
              </div>
            )}
          </div>

        </header>
        )}

        {/* WORKSPACE AREA */}
        <main className={activeSidebarTab === 'map' ? "flex-1 overflow-hidden relative" : "flex-1 p-6 overflow-y-auto space-y-6"} id="app_main_content">
          
          {loading && cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-3 text-xs text-slate-400">
              <span className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
              <p className="font-bold uppercase tracking-wider animate-pulse">{t.loadingLedger}</p>
            </div>
          ) : (
            (() => {
              // Secure Auth Panel gateway for official Clinical workflow
              if (activeSidebarTab === 'cases' && !auth) {
                return (
                  <div className="py-6 animate-fade-in max-w-xl mx-auto">
                    <div className="text-center space-y-2 mb-6">
                      <div className="bg-blue-50 text-blue-600 inline-flex p-3 rounded-full border border-blue-100">
                        <Lock size={24} />
                      </div>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                        {lang === 'th' ? 'จำเป็นต้องยืนยันสิทธิ์เข้าใช้ระบบจัดการเคส' : 'Health Official Authentication Required'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold max-w-sm mx-auto leading-normal">
                        {lang === 'th' ? 'ระบบข้อมูลแฟ้มประวัติ และการปรับเปลี่ยนสถานะผู้ป่วยสงวนไว้สำหรับเจ้าหน้าที่สุขาภิบาลที่ลงทะเบียนไว้เท่านั้น' 
                                      : 'Clinical registries containing PII can only be modified by registered municipality staff.'}
                      </p>
                    </div>
                    <LoginDialog 
                      lang={lang}
                      onLoginSuccess={handleLoginSuccess}
                      onCancel={() => {
                        setRole('public');
                        setActiveSidebarTab('dashboard');
                      }}
                    />
                  </div>
                );
              }

              // TAB VIEW SWITCH
              switch (activeSidebarTab) {
                
                // TAB 1: DASHBOARD VIEW
                case 'dashboard':
                  return (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* Scenario Toggle and Title Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                          <h2 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center space-x-2">
                            <Activity className="text-blue-600" size={16} />
                            <span>{lang === 'th' ? 'สถานการณ์เฝ้าระวังภัยพิบัติทางสาธารณสุขยะลา' : 'Surveillance Threat Intelligence'}</span>
                          </h2>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {lang === 'th' ? 'สลับสภาวะอากาศเพื่อกรองความสุ่มเสี่ยงระบาดในพื้นที่' : 'Toggle environmental condition to assess active disease risks'}
                          </p>
                        </div>

                        {/* Smart Scenario Mode Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            onClick={() => setScenarioMode('Normal')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                              scenarioMode === 'Normal' 
                                ? 'bg-white text-blue-600 shadow-2xs font-extrabold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            ☀️ {lang === 'th' ? 'สภาวะปกติ (Normal Period)' : 'Normal Period'}
                          </button>
                          <button
                            onClick={() => setScenarioMode('Flood')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                              scenarioMode === 'Flood' 
                                ? 'bg-amber-600 text-white shadow-2xs font-extrabold' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            🌧️ {lang === 'th' ? 'สภาวะภัยน้ำท่วม (Flood Mode)' : 'Flood Scenario'}
                          </button>
                        </div>
                      </div>

                      {/* Marquee Ticker */}
                      <div className="bg-slate-950 border-2 border-red-600 overflow-hidden py-3 flex items-center shadow-lg rounded-xl" id="marquee_news_ticker">
                        <div className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-md ml-3 mr-4 shrink-0 flex items-center gap-1.5 shadow-sm border border-red-500">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span>{lang === 'th' ? 'ข่าวด่วนวันนี้' : 'Breaking News'}</span>
                        </div>
                        <div className="overflow-hidden relative w-full h-6 flex items-center">
                          <div className="absolute whitespace-nowrap animate-marquee font-extrabold text-sm text-yellow-400 tracking-wider">
                            {notifications.map(n => lang === 'th' ? `📢 ${n.titleTh}` : `📢 ${n.titleEn}`).join('      •      ')}
                          </div>
                        </div>
                      </div>

                      {/* Smart Risk Alert Banner */}
                      {scenarioMode === 'Flood' ? (
                        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-red-700 rounded-xl p-5 text-white relative overflow-hidden shadow-xs border border-amber-600">
                          <div className="relative z-10 space-y-1.5 max-w-2xl">
                            <span className="bg-white/25 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                              <AlertTriangle size={10} />
                              <span>{lang === 'th' ? 'เปิดแจ้งเตือนสภาวะภัยพิบัติขั้นวิกฤต' : 'CRITICAL ENVIRONMENTAL OUTBREAK MODE ACTIVE'}</span>
                            </span>
                            <h2 className="text-base md:text-lg font-black tracking-tight leading-tight">
                              {lang === 'th' ? '⚠️ แจ้งเตือนเฝ้าระวังโรคติดต่อฉี่หนู (Leptospirosis) และโรคผิวหนังอักเสบในเขตพื้นที่ท่าสาป-สะเตง' 
                                            : '⚠️ Urgent Surveillance Alert: Leptospirosis & Skin Infections High Post-Flood Indices'}
                            </h2>
                            <p className="text-[11px] text-amber-50/95 leading-relaxed font-bold">
                              {lang === 'th' ? 'เนื่องด้วยปริมาณน้ำท่วมขังเริ่มลดระดับ เทศบาลเมืองยะลาจึงแจ้งเตือนประชาชนในที่ต่ำหลีกเลี่ยงการเดินลุยโคลนด้วยเท้าเปล่า ป้องกันเชื้อโรคชอนไชเข้าทางแผล หรือเยื่อบุ สวมรองเท้าบูทยางทุกครั้งก่อนลุยน้ำท่วมขัง' 
                                            : 'With floodwaters receding, residents are strictly advised to avoid barefoot contact with muddy puddles. Always wear thick rubber boots to mitigate Leptospirosis infection.'}
                            </p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-4">
                            <ShieldAlert size={140} />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-5 text-white relative overflow-hidden shadow-xs">
                          <div className="relative z-10 space-y-1.5 max-w-2xl">
                            <span className="bg-white/20 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                              {lang === 'th' ? 'สภาวะควบคุมสาธารณสุขปกติ' : 'MUNICIPAL NORMAL TERM SANITARY CHANNEL'}
                            </span>
                            <h2 className="text-base md:text-lg font-black tracking-tight">
                              {lang === 'th' ? '🦟 เฝ้าระวังโรคไข้เลือดออก และกำจัดแหล่งน้ำขังในเขตสะเตงกลาง' 
                                            : '🦟 Control Vector Outbreaks: Dengue Elimination in Sateng Center'}
                            </h2>
                            <p className="text-[11px] text-blue-100/90 leading-relaxed font-semibold">
                              {lang === 'th' ? 'ร่วมมือร่วมใจใช้หลัก 3 เก็บ ปิดฝาถังน้ำ พ่นหมอกควันลดประชากรยุงลายพาหะนำโรคเดงกีในฤดูแล้งนี้' 
                                            : 'Apply standard mosquito vector controls. Change stagnant water weekly in vases and pots to secure children from Dengue.'}
                            </p>
                          </div>
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-4">
                            <HeartPulse size={140} />
                          </div>
                        </div>
                      )}

                      {/* Summary Cards Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1 - Monitored cases */}
                        <div className="bg-sky-50/90 p-5 rounded-2xl border border-sky-200 shadow-2xs space-y-2 hover:shadow-xs hover:border-sky-300 transition duration-150">
                          <span className="text-[11px] md:text-xs text-sky-800 font-black uppercase tracking-wider block font-mono">
                            {lang === 'th' ? 'จำนวนเคสที่บันทึก' : 'Monitored cases'}
                          </span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-4xl md:text-5xl font-black text-sky-950 block leading-none">{totalCases}</span>
                              <span className="text-[11px] md:text-xs text-sky-700 font-bold">{lang === 'th' ? 'ราย' : 'cases'}</span>
                            </div>
                            {scenarioMode === 'Flood' ? (
                              <div className="flex items-center space-x-1 text-red-600 font-extrabold text-xs md:text-sm animate-bounce shrink-0" style={{ animationDuration: '2s' }}>
                                <span className="text-sm md:text-base font-black">▲</span>
                                <span>+45%</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-emerald-600 font-extrabold text-xs md:text-sm animate-pulse shrink-0">
                                <span className="text-sm md:text-base font-black">▼</span>
                                <span>-15%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* KPI 2 - Critical Outbreaks */}
                        <div className="bg-rose-50/90 p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-2 hover:shadow-xs hover:border-rose-300 transition duration-150">
                          <span className="text-[11px] md:text-xs text-rose-800 font-black uppercase tracking-wider block font-mono">
                            {lang === 'th' ? 'เคสอันตรายสูง' : 'Critical Outbreaks'}
                          </span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-4xl md:text-5xl font-black text-rose-950 block leading-none">{highRiskCount}</span>
                              <span className="text-[11px] md:text-xs text-rose-700 font-bold">{lang === 'th' ? 'จุดแดง' : 'red circles'}</span>
                            </div>
                            {scenarioMode === 'Flood' ? (
                              <div className="flex items-center space-x-1 text-red-600 font-extrabold text-xs md:text-sm animate-bounce shrink-0" style={{ animationDuration: '1.8s' }}>
                                <span className="text-sm md:text-base font-black">▲</span>
                                <span>+60%</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-emerald-600 font-extrabold text-xs md:text-sm animate-pulse shrink-0">
                                <span className="text-sm md:text-base font-black">▼</span>
                                <span>-40%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* KPI 3 - Waiting lab tests */}
                        <div className="bg-purple-50/90 p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-2 hover:shadow-xs hover:border-purple-300 transition duration-150">
                          <span className="text-[11px] md:text-xs text-purple-800 font-black uppercase tracking-wider block font-mono">
                            {lang === 'th' ? 'อยู่ระหว่างรอผลแล็บ' : 'Waiting lab tests'}
                          </span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-4xl md:text-5xl font-black text-purple-950 block leading-none">{waitingCount}</span>
                              <span className="text-[11px] md:text-xs text-purple-700 font-bold">{lang === 'th' ? 'ราย' : 'patients'}</span>
                            </div>
                            {scenarioMode === 'Flood' ? (
                              <div className="flex items-center space-x-1 text-red-600 font-extrabold text-xs md:text-sm animate-bounce shrink-0" style={{ animationDuration: '2.2s' }}>
                                <span className="text-sm md:text-base font-black">▲</span>
                                <span>+30%</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-emerald-600 font-extrabold text-xs md:text-sm animate-pulse shrink-0">
                                <span className="text-sm md:text-base font-black">▼</span>
                                <span>-25%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* KPI 4 - Discharged/Completed */}
                        <div className="bg-emerald-50/90 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2 hover:shadow-xs hover:border-emerald-300 transition duration-150">
                          <span className="text-[11px] md:text-xs text-emerald-800 font-black uppercase tracking-wider block font-mono">
                            {lang === 'th' ? 'หายดี/พ้นระยะเสี่ยง' : 'Discharged/Completed'}
                          </span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-4xl md:text-5xl font-black text-emerald-950 block leading-none">{completedCount}</span>
                              <span className="text-[11px] md:text-xs text-emerald-700 font-bold">{lang === 'th' ? 'สำเร็จ' : 'cases'}</span>
                            </div>
                            {scenarioMode === 'Flood' ? (
                              <div className="flex items-center space-x-1 text-emerald-600 font-extrabold text-xs md:text-sm animate-pulse shrink-0">
                                <span className="text-sm md:text-base font-black">▼</span>
                                <span>-10%</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-emerald-600 font-extrabold text-xs md:text-sm animate-bounce shrink-0" style={{ animationDuration: '2.5s' }}>
                                <span className="text-sm md:text-base font-black">▲</span>
                                <span>+8%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Side by side: Top 3 diseases & Smart Recommendation Panel */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Top 3 Diseases to monitor now indicator */}
                        <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest block font-mono">
                              {lang === 'th' ? 'ดัชนีระบาดวิทยาประจำสภาวะ' : 'TOP 3 OUTBREAK TRENDS'}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight mt-1">
                              {lang === 'th' ? 'สามโรคอันตรายที่เฝ้าระวังขณะนี้' : 'Top 3 Diseases To Monitor Now'}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {lang === 'th' ? `ข้อมูลคัดกรองตาม: ${scenarioMode === 'Flood' ? 'ภัยพิบัติน้ำท่วม' : 'สภาวะควบคุมปกติ'}` : `Classified under: ${scenarioMode} condition`}
                            </p>
                          </div>

                          <div className="space-y-2 py-2">
                            {scenarioMode === 'Flood' ? (
                              <>
                                <div className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                                  <span className="text-xs font-bold text-rose-950">1. {lang === 'th' ? 'โรคฉี่หนู (Leptospirosis)' : 'Leptospirosis'}</span>
                                  <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Critical</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-lg border border-amber-100">
                                  <span className="text-xs font-bold text-amber-950">2. {lang === 'th' ? 'โรคอุจจาระร่วง (Diarrhea)' : 'Diarrhea'}</span>
                                  <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Moderate</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-200">
                                  <span className="text-xs font-bold text-slate-950">3. {lang === 'th' ? 'โรคผิวหนังอักเสบ (Skin Infections)' : 'Skin Infections'}</span>
                                  <span className="text-[9px] bg-slate-400 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Low</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                                  <span className="text-xs font-bold text-rose-950">1. {lang === 'th' ? 'ไข้เลือดออก (Dengue Fever)' : 'Dengue Fever'}</span>
                                  <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">High</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-200">
                                  <span className="text-xs font-bold text-slate-950">2. {lang === 'th' ? 'โรคไข้หวัดใหญ่ (Influenza)' : 'Influenza'}</span>
                                  <span className="text-[9px] bg-slate-400 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Low</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-200">
                                  <span className="text-xs font-bold text-slate-950">3. {lang === 'th' ? 'โรคอาหารเป็นพิษ (Food Poisoning)' : 'Food Poisoning'}</span>
                                  <span className="text-[9px] bg-slate-400 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">Low</span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span>{lang === 'th' ? 'ตรวจสอบสิทธิ์ลงพื้นที่ระบาด' : 'Municipal Control Measures'}</span>
                            <button onClick={() => setActiveSidebarTab('prevention')} className="text-blue-600 hover:underline">{lang === 'th' ? 'เปิดดูคู่มือ ➔' : 'View Guidelines ➔'}</button>
                          </div>
                        </div>

                        {/* Smart AI Recommendation Panel */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest block font-mono">
                                {lang === 'th' ? 'คำแนะนำสาธารณสุขเทศบาลยะลา' : 'EPIDEMIOLOGY CLINICAL RECOMMENDATIONS'}
                              </span>
                              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight mt-1">
                                {lang === 'th' ? 'คำแนะนำและแนวปฏิบัติตามสถานการณ์' : 'Smart Environmental Health Advice'}
                              </h3>
                            </div>
                            <span className="bg-blue-50 border border-blue-100 text-blue-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck size={10} strokeWidth={3} />
                              <span>Verified</span>
                            </span>
                          </div>

                          <div className="text-xs space-y-2 text-slate-700 leading-relaxed font-semibold">
                            {scenarioMode === 'Flood' ? (
                              <ul className="space-y-2 list-disc list-inside">
                                <li>
                                  <strong className="text-amber-900">{lang === 'th' ? 'งดเว้นการแช่น้ำย่ำโคลนด้วยเท้าเปล่า:' : 'Strictly avoid walking barefoot in mud:'}</strong>{' '}
                                  {lang === 'th' ? 'เชื้อแบคทีเรีย Leptospira สามารถอยู่ในโคลนเปียกได้นาน สวมรองเท้าบูททุกครั้ง' : 'Receding floods harbor high Leptospira bacteria concentration. Wear rubber boots.'}
                                </li>
                                <li>
                                  <strong className="text-rose-900">{lang === 'th' ? 'บริโภคน้ำต้มสุกบรรจุขวดเท่านั้น:' : 'Consume boiled or bottled water only:'}</strong>{' '}
                                  {lang === 'th' ? 'เนื่องด้วยระบบกรองน้ำใต้ดินอาจปนเปื้อนเชื้ออุจจาระร่วงหรืออหิวา เพื่อสุขภาพที่ถูกสุขลักษณะ' : 'Water lines are highly susceptible to fecal leakage during storms. Protect children.'}
                                </li>
                                <li>
                                  <strong className="text-slate-900">{lang === 'th' ? 'ล้างเท้าให้แห้งด้วยสบู่ทันที:' : 'Disinfect and dry feet immediately:'}</strong>{' '}
                                  {lang === 'th' ? 'หากเท้าเผลอไปแช่น้ำสิ่งปฏิกูล ให้ชะล้างด้วยน้ำเกลือหรือสบู่ยาทันที ป้องกันผิวหนังอักเสบเปื่อยแผล' : 'If water contact occurs, scrub with medicated soap immediately to prevent Athlete\'s foot.'}
                                </li>
                              </ul>
                            ) : (
                              <ul className="space-y-2 list-disc list-inside">
                                <li>
                                  <strong className="text-blue-900">{lang === 'th' ? 'กำจัดภาชนะแหล่งน้ำขังรอบบ้าน:' : 'Eliminate household water repositories:'}</strong>{' '}
                                  {lang === 'th' ? 'ยุงลายสวนและยุงลายบ้านมักเพาะพันธุ์ในโอ่ง แจกัน ดอกไม้ หรือจานรองกระถางที่ไม่มีการเททิ้งเปลี่ยนน้ำ' : 'Mosquito vectors breed in standing clean water. Clear saucers, tires, and jars weekly.'}
                                </li>
                                <li>
                                  <strong className="text-slate-900">{lang === 'th' ? 'ใช้ยากันยุงและนอนในมุ้ง:' : 'Use chemical repellents & sleep under nets:'}</strong>{' '}
                                  {lang === 'th' ? 'สำหรับผู้ป่วยกักตัวควรนอนในมุ้งอย่างเคร่งครัด เพื่อป้องกันยุงลายมาใกล้กัดส่งผ่านตัวเชื้อไวรัสเดงกีให้ครอบครัว' : 'Quarantined patients must sleep under netting to prevent secondary vector-host transmissions.'}
                                </li>
                                <li>
                                  <strong className="text-slate-900">{lang === 'th' ? 'รับประทานอาหารปรุงสุกร้อนๆ:' : 'Eat freshly cooked piping hot meals:'}</strong>{' '}
                                  {lang === 'th' ? 'ลดความรุนแรงของโรคติดต่อทางเดินอาหารและโรคอาหารเป็นพิษในช่วงฤดูแล้ง' : 'High summer temperatures spoil raw foods rapidly. Retain strict food sanitary hygiene.'}
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Map Spotlight Preview link card */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center space-x-2">
                            <Layers size={14} className="text-blue-600" />
                            <span>{lang === 'th' ? 'สปอตไลท์: แผนที่พิกัดระบาดทางภูมิศาสตร์ (GIS)' : 'Spotlight: Hotspots GIS Mapping Area'}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {lang === 'th' ? 'สกัดและจำกัดวงเขตการแพร่เชื้อตามพื้นที่ระบาดและรัศมีความแรงยุงลาย/ฉี่หนู' : 'Access circle-bound quarantine maps that trace contagiousness indicators around Sateng center'}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveSidebarTab('map')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-lg flex items-center space-x-1 transition cursor-pointer shrink-0"
                        >
                          <span>{lang === 'th' ? 'เปิดแผนที่เชิงลึก' : 'Launch GIS System'}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>

                      {/* Yala Municipal Geographical & General Information Card */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                          <Info className="text-blue-600 animate-pulse" size={16} />
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                              {lang === 'th' ? 'ข้อมูลภูมิศาสตร์และสถิติทั่วไป เทศบาลนครยะลา (อบจ. ยะลา)' : 'Yala Municipality Geographical & General Information'}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {lang === 'th' ? 'สถิติการวางผังเมือง โครงสร้างชุมชนพหุวัฒนธรรม และพิกัดเชิงพื้นที่' : 'Official municipal planning, population stats, and smart vision'}
                            </p>
                          </div>
                        </div>

                        {/* Vision Banner */}
                        <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
                          <div className="flex items-center gap-3">
                            <span className="text-xl shrink-0">🏛️</span>
                            <div>
                              <strong className="text-xs text-blue-950 block font-black">
                                {lang === 'th' ? 'วิสัยทัศน์การพัฒนาเทศบาลนครยะลา:' : 'Yala Municipal Vision:'}
                              </strong>
                              <span className="text-xs text-slate-700 font-bold italic">
                                {lang === 'th' ? '"ยะลา เมืองน่าอยู่ คู่สันติสุข มุ่งสู่เมืองอัจฉริยะ (Smart City)"' : '"Yala: Liveable City, Peaceful Coexistence, Towards Smart City"'}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-auto">
                            {lang === 'th' ? 'อบจ. ยะลา' : 'YALA PAO'}
                          </span>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Item 1: City Planning */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1.5">
                            <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-tight">
                              <span className="text-lg">🕸️</span>
                              <span>{lang === 'th' ? 'ผังเมืองใยแมงมุมอัจฉริยะ' : 'Spider-Web City Design'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              {lang === 'th' ? 'ผังเมืองยะลาถูกจัดวางอย่างเป็นระเบียบเรียบร้อยที่สุดในประเทศไทย เป็นรูปวงเวียนใยแมงมุมซ้อนกัน 3 ชั้น (Circular Web) สะดวกและแม่นยำอย่างยิ่งต่อการจัดวางระบบสารสนเทศภูมิศาสตร์ GIS และการจำกัดรัศมีความเสี่ยงโรคระบาด'
                                            : 'Renowned for having the best circular spider-web urban planning in Thailand. Divided into concentric zones centered around landmarks, which uniquely facilitates precise GIS analysis and epidemic perimeter controls.'}
                            </p>
                          </div>

                          {/* Item 2: Geographical Scale */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1.5">
                            <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-tight">
                              <span className="text-lg">🗺️</span>
                              <span>{lang === 'th' ? 'พื้นที่และการปกครอง' : 'Geographical Scale & Boundaries'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              {lang === 'th' ? 'ครอบคลุมพื้นที่ตำบลสะเตง อำเภอเมืองยะลา ขนาดประมาณ 19.0 ตารางกิโลเมตร (11,875 ไร่) แบ่งการดูแลออกเป็นชุมชนย่อยทั้งหมดกว่า 40 ชุมชน เพื่อประเมินดัชนีสุขอนามัยชุมชนสะเตงนอก ชุมชนท่าสาป และชุมชนสะเตงกลางอย่างทั่วถึง'
                                            : 'Encompasses 19.0 square kilometers (approx. 11,875 Rai) under Sateng subdistrict, divided into over 40 distinct sub-communities. This spatial resolution aids Yala health officers in conducting targeted checks for Sateng Nok and Tha Sap.'}
                            </p>
                          </div>

                          {/* Item 3: Demographics */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1.5">
                            <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-tight">
                              <span className="text-lg">👥</span>
                              <span>{lang === 'th' ? 'ประชากรและพหุวัฒนธรรม' : 'Multicultural Demographics'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              {lang === 'th' ? 'มีประชากรจดทะเบียนหนาแน่นกว่า 60,000 ถึง 76,000 คน อาศัยอยู่ร่วมกันอย่างสันติสุขภายใต้สังคมพหุวัฒนธรรมอย่างงดงาม (ไทยพุทธ, ไทยมุสลิม, และไทยเชื้อสายจีน) เป็นสังคมเมืองน่าอยู่ที่เป็นแบบอย่างของการช่วยเหลือเกื้อกูล'
                                            : 'Home to more than 60,000 - 76,000 registered residents living in harmony under a rich multicultural tapestry of Thai Buddhists, Thai Muslims, and Thai-Chinese lineages, acting as a model for inclusive civic care.'}
                            </p>
                          </div>

                          {/* Item 4: Sanitary Partnerships */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1.5">
                            <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-tight">
                              <span className="text-lg">🛡️</span>
                              <span>{lang === 'th' ? 'ความสอดประสานทางสาธารณสุข' : 'Smart Sanitary Integration'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              {lang === 'th' ? 'องค์การบริหารส่วนจังหวัดยะลา และ สำนักสาธารณสุขและสิ่งแวดล้อม เทศบาลนครยะลา ร่วมกันบริหารคลังความรู้ ดัชนีสุขอนามัย และระบบแจ้งเตือนภัยน้ำท่วม/ภัยพิบัติโรคระบาดประจำถิ่น (ไข้เลือดออก, โรคมือเท้าปาก, โรคฉี่หนู) อย่างใกล้ชิด'
                                            : 'Yala PAO and the Municipal Division of Public Health & Environment work closely to host integrated cloud databases, flood water surveillance systems, and seasonal epidemic alert networks to safeguard civilian lives.'}
                            </p>
                          </div>

                        </div>
                      </div>

                    </div>
                  );

                // TAB 2: INTERACTIVE MAP VIEW (Google maps & Vector radar)
                case 'map':
                  return (
                    <div className="w-full h-full relative animate-fade-in">
                      <MapSystem 
                        cases={cases}
                        role={role}
                        lang={lang}
                        onSelectCase={handleSelectCase}
                        selectedCaseId={selectedCaseId}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </div>
                  );

                // TAB 3: STATISTICS VIEW
                case 'statistics':
                  return (
                    <div className="space-y-6 animate-fade-in">
                      <StatsDashboard 
                        cases={cases}
                        lang={lang}
                        selectedDisease={selectedDisease}
                        onDiseaseSelect={setSelectedDisease}
                        timeFilter={timeFilter}
                        onTimeFilterChange={setTimeFilter}
                        customStartDate={customStartDate}
                        onCustomStartDateChange={setCustomStartDate}
                        customEndDate={customEndDate}
                        onCustomEndDateChange={setCustomEndDate}
                        scenarioMode={scenarioMode}
                      />
                    </div>
                  );

                // TAB 5: PREVENTION GUIDES VIEW (Now includes merged disease_intel content)
                case 'prevention':
                  return (
                    <div className="space-y-6 animate-fade-in">
                      <PreventionGuides lang={lang} />
                    </div>
                  );

                // TAB 6: CASE MANAGEMENT VIEW (Officials Authorized only)
                case 'cases':
                  return (
                    <div className="space-y-6 animate-fade-in" id="official_ledger_panel">
                      <CaseManagement 
                        cases={cases}
                        lang={lang}
                        onStatusUpdate={handleStatusUpdate}
                        onSelectCase={handleSelectCase}
                        selectedCaseId={selectedCaseId}
                      />
                    </div>
                  );

                default:
                  return null;
              }
            })()
          )}

        </main>

        {/* MUNICIPAL FOOTER */}
        {activeSidebarTab !== 'map' && (
          <footer className="bg-white border-t border-slate-200 py-3 text-center text-[10px] text-slate-500 mt-auto" id="app_footer">
            <div className="max-w-7xl mx-auto px-6 space-y-1">
              <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px]">
                © {new Date().getFullYear()} {lang === 'th' ? 'เทศบาลนครยะลา. สงวนลิขสิทธิ์ทั้งหมด' : 'Yala Municipality. All rights reserved.'}
              </p>
              <p className="text-[9px] text-slate-400 leading-relaxed max-w-xl mx-auto font-semibold">
                {lang === 'th' 
                  ? 'ระบบข้อมูลสารสนเทศภูมิศาสตร์นี้ให้บริการเพื่อความปลอดภัยและสุขลักษณะของเทศบาลนครยะลา ข้อมูลรายงานตนทั้งหมดได้รับการดูแลและรักษาความปลอดภัยภายใต้ระเบียบราชการสาธารณสุขยะลาอย่างเคร่งครัด'
                  : 'This monitoring system serves as the official sanitary portal. Webhook data received via the municipal report chatbot is classified and processed under compliance with the Yala Municipal Public Health Ordinance.'}
              </p>
            </div>
          </footer>
        )}

      </div>

      {/* Walkthrough Tutorial Dialog Overlay */}
      {showTutorial && (
        <UserTutorial 
          lang={lang} 
          onClose={() => setShowTutorial(false)} 
        />
      )}

    </div>
  );
}
