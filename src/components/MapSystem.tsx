import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Shield, Map as MapIcon, Layers, ShieldCheck, EyeOff, 
  Info, User, Phone, CheckCircle, RefreshCw, ChevronUp, ChevronDown, 
  Calendar, AlertCircle, FileText, Lock, Plus, Minus, Move, Compass, Locate
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Case, CaseStatus } from '../types';

// Retrieve Google Maps Platform Key from variables safely
const getApiKey = () => {
  try {
    return (
      process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      ''
    );
  } catch (e) {
    return (
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      ''
    );
  }
};

const API_KEY = getApiKey();
const isKeyProbablyValid = (key: string) => {
  const trimmed = (key || '').trim();
  return trimmed.startsWith('AIzaSy') && trimmed.length >= 35;
};
const hasValidKey = isKeyProbablyValid(API_KEY);

// Dark map styles matching Yala's "Cosmic Slate Theme"
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#070a13" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#070a13" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0ea5e9" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f8fafc" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0284c7" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0284c7" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#070a13" }],
  },
];

interface MapSystemProps {
  cases: Case[];
  role: 'public' | 'official';
  lang: 'th' | 'en';
  onSelectCase?: (c: Case) => void;
  selectedCaseId?: string | null;
  onStatusUpdate?: (
    id: string,
    newStatus?: CaseStatus,
    newDisease?: string,
    newPriority?: string,
    personalInfo?: any,
    clinicalInfo?: any
  ) => Promise<void>;
}

// Controller component to center and zoom map programmatically
function MapController({ 
  center, 
  zoom 
}: { 
  center: google.maps.LatLngLiteral | null; 
  zoom: number; 
}) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

// Custom Circle component to draw real outbreak circles and current location halo
function MapCircle({ 
  center, 
  radius, 
  strokeColor, 
  fillColor,
  fillOpacity = 0.15,
  strokeWeight = 1.5
}: {
  center: google.maps.LatLngLiteral;
  radius: number;
  strokeColor?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeWeight?: number;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: strokeColor || '#0ea5e9',
      strokeOpacity: 0.8,
      strokeWeight: strokeWeight,
      fillColor: fillColor || '#0ea5e9',
      fillOpacity: fillOpacity,
    });

    circleRef.current = circle;

    return () => {
      circle.setMap(null);
    };
  }, [map, center, radius, strokeColor, fillColor, fillOpacity, strokeWeight]);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
    }
  }, [center, radius]);

  return null;
}

export default function MapSystem({
  cases,
  role,
  lang,
  onSelectCase,
  selectedCaseId,
  onStatusUpdate
}: MapSystemProps) {
  const [selectedPin, setSelectedPin] = useState<Case | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Map parameters
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 6.5411, lng: 101.2804 });
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [draggablePin, setDraggablePin] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (locationErrorMsg) {
      const t = setTimeout(() => setLocationErrorMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [locationErrorMsg]);

  // Disease Filter State
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState<string>('all');

  // Official Case Filter (เฉพาะที่ยังไม่เสร็จ, แต่ไอคอนสีเขียว, แบบผสม)
  const [officialCaseFilter, setOfficialCaseFilter] = useState<'active' | 'completed' | 'mixed'>('active');

  // Active Map Mode (Public vs Official)
  const [activeMapRole, setActiveMapRole] = useState<'public' | 'official'>(role);

  useEffect(() => {
    setActiveMapRole(role);
  }, [role]);

  // Sync selection
  useEffect(() => {
    if (selectedCaseId) {
      const activeCase = cases.find(c => c.id === selectedCaseId);
      if (activeCase) {
        setSelectedPin(activeCase);
        setMapCenter({ lat: activeCase.gps.lat, lng: activeCase.gps.lng });
        setMapZoom(16);
      }
    }
  }, [selectedCaseId, cases]);

  // Request browser location
  const requestLocation = () => {
    setLocationStatus('loading');
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationErrorMsg(lang === 'th' ? 'เบราว์เซอร์ของคุณไม่สนับสนุนการระบุตำแหน่งผ่าน GPS' : 'Your browser does not support GPS location.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setDraggablePin(coords);
        setMapCenter(coords);
        setMapZoom(17); // Zoom levels (16-18)
        setLocationStatus('success');
      },
      (error) => {
        console.warn("Location fetch status info:", error.message);
        setLocationStatus('error');
        setLocationErrorMsg(lang === 'th' ? 'กรุณาอนุญาตสิทธิ์เข้าถึงพิกัด หรือระบบไม่สามารถระบุพิกัดได้ (ใช้พิกัดเริ่มต้น ยะลา)' : 'Please grant location access or enable GPS (using default Yala coordinates).');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Trigger automatically on component load
  useEffect(() => {
    requestLocation();
  }, []);

  const handleMapClick = (e: any) => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (e.detail?.latLng) {
      lat = e.detail.latLng.lat;
      lng = e.detail.latLng.lng;
    } else if (e.latLng) {
      lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
    }

    if (lat !== undefined && lng !== undefined) {
      setDraggablePin({ lat, lng });
    }
  };

  const handleStatusChange = async (id: string, newStatus: CaseStatus) => {
    setActionLoading(`${id}_${newStatus}`);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(id, newStatus);
        if (selectedPin && selectedPin.id === id) {
          setSelectedPin(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter cases by dropdown selection
  const filteredCases = cases.filter(c => {
    if (selectedDiseaseFilter === 'all') return true;
    const normFilter = selectedDiseaseFilter.toLowerCase();
    const normDisease = c.disease.toLowerCase();

    if (normFilter === 'dengue' && (normDisease.includes('dengue') || normDisease.includes('ไข้เลือดออก'))) return true;
    if (normFilter === 'covid' && (normDisease.includes('covid') || normDisease.includes('โควิด'))) return true;
    if (normFilter === 'mouth' && (normDisease.includes('mouth') || normDisease.includes('มือ เท้า ปาก'))) return true;
    if (normFilter === 'flu' && (normDisease.includes('flu') || normDisease.includes('ไข้หวัดใหญ่') || normDisease.includes('influenza'))) return true;
    if (normFilter === 'leptospirosis' && (normDisease.includes('leptospirosis') || normDisease.includes('ฉี่หนู'))) return true;
    if (normFilter === 'diarrhea' && (normDisease.includes('diarrhea') || normDisease.includes('อุจจาระร่วง') || normDisease.includes('ท้องร่วง'))) return true;
    if (normFilter === 'skin' && (normDisease.includes('skin') || normDisease.includes('น้ำกัดเท้า') || normDisease.includes('ผิวหนัง'))) return true;
    if (normFilter === 'cholera' && (normDisease.includes('cholera') || normDisease.includes('อหิวา'))) return true;

    return false;
  });

  // Filter display cases depending on Public/Official view and selected filter
  const getDisplayCases = () => {
    if (activeMapRole === 'public') {
      // Public view: NEVER show Completed cases
      return filteredCases.filter(c => c.status !== 'Completed');
    } else {
      // Official view: support state filter
      if (officialCaseFilter === 'active') {
        return filteredCases.filter(c => c.status !== 'Completed');
      } else if (officialCaseFilter === 'completed') {
        return filteredCases.filter(c => c.status === 'Completed');
      } else {
        return filteredCases; // mixed / all
      }
    }
  };

  const displayCases = getDisplayCases();

  // Safe translations helpers
  const translateDisease = (d: string) => {
    const norm = d.toLowerCase();
    if (norm.includes('dengue') || norm.includes('ไข้เลือดออก')) {
      return lang === 'th' ? 'โรคไข้เลือดออก' : 'Dengue Fever';
    }
    if (norm.includes('covid') || norm.includes('โควิด')) {
      return lang === 'th' ? 'โรคโควิด-19' : 'COVID-19';
    }
    if (norm.includes('mouth') || norm.includes('มือ เท้า ปาก')) {
      return lang === 'th' ? 'โรคมือ เท้า ปาก' : 'Hand, Foot, & Mouth';
    }
    if (norm.includes('flu') || norm.includes('ไข้หวัดใหญ่') || norm.includes('influenza')) {
      return lang === 'th' ? 'โรคไข้หวัดใหญ่' : 'Influenza';
    }
    if (norm.includes('leptospirosis') || norm.includes('ฉี่หนู')) {
      return lang === 'th' ? 'โรคฉี่หนู' : 'Leptospirosis';
    }
    if (norm.includes('cholera') || norm.includes('อหิวา')) {
      return lang === 'th' ? 'โรคอหิวาตกโรค' : 'Cholera';
    }
    if (norm.includes('diarrhea') || norm.includes('อุจจาระร่วง') || norm.includes('ท้องร่วง')) {
      return lang === 'th' ? 'โรคอุจจาระร่วงเฉียบพลัน' : 'Diarrhea';
    }
    if (norm.includes('skin') || norm.includes('น้ำกัดเท้า') || norm.includes('ผิวหนัง')) {
      return lang === 'th' ? 'โรคผิวหนังและน้ำกัดเท้า' : 'Skin Infections';
    }
    return d;
  };

  const translateStatus = (s: CaseStatus) => {
    if (s === 'New') return lang === 'th' ? 'รายงานใหม่' : 'New Intake';
    if (s === 'Accepted') return lang === 'th' ? 'รับกักตัวแล้ว' : 'Quarantined';
    if (s === 'Waiting') return lang === 'th' ? 'รอผลตรวจ' : 'Waiting Test';
    return lang === 'th' ? 'เสร็จสิ้นภารกิจ' : 'Completed';
  };

  const getSeverityLabel = (sev: string) => {
    if (sev === 'high') return lang === 'th' ? 'เสี่ยงสูง (สีแดง)' : 'High Risk (Red)';
    if (sev === 'medium') return lang === 'th' ? 'เสี่ยงปานกลาง (สีเหลือง)' : 'Medium Risk (Yellow)';
    return lang === 'th' ? 'เฝ้าระวัง (สีเขียว)' : 'Low Risk (Green)';
  };

  // If Google Maps key is missing or invalid, render a beautiful setup card
  if (!hasValidKey) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-950 p-6 text-slate-100" id="maps_key_required_splash">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-800">
            <MapIcon size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              {lang === 'th' ? 'จำเป็นต้องระบุคีย์ Google Maps API' : 'Google Maps API Key Required'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              {lang === 'th' 
                ? 'เพื่อใช้งานระบบแผนที่พิกัดระบาดทางภูมิศาสตร์ (GIS) จริง กรุณาตั้งค่าคีย์ API ตามขั้นตอนด้านล่าง:'
                : 'To run real geographic maps with location permission, please add your Google Maps API key:'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-[11px] leading-relaxed space-y-3 font-semibold text-slate-300">
            <p><strong>ขั้นตอนที่ 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">รับสิทธิ์ใช้งาน API Key ที่นี่ ➔</a></p>
            <p><strong>ขั้นตอนที่ 2:</strong> นำคีย์มาป้อนใน Secrets ของแอป:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>เปิดเมนูตั้งค่าแอป (ไอคอนรูปฟันเฟือง ⚙️ มุมขวาบนสุด)</li>
              <li>เลือกหัวข้อ <strong>Secrets</strong></li>
              <li>สร้างค่าใหม่ชื่อ <code>GOOGLE_MAPS_PLATFORM_KEY</code> แล้วบันทึก</li>
            </ul>
          </div>

          <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest pt-2">
            {lang === 'th' ? 'แอปพลิเคชันจะอัปเดตอัตโนมัติเมื่อตรวจพบการบันทึกสำเร็จ' : 'App builds automatically on secret setup'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100" id="map_system_fullbleed">
      
      {/* Top Controls Overlay */}
      <div className="flex flex-col md:flex-row border-b border-slate-800 bg-slate-900/95 backdrop-blur-md p-2.5 px-3.5 gap-2.5 justify-between items-stretch md:items-center z-10 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shrink-0">
            <MapIcon size={14} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-tight">
              <span className="hidden sm:inline">{lang === 'th' ? 'ระบบภูมิสารสนเทศภัยพิบัติและโรคระบาด Google Maps GIS' : 'Google Maps GIS Epidemic Disaster Portal'}</span>
              <span className="sm:hidden inline">{lang === 'th' ? 'แผนที่ GIS ยะลา' : 'Yala GIS Map'}</span>
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider hidden lg:block">
              {lang === 'th' ? 'ระบุพิกัด GPS เฝ้าระวังเรียลไทม์ และจำลองรัศมีรั้วความคลาดเคลื่อน' : 'Interactive Map, dynamic outbreak circles, and localized reporting tools'}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Disease Selector Dropdown (เลื่อนขึ้นเลื่อนลง) */}
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {lang === 'th' ? 'เลือกดูเฉพาะโรค:' : 'Filter Disease:'}
            </span>
            <select
              value={selectedDiseaseFilter}
              onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-black uppercase outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900">{lang === 'th' ? 'ทั้งหมด (All)' : 'All Diseases'}</option>
              <option value="dengue" className="bg-slate-900">{lang === 'th' ? 'โรคไข้เลือดออก' : 'Dengue Fever'}</option>
              <option value="covid" className="bg-slate-900">{lang === 'th' ? 'โรคโควิด-19' : 'COVID-19'}</option>
              <option value="mouth" className="bg-slate-900">{lang === 'th' ? 'โรคมือ เท้า ปาก' : 'Hand, Foot, & Mouth'}</option>
              <option value="flu" className="bg-slate-900">{lang === 'th' ? 'โรคไข้หวัดใหญ่' : 'Influenza'}</option>
              <option value="leptospirosis" className="bg-slate-900">{lang === 'th' ? 'โรคฉี่หนู' : 'Leptospirosis'}</option>
              <option value="diarrhea" className="bg-slate-900">{lang === 'th' ? 'โรคอุจจาระร่วงเฉียบพลัน' : 'Diarrhea'}</option>
              <option value="skin" className="bg-slate-900">{lang === 'th' ? 'โรคผิวหนังและน้ำกัดเท้า' : 'Skin Infections'}</option>
              <option value="cholera" className="bg-slate-900">{lang === 'th' ? 'โรคอหิวาตกโรค' : 'Cholera'}</option>
            </select>
          </div>

          {/* Official Status filter selector (เลื่อนขึ้นเลื่อนลง) */}
          {activeMapRole === 'official' && (
            <div className="flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
                {lang === 'th' ? 'กรองสถานะ:' : 'Task Filter:'}
              </span>
              <select
                value={officialCaseFilter}
                onChange={(e) => setOfficialCaseFilter(e.target.value as any)}
                className="bg-transparent text-xs text-emerald-300 font-black uppercase outline-none cursor-pointer pr-1"
              >
                <option value="active" className="bg-slate-900 text-slate-100">{lang === 'th' ? 'เฉพาะที่ยังไม่เสร็จ' : 'Uncompleted Only'}</option>
                <option value="completed" className="bg-slate-900 text-emerald-400">{lang === 'th' ? 'เฉพาะประวัติเสร็จสิ้น (สีเขียว)' : 'Completed History (Green)'}</option>
                <option value="mixed" className="bg-slate-900 text-slate-100">{lang === 'th' ? 'แบบผสมทั้งหมด' : 'Mixed / All'}</option>
              </select>
            </div>
          )}

          {/* Map Role Switcher */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveMapRole('public')}
              type="button"
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                activeMapRole === 'public'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff size={11} />
              <span>{lang === 'th' ? 'ประชาชน' : 'Public'}</span>
            </button>
            <button
              onClick={() => setActiveMapRole('official')}
              type="button"
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                activeMapRole === 'official'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={11} />
              <span>{lang === 'th' ? 'เจ้าหน้าที่' : 'Official'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Google Maps Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden" id="google_maps_canvas_container">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={mapCenter}
            defaultZoom={mapZoom}
            mapId="DEMO_MAP_ID"
            onClick={handleMapClick}
            options={{
              styles: darkMapStyles,
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
            }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Dynamic centering controller */}
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Outbreak circles and case markers */}
            {displayCases.map((c) => {
              const position = { lat: c.gps.lat, lng: c.gps.lng };
              const isSelected = selectedPin?.id === c.id;

              // Radius size based on disease transmission
              const diseaseLower = c.disease.toLowerCase();
              let radiusSize = 250; // meters
              if (diseaseLower.includes('dengue') || diseaseLower.includes('ไข้เลือดออก')) radiusSize = 350;
              else if (diseaseLower.includes('covid') || diseaseLower.includes('โควิด')) radiusSize = 500;
              else if (diseaseLower.includes('mouth') || diseaseLower.includes('มือ เท้า ปาก')) radiusSize = 200;
              else if (diseaseLower.includes('flu') || diseaseLower.includes('ไข้หวัดใหญ่')) radiusSize = 400;
              else if (diseaseLower.includes('leptospirosis') || diseaseLower.includes('ฉี่หนู')) radiusSize = 650;
              else if (diseaseLower.includes('cholera') || diseaseLower.includes('อหิวา')) radiusSize = 500;

              // Color mapping - completed is always green icon
              const color = 
                c.status === 'Completed' ? '#10b981' :
                c.severity === 'high' ? '#ef4444' : 
                c.severity === 'medium' ? '#eab308' : 
                '#3b82f6';

              return (
                <React.Fragment key={`case_group_${c.id}`}>
                  {/* Real epidemiological circle overlay */}
                  <MapCircle 
                    center={position} 
                    radius={radiusSize} 
                    strokeColor={color} 
                    fillColor={color} 
                  />

                  {/* Marker Pin */}
                  <AdvancedMarker
                    position={position}
                    onClick={() => {
                      setSelectedPin(c);
                      if (onSelectCase) onSelectCase(c);
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Concentric Water Wave Ripples radiating outwards */}
                      {c.status !== 'Completed' && (
                        <div className="absolute flex items-center justify-center pointer-events-none" style={{ width: '180px', height: '180px' }}>
                          <span className="absolute inline-flex h-16 w-16 rounded-full opacity-60 animate-water-wave-1" style={{ backgroundColor: color }} />
                          <span className="absolute inline-flex h-16 w-16 rounded-full opacity-40 animate-water-wave-2" style={{ backgroundColor: color }} />
                          <span className="absolute inline-flex h-16 w-16 rounded-full opacity-20 animate-water-wave-3" style={{ backgroundColor: color }} />
                        </div>
                      )}

                      <Pin 
                        background={color} 
                        borderColor="#ffffff" 
                        glyphColor="#ffffff"
                        scale={isSelected ? 1.3 : 1.0}
                      />
                    </div>
                  </AdvancedMarker>
                </React.Fragment>
              );
            })}

            {/* Current user location marker and circle accuracy halo */}
            {userLocation && (
              <>
                <MapCircle 
                  center={userLocation} 
                  radius={50} 
                  strokeColor="#3b82f6" 
                  fillColor="#3b82f6" 
                  fillOpacity={0.12}
                  strokeWeight={2}
                />
                <AdvancedMarker position={userLocation}>
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
                  </div>
                </AdvancedMarker>
              </>
            )}

            {/* Locked marker placed by user touch/click */}
            {draggablePin && (
              <AdvancedMarker
                position={draggablePin}
                draggable={false}
              >
                <Pin background="#3b82f6" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2}>
                  📍
                </Pin>
              </AdvancedMarker>
            )}

          </Map>
        </APIProvider>

        {/* Custom Zoom & Location controls overlay */}
        <div className="absolute bottom-5 right-5 flex flex-col space-y-2 z-10">
          <button
            onClick={() => setMapZoom(z => Math.min(z + 1, 20))}
            className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition shadow-2xl"
            title="Zoom In"
            type="button"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setMapZoom(z => Math.max(z - 1, 5))}
            className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition shadow-2xl"
            title="Zoom Out"
            type="button"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={requestLocation}
            className={`w-10 h-10 border text-white rounded-xl flex items-center justify-center cursor-pointer transition shadow-2xl ${
              locationStatus === 'loading' 
                ? 'bg-blue-600 border-blue-500 animate-pulse' 
                : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
            }`}
            title="My Location"
            type="button"
          >
            <Locate size={18} className={locationStatus === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tap instructions box - Minimized & Compact */}
        <div className="absolute top-4 left-4 max-w-[210px] bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2 rounded-lg shadow-2xl z-10 flex flex-col space-y-1">
          <div className="flex items-center space-x-1 text-[10px] font-black text-slate-100">
            <Compass className="text-blue-500" size={11} />
            <span>{lang === 'th' ? 'ปักหมุดจุดเฝ้าระวัง' : 'Surveillance Pinning'}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-semibold leading-snug">
            {lang === 'th'
              ? 'คลิกบนแผนที่ หรือลากหมุดน้ำเงิน (📍)'
              : 'Tap map, or drag blue pin (📍)'}
          </p>
          {draggablePin && (
            <div className="bg-slate-950 px-1.5 py-1 rounded border border-slate-850 flex items-center justify-between text-[9px] font-mono text-cyan-400 font-bold">
              <span>GPS: {draggablePin.lat.toFixed(4)}, {draggablePin.lng.toFixed(4)}</span>
            </div>
          )}
        </div>

        {locationErrorMsg && (
          <div className="absolute top-26 left-4 max-w-[210px] bg-red-950/95 backdrop-blur-md border border-red-900/50 p-2 rounded-lg shadow-2xl z-10 flex flex-col space-y-1 animate-bounce">
            <div className="flex items-center space-x-1 text-[10px] font-black text-red-200">
              <span>⚠️</span>
              <span>{lang === 'th' ? 'พิกัดทางภูมิศาสตร์' : 'Geographical GPS'}</span>
            </div>
            <p className="text-[9px] text-red-300 font-bold leading-snug">
              {locationErrorMsg}
            </p>
          </div>
        )}

        {/* Map Legend Overlay with colored pins description */}
        <div className="absolute bottom-18 left-5 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-col space-y-1.5 shadow-2xl max-w-[210px] z-10 text-[10px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang === 'th' ? 'คำอธิบายระดับสีความเสี่ยง' : 'MAP LEGEND'}</span>
          <div className="space-y-1 font-semibold text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0 shadow-xs" />
              <span>{lang === 'th' ? 'สีแดง: อันตรายสูง (High)' : 'Red: High Risk'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shrink-0 shadow-xs" />
              <span>{lang === 'th' ? 'สีเหลือง: ปานกลาง (Medium)' : 'Yellow: Medium Risk'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-xs" />
              <span>{lang === 'th' ? 'สีน้ำเงิน: เฝ้าระวังต่ำ (Low)' : 'Blue: Low Risk'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-xs" />
              <span>{lang === 'th' ? 'สีเขียว: เคลียร์เสร็จสิ้น (Done)' : 'Green: Done/Completed'}</span>
            </div>
          </div>
        </div>

        {/* Floating surveillance stats indicator */}
        <div className="absolute bottom-5 left-5 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl flex items-center space-x-3 text-[10px] text-slate-300 font-bold tracking-wider uppercase font-mono shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>
            {lang === 'th' 
              ? `พบบริเวณเฝ้าระวัง ${filteredCases.length} จุด (กรองแล้ว)` 
              : `DETECTING ${filteredCases.length} ACTIVE SITES`}
          </span>
        </div>
      </div>

      {/* Case Context detail panel (when a pin is selected) */}
      {selectedPin && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 animate-fade-in shrink-0 text-slate-300 relative" id="map_node_details_panel">
          {/* Close button placed at the top-right of the box */}
          <button
            onClick={() => setSelectedPin(null)}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border border-slate-700 z-10"
            type="button"
          >
            <span>{lang === 'th' ? '✕ ปิดแผงข้อมูล' : '✕ Close'}</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pr-24">
            
            {/* Left side info */}
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  selectedPin.severity === 'high' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                  selectedPin.severity === 'medium' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                  'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  {translateDisease(selectedPin.disease)}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-black px-2 py-1 rounded-md uppercase tracking-wider font-mono">
                  {getSeverityLabel(selectedPin.severity)}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
                  GPS: {selectedPin.gps.lat.toFixed(5)}, {selectedPin.gps.lng.toFixed(5)} ({selectedPin.areaName})
                </span>
              </div>

              {activeMapRole === 'official' ? (
                /* OFFICIAL VIEW: Show Personal Info & Ingestion Data (LINE Chatbot details) */
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="font-extrabold text-slate-100 flex items-center space-x-2 text-xs uppercase tracking-tight pt-1">
                    <User size={14} className="text-blue-400" />
                    <span>
                      {lang === 'th' ? `ประวัติผู้ป่วยพิกัดระบาดวิทยา` : `Epidemiological Patient Profile`}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
                    <div className="space-y-1.5 text-slate-300">
                      <div className="font-extrabold text-blue-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <User size={12} />
                        <span>{lang === 'th' ? 'ข้อมูลส่วนบุคคลของผู้ป่วย' : 'Demographics Profile'}</span>
                      </div>
                      <div><strong>{lang === 'th' ? 'ชื่อ-นามสกุล:' : 'Full Name:'}</strong> {selectedPin.personalInfo?.name || 'N/A'}</div>
                      <div><strong>{lang === 'th' ? 'อายุ:' : 'Age:'}</strong> {selectedPin.personalInfo?.age || 'N/A'} {lang === 'th' ? 'ปี' : 'years old'}</div>
                      <div><strong>{lang === 'th' ? 'เพศ:' : 'Gender:'}</strong> {selectedPin.personalInfo?.gender === 'Male' ? (lang === 'th' ? 'ชาย' : 'Male') : (lang === 'th' ? 'หญิง' : 'Female')}</div>
                      <div><strong>{lang === 'th' ? 'เบอร์ติดต่อ:' : 'Phone Contact:'}</strong> {selectedPin.personalInfo?.phone || 'N/A'}</div>
                      <div><strong>{lang === 'th' ? 'ความต้องการช่วยเหลือ:' : 'Special Demands:'}</strong> {selectedPin.personalInfo?.demands || (lang === 'th' ? 'ไม่มีความต้องการพิเศษ' : 'None')}</div>
                    </div>

                    <div className="space-y-1.5 text-slate-300">
                      <div className="font-extrabold text-rose-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <FileText size={12} />
                        <span>{lang === 'th' ? 'ข้อมูลทางคลินิกและการสัมผัสโรค' : 'Clinical Diagnosis'}</span>
                      </div>
                      <div><strong>{lang === 'th' ? 'อาการสำคัญ:' : 'Chief Symptoms:'}</strong> {selectedPin.clinicalInfo?.symptoms?.join(', ') || '-'}</div>
                      <div><strong>{lang === 'th' ? 'จำนวนวันป่วย:' : 'Duration of Illness:'}</strong> {selectedPin.clinicalInfo?.days || '3'} {lang === 'th' ? 'วัน' : 'days'}</div>
                      <div><strong>{lang === 'th' ? 'ประวัติสัมผัสโรค/สถานที่:' : 'Contact History:'}</strong> {selectedPin.clinicalInfo?.contactHistory || '-'}</div>
                      <div><strong>{lang === 'th' ? 'ระดับความด่วน:' : 'Clinical Urgency:'}</strong> <span className="text-rose-400 font-bold uppercase">{selectedPin.priority || 'NORMAL'}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* PUBLIC VIEW: All identification data (PII) is completely hidden. Tells how many people and color risk */
                <div className="space-y-2">
                  <div className="p-2.5 px-3 bg-blue-950/40 border border-blue-900/40 rounded-lg max-w-xl text-slate-300 flex items-start gap-2">
                    <ShieldCheck size={12} className="flex-shrink-0 text-blue-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-blue-200 font-extrabold uppercase tracking-wider">
                        {lang === 'th' ? 'ประกาศมาตรการความปลอดภัยข้อมูลสุขภาพบุคคล (PDPA)' : 'Confidential Sanitary Compliance (PDPA)'}
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                        {lang === 'th' 
                          ? 'เทศบาลนครยะลาได้ปิดบังชื่อ เบอร์โทร และรายละเอียดระบุตัวตนจริงของผู้ป่วยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล แผนที่เฝ้าระวังนี้แสดงเพียงรัศมีความเสี่ยงเพื่อการเฝ้าระวังภัยพิบัติเท่านั้น' 
                          : 'To protect personal privacy (PDPA), all names and telephone details are strictly anonymized. Outbreak bounds are shown purely for dynamic health warning.'}
                      </p>
                    </div>
                  </div>

                  {/* Displaying general counts only: "สีอะไร กี่คน" */}
                  <div className="grid grid-cols-2 gap-3 max-w-md pt-1 text-slate-200">
                    <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{lang === 'th' ? 'ระดับความเสี่ยง' : 'Risk Index'}</span>
                      <span className="text-xs font-black flex items-center gap-1.5 mt-1">
                        <span className={`w-3 h-3 rounded-full ${selectedPin.severity === 'high' ? 'bg-red-500' : selectedPin.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        {getSeverityLabel(selectedPin.severity)}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{lang === 'th' ? 'จำนวนผู้ติดโรคพิกัดนี้' : 'Active Cases Count'}</span>
                      <span className="text-sm font-black text-slate-100 mt-1 block">
                        1 {lang === 'th' ? 'ราย' : 'active case'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Case Workflow Actions (Officials Only) */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0 self-stretch justify-between">
              {activeMapRole === 'official' && onStatusUpdate ? (
                <div className="space-y-2 text-right">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">
                    {lang === 'th' ? 'เครื่องมืออัพเดทสถานะกักกันผู้ป่วย (Official Controls):' : 'Official Containment Workflow:'}
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Status Badge */}
                    <span className="text-[10px] bg-slate-800 text-slate-200 font-mono font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {translateStatus(selectedPin.status)}
                    </span>

                    {/* Step 1: Accept / Quarantine */}
                    {selectedPin.status === 'New' && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Accepted')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Accepted` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'รับกักกันโรค' : 'Admit & Quarantine'}</span>
                        )}
                      </button>
                    )}

                    {/* Step 2: Wait results */}
                    {(selectedPin.status === 'New' || selectedPin.status === 'Accepted') && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Waiting')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Waiting` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'รอผลตรวจ' : 'Await Test Results'}</span>
                        )}
                      </button>
                    )}

                    {/* Step 3: Complete / Archive */}
                    {selectedPin.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Completed')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-green-600 hover:bg-green-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Completed` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'พ้นระยะโรคแล้ว' : 'Complete Mission'}</span>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedPin.status === 'Completed' && (
                    <p className="text-[10px] text-green-400 font-extrabold italic mt-1 bg-green-950/40 border border-green-900/60 p-2 rounded">
                      {lang === 'th' ? '✓ บันทึกเคสผู้ป่วยนี้พ้นระยะติดต่อและเก็บสถิติเรียบร้อย' 
                                    : '✓ Case compiled and closed in GIS system.'}
                    </p>
                  )}
                </div>
              ) : (
                activeMapRole === 'official' && (
                  <div className="text-[10px] text-slate-500 font-bold bg-slate-800 p-2 rounded">
                    {lang === 'th' ? 'ติดต่อแอดมินสาธารณสุขเพื่อปรับปรุงสถานะ' : 'Updates managed via Municipal Admins'}
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
