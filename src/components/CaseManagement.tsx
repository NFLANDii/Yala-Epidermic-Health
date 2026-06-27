import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, User, Phone, Calendar, Clock,
  ChevronRight, AlertCircle, CheckCircle, RefreshCw, Layers, ChevronUp, ChevronDown, 
  UserCheck, ArrowUpDown, Edit, Save, X, Eye, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { Case, CaseStatus } from '../types';

interface CaseManagementProps {
  cases: Case[];
  lang: 'th' | 'en';
  onStatusUpdate: (
    id: string,
    newStatus?: CaseStatus,
    newDisease?: string,
    newPriority?: string,
    personalInfo?: any,
    clinicalInfo?: any
  ) => Promise<void>;
  onSelectCase: (c: Case) => void;
  selectedCaseId: string | null;
}

// Deterministic 5-digit case code generator based on case ID
export function getCaseCode(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return hash.toString().padStart(5, '0');
}

export default function CaseManagement({
  cases,
  lang,
  onStatusUpdate,
  onSelectCase,
  selectedCaseId
}: CaseManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<CaseStatus | 'All'>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isBlockExpanded, setIsBlockExpanded] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Case editing fields
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [editedAge, setEditedAge] = useState<number>(0);
  const [editedGender, setEditedGender] = useState<string>('');
  const [editedPhone, setEditedPhone] = useState<string>('');
  const [editedDisease, setEditedDisease] = useState<string>('');
  const [editedPriority, setEditedPriority] = useState<'critical' | 'moderate' | 'low'>('low');
  const [editedStatus, setEditedStatus] = useState<CaseStatus>('New');
  const [editedSymptoms, setEditedSymptoms] = useState<string>('');
  const [editedContact, setEditedContact] = useState<string>('');

  const currentCase = cases.find(c => c.id === selectedCaseId);

  // Sync edit form fields when selection changes
  useEffect(() => {
    if (currentCase) {
      setEditedName(currentCase.personalInfo?.name || '');
      setEditedAge(currentCase.personalInfo?.age || 0);
      setEditedGender(currentCase.personalInfo?.gender || 'Male');
      setEditedPhone(currentCase.personalInfo?.phone || '');
      setEditedDisease(currentCase.disease || '');
      setEditedPriority(currentCase.priority || 'low');
      setEditedStatus(currentCase.status || 'New');
      setEditedSymptoms(currentCase.clinicalInfo?.symptoms.join(', ') || '');
      setEditedContact(currentCase.clinicalInfo?.contactHistory || '');
      setIsEditing(false); // Reset edit state when new case is clicked
    }
  }, [selectedCaseId, currentCase?.id]);

  // Filter cases based on search term (including 5-digit code) and status tab
  const filteredCases = cases.filter(c => {
    const nameLower = (c.personalInfo?.name || '').toLowerCase();
    const diseaseLower = c.disease.toLowerCase();
    const areaLower = c.areaName.toLowerCase();
    const phoneVal = c.personalInfo?.phone || '';
    const caseCode = getCaseCode(c.id);

    const matchesSearch = 
      nameLower.includes(searchTerm.toLowerCase()) ||
      diseaseLower.includes(searchTerm.toLowerCase()) ||
      areaLower.includes(searchTerm.toLowerCase()) ||
      phoneVal.includes(searchTerm) ||
      caseCode.includes(searchTerm);

    const matchesTab = activeTab === 'All' ? true : c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Sort cases by date
  const sortedCases = [...filteredCases].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleStatusChangeOnly = async (id: string, newStatus?: CaseStatus, newDisease?: string, newPriority?: string) => {
    setActionLoading(`${id}_${newStatus || 'update'}`);
    try {
      await onStatusUpdate(id, newStatus, newDisease, newPriority);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveAll = async () => {
    if (!currentCase) return;
    setActionLoading('save_all');
    try {
      const personalInfo = {
        name: editedName,
        age: Number(editedAge),
        gender: editedGender,
        phone: editedPhone,
        status: currentCase.personalInfo?.status || 'Quarantined'
      };
      const clinicalInfo = {
        symptoms: editedSymptoms.split(',').map(s => s.trim()).filter(Boolean),
        contactHistory: editedContact,
        days: currentCase.clinicalInfo?.days || 3
      };
      
      await onStatusUpdate(
        currentCase.id,
        editedStatus,
        editedDisease,
        editedPriority,
        personalInfo,
        clinicalInfo
      );
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

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
    if (norm.includes('flu') || norm.includes('ไข้หวัดใหญ่')) {
      return lang === 'th' ? 'โรคไข้หวัดใหญ่' : 'Influenza';
    }
    if (norm.includes('lepto') || norm.includes('ฉี่หนู')) {
      return lang === 'th' ? 'โรคฉี่หนู' : 'Leptospirosis';
    }
    if (norm.includes('cholera') || norm.includes('อหิวา')) {
      return lang === 'th' ? 'โรคอหิวาตกโรค' : 'Cholera';
    }
    if (norm.includes('diarrhea') || norm.includes('ท้องร่วง')) {
      return lang === 'th' ? 'โรคอุจจาระร่วงเฉียบพลัน' : 'Diarrhea';
    }
    if (norm.includes('skin') || norm.includes('ผิวหนัง')) {
      return lang === 'th' ? 'โรคผิวหนังอักเสบ' : 'Skin Infection';
    }
    return d;
  };

  const translateTabLabel = (t: string) => {
    if (t === 'All') return lang === 'th' ? 'ทั้งหมด' : 'All';
    if (t === 'New') return lang === 'th' ? 'รายงานใหม่' : 'New';
    if (t === 'Accepted') return lang === 'th' ? 'รับกักตัวแล้ว' : 'Quarantined';
    if (t === 'Waiting') return lang === 'th' ? 'รอผลตรวจ' : 'Waiting Test';
    return lang === 'th' ? 'พ้นระยะโรค' : 'Completed';
  };

  const translateArea = (a: string) => {
    if (a.includes('Center')) return lang === 'th' ? 'สะเตงกลาง' : 'Sateng Center';
    if (a.includes('Nok')) return lang === 'th' ? 'สะเตงนอก' : 'Sateng Nok';
    if (a.includes('Sap')) return lang === 'th' ? 'ท่าสาป' : 'Tha Sap';
    return a;
  };

  return (
    <div className="space-y-4" id="case_management_section">
      
      {/* 1. Collapsible Header Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <button
          onClick={() => setIsBlockExpanded(!isBlockExpanded)}
          type="button"
          className="w-full text-left bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between cursor-pointer focus:outline-none hover:bg-slate-100/60 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded shadow-sm">
              <ClipboardList size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">
                {lang === 'th' ? 'ศูนย์ควบคุมและจัดการประวัติผู้ป่วย (ส่วนเจ้าหน้าที่)' : 'Authorized Patient Containment Center'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {lang === 'th' ? 'ค้นหาตรวจสอบรหัส 5 หลัก ดูข้อมูลฉบับเต็ม และจัดการประวัติผู้ป่วยอย่างละเอียด' : 'Search by 5-digit case ID, view comprehensive logs, and manage patient clinical registry'}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {isBlockExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isBlockExpanded && (
          <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Cases Directory Column */}
            <div className="xl:col-span-2 border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px]">
              
              {/* Toolbar */}
              <div className="bg-slate-50/50 p-4 border-b border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    {lang === 'th' ? `พบบันทึกทั้งหมด ${sortedCases.length} รายการ` : `${sortedCases.length} Cases Listed`}
                  </span>

                  {/* Date Sorter Toggle */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === 'th' ? 'เรียงลำดับวันที่:' : 'Sort Date:'}
                    </span>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 cursor-pointer shadow-2xs"
                      type="button"
                    >
                      <ArrowUpDown size={11} className="text-blue-600" />
                      <span>
                        {sortOrder === 'desc' 
                          ? (lang === 'th' ? 'ล่าสุดไปก่อน' : 'Newest First')
                          : (lang === 'th' ? 'ก่อนไปล่าสุด' : 'Oldest First')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Search Input supporting 5-digit codes */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder={lang === 'th' ? 'ค้นหาด้วย รหัสเคส 5 หลัก (#XXXXX), ชื่อผู้ป่วย, ชนิดโรค, เบอร์โทร หรือชุมชน...' : 'Search by 5-Digit Code (#XXXXX), name, phone, disease, neighborhood...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 font-semibold shadow-2xs"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-slate-50 pb-0.5">
                  {(['All', 'New', 'Accepted', 'Waiting', 'Completed'] as const).map((tab) => {
                    const tabCount = tab === 'All' 
                      ? cases.length 
                      : cases.filter(c => c.status === tab).length;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition duration-150 flex items-center space-x-1.5 cursor-pointer border ${
                          activeTab === tab
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{translateTabLabel(tab)}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tabCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient List */}
              <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-slate-100">
                {sortedCases.length > 0 ? (
                  sortedCases.map((c) => {
                    const isSelected = selectedCaseId === c.id;
                    const code = getCaseCode(c.id);
                    return (
                      <div 
                        key={c.id}
                        onClick={() => onSelectCase(c)}
                        className={`p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition duration-150 cursor-pointer ${
                          isSelected ? 'bg-blue-50/20 border-l-4 border-l-blue-600 pl-2.5' : 'pl-3.5'
                        }`}
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center flex-wrap gap-1.5">
                            {/* CASE 5-Digit ID Code */}
                            <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                              #{code}
                            </span>
                            <span className="font-extrabold text-slate-950 text-xs">
                              {c.personalInfo?.name}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              c.severity === 'high' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : c.severity === 'medium' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {translateDisease(c.disease)}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              c.priority === 'critical' 
                                ? 'bg-red-600 text-white animate-pulse' 
                                : c.priority === 'moderate' 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-slate-400 text-white'
                            }`}>
                              {c.priority ? (lang === 'th' ? (c.priority === 'critical' ? 'วิกฤต' : 'ปานกลาง') : c.priority.toUpperCase()) : 'LOW'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                            <span className="flex items-center space-x-1 font-semibold">
                              <User size={11} className="text-slate-400" />
                              <span>{c.personalInfo?.age} {lang === 'th' ? 'ปี' : 'y'} ({c.personalInfo?.gender === 'Male' ? (lang === 'th' ? 'ชาย' : 'M') : (lang === 'th' ? 'หญิง' : 'F')})</span>
                            </span>
                            <span className="flex items-center space-x-1 font-semibold">
                              <Phone size={11} className="text-slate-400" />
                              <span>{c.personalInfo?.phone}</span>
                            </span>
                            <span className="flex items-center space-x-1 font-semibold">
                              <Calendar size={11} className="text-slate-400" />
                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            c.status === 'New' 
                              ? 'bg-blue-50 text-blue-800 border-blue-100 animate-pulse' 
                              : c.status === 'Accepted' 
                              ? 'bg-amber-50 text-amber-800 border-amber-100' 
                              : c.status === 'Waiting' 
                              ? 'bg-purple-50 text-purple-800 border-purple-100' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                          }`}>
                            {translateTabLabel(c.status)}
                          </span>
                          <ChevronRight size={14} className="text-slate-300" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'th' ? 'ไม่พบบันทึกข้อมูลประวัติการกักตัวของโรคระบาด' : 'No patient case files matched current queries.'}
                  </div>
                )}
              </div>
            </div>

            {/* Case Details / Editing Panel */}
            <div className="xl:col-span-1">
              {selectedCaseId && currentCase ? (
                !isEditing ? (
                  /* SUMMARY VIEW (When clicked, we show summary + View More button) */
                  <div className="bg-slate-50/80 rounded-xl border-2 border-slate-200 p-4 space-y-4 text-xs animate-fade-in sticky top-4">
                    
                    {/* Header with Case Code */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-extrabold text-white text-xs">
                          {currentCase.personalInfo?.name[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                            {currentCase.personalInfo?.name}
                          </h4>
                          <span className="font-mono text-[9px] font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded border border-slate-300">
                            ID: #{getCaseCode(currentCase.id)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        currentCase.status === 'New' ? 'bg-blue-50 text-blue-800 border-blue-100 animate-pulse' :
                        currentCase.status === 'Accepted' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                        currentCase.status === 'Waiting' ? 'bg-purple-50 text-purple-800 border-purple-100' :
                        'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }`}>
                        {translateTabLabel(currentCase.status)}
                      </span>
                    </div>

                    {/* Quick Metadata Block */}
                    <div className="space-y-2.5 bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-2xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                        {lang === 'th' ? 'ข้อมูลสรุปทั่วไป' : 'GENERAL CASE SUMMARY'}
                      </span>
                      <div className="grid grid-cols-1 gap-2 text-slate-700 font-semibold text-[11px]">
                        <div>👤 {lang === 'th' ? 'อายุ:' : 'Age:'} <span className="text-slate-900 font-extrabold">{currentCase.personalInfo?.age} {lang === 'th' ? 'ปี' : 'years'}</span></div>
                        <div>🧬 {lang === 'th' ? 'เพศ:' : 'Gender:'} <span className="text-slate-900 font-extrabold">{currentCase.personalInfo?.gender === 'Male' ? (lang === 'th' ? 'ชาย' : 'Male') : (lang === 'th' ? 'หญิง' : 'Female')}</span></div>
                        <div>📞 {lang === 'th' ? 'เบอร์ติดต่อ:' : 'Phone:'} <span className="text-slate-900 font-extrabold">{currentCase.personalInfo?.phone}</span></div>
                        <div>🦠 {lang === 'th' ? 'การวินิจฉัยโรค:' : 'Diagnosis:'} <span className="text-rose-600 font-extrabold uppercase tracking-wide">{translateDisease(currentCase.disease)}</span></div>
                        <div>🚨 {lang === 'th' ? 'ระดับความด่วน:' : 'Priority Level:'} <span className="text-amber-600 font-extrabold uppercase tracking-wider">{currentCase.priority?.toUpperCase()}</span></div>
                        <div>🏠 {lang === 'th' ? 'ชุมชน:' : 'Neighborhood:'} <span className="text-blue-700 font-extrabold">{translateArea(currentCase.areaName)}</span></div>
                      </div>
                    </div>

                    {/* Symptoms & Risk */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-2xs space-y-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                        {lang === 'th' ? 'อาการและประวัติเสี่ยง' : 'SYMPTOMS & RISKS'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {currentCase.clinicalInfo?.symptoms.map((s, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-wider">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-1.5">
                        <span className="font-bold text-slate-700 block">{lang === 'th' ? 'ประวัติสัมผัสโรค:' : 'Contact history:'}</span>
                        {currentCase.clinicalInfo?.contactHistory || '-'}
                      </p>
                    </div>

                    {/* BIG BUTTON FOR VIEW MORE & EDIT (ปุ่มดูเพิ่มเติม และแก้ไขข้อมูล) */}
                    <button
                      onClick={() => setIsEditing(true)}
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-lg transition duration-150 flex items-center justify-center space-x-2 shadow-xs cursor-pointer text-xs uppercase tracking-wider"
                    >
                      <Edit size={14} />
                      <span>{lang === 'th' ? 'ดูข้อมูลเพิ่มเติมและแก้ไขข้อมูลผู้ป่วย' : 'View Full Profile & Edit Case'}</span>
                    </button>

                  </div>
                ) : (
                  /* FULL EDIT MODE PANEL (แก้ไขข้อมูลตรงนั้นได้เลย) */
                  <div className="bg-white rounded-xl border-2 border-blue-500 p-4 space-y-4 text-xs animate-fade-in sticky top-4 shadow-md">
                    
                    {/* Header of Editing Pane */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                          <Edit size={14} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-blue-900 text-xs">
                            {lang === 'th' ? 'แก้ไขประวัติทางการแพทย์' : 'Edit Medical Profile'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold font-mono">
                            CASE: #{getCaseCode(currentCase.id)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                        type="button"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'ชื่อ - นามสกุลผู้ป่วย' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Age */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                            {lang === 'th' ? 'อายุ (ปี)' : 'Age (years)'}
                          </label>
                          <input
                            type="number"
                            value={editedAge}
                            onChange={(e) => setEditedAge(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                            {lang === 'th' ? 'เพศกำเนิด' : 'Gender'}
                          </label>
                          <select
                            value={editedGender}
                            onChange={(e) => setEditedGender(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white cursor-pointer"
                          >
                            <option value="Male">{lang === 'th' ? 'ชาย (Male)' : 'Male'}</option>
                            <option value="Female">{lang === 'th' ? 'หญิง (Female)' : 'Female'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'เบอร์โทรศัพท์ติดต่อ' : 'Phone Number'}
                        </label>
                        <input
                          type="text"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white"
                        />
                      </div>

                      {/* Disease Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'ผลตรวจชนิดโรคระบาด' : 'Disease Diagnosis'}
                        </label>
                        <select
                          value={editedDisease}
                          onChange={(e) => setEditedDisease(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white cursor-pointer"
                        >
                          <option value="Dengue Fever">{lang === 'th' ? 'โรคไข้เลือดออก (Dengue Fever)' : 'Dengue Fever'}</option>
                          <option value="Leptospirosis">{lang === 'th' ? 'โรคฉี่หนู (Leptospirosis)' : 'Leptospirosis'}</option>
                          <option value="Cholera">{lang === 'th' ? 'โรคอหิวาตกโรค (Cholera)' : 'Cholera'}</option>
                          <option value="Diarrhea">{lang === 'th' ? 'โรคอุจจาระร่วงเฉียบพลัน (Diarrhea)' : 'Diarrhea'}</option>
                          <option value="Skin Infection / Athlete's Foot">{lang === 'th' ? 'โรคผิวหนังอักเสบและน้ำกัดเท้า' : "Skin Infection / Athlete's Foot"}</option>
                          <option value="Food Poisoning">{lang === 'th' ? 'โรคอาหารเป็นพิษ (Food Poisoning)' : 'Food Poisoning'}</option>
                          <option value="Influenza">{lang === 'th' ? 'โรคไข้หวัดใหญ่ (Influenza)' : 'Influenza'}</option>
                          <option value="COVID-19">{lang === 'th' ? 'โรคโควิด-19 (COVID-19)' : 'COVID-19'}</option>
                          <option value="Hand, Foot, and Mouth Disease">{lang === 'th' ? 'โรคมือ เท้า ปาก (Hand, Foot, & Mouth)' : 'Hand, Foot, & Mouth Disease'}</option>
                        </select>
                      </div>

                      {/* Priority Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'ระดับความด่วนในการจำกัดวง' : 'Set Quarantine Priority'}
                        </label>
                        <select
                          value={editedPriority}
                          onChange={(e) => setEditedPriority(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white cursor-pointer"
                        >
                          <option value="critical">{lang === 'th' ? 'วิกฤต (Critical)' : 'Critical'}</option>
                          <option value="moderate">{lang === 'th' ? 'ปานกลาง (Moderate)' : 'Moderate'}</option>
                          <option value="low">{lang === 'th' ? 'ต่ำ (Low)' : 'Low'}</option>
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'สถานะกักโรคทางระบาดวิทยา' : 'Epidemiology Status'}
                        </label>
                        <select
                          value={editedStatus}
                          onChange={(e) => setEditedStatus(e.target.value as CaseStatus)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white cursor-pointer"
                        >
                          <option value="New">{lang === 'th' ? 'รายงานใหม่ (New)' : 'New'}</option>
                          <option value="Accepted">{lang === 'th' ? 'รับกักตัวแล้ว (Quarantined)' : 'Quarantined'}</option>
                          <option value="Waiting">{lang === 'th' ? 'รอผลแล็บยืนยัน (Waiting Test)' : 'Waiting Test'}</option>
                          <option value="Completed">{lang === 'th' ? 'พ้นระยะโรคแล้ว (Discharged)' : 'Discharged / Completed'}</option>
                        </select>
                      </div>

                      {/* Symptoms */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'อาการผู้ป่วย (ระบุคั่นด้วยเครื่องหมายจุลภาค ,)' : 'Symptoms (comma separated)'}
                        </label>
                        <input
                          type="text"
                          value={editedSymptoms}
                          onChange={(e) => setEditedSymptoms(e.target.value)}
                          placeholder="Fever, Rash, Calf pain"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white"
                        />
                      </div>

                      {/* Contact History */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                          {lang === 'th' ? 'ประวัติความเสี่ยง / แหล่งปนเปื้อน' : 'Contact Risk & Environmental History'}
                        </label>
                        <textarea
                          value={editedContact}
                          onChange={(e) => setEditedContact(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white resize-none"
                        />
                      </div>

                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={actionLoading === 'save_all'}
                        type="button"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-lg transition text-[11px] uppercase tracking-wider cursor-pointer"
                      >
                        {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleSaveAll}
                        disabled={actionLoading === 'save_all'}
                        type="button"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-lg transition flex items-center justify-center space-x-1 shadow-sm text-[11px] uppercase tracking-wider cursor-pointer"
                      >
                        {actionLoading === 'save_all' ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <>
                            <Save size={12} />
                            <span>{lang === 'th' ? 'บันทึกข้อมูล' : 'Save Changes'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs rounded-xl flex flex-col items-center justify-center space-y-2 h-full min-h-[300px]">
                  <UserCheck size={26} className="text-slate-300" />
                  <p className="font-extrabold uppercase tracking-wide">
                    {lang === 'th' ? 'ไม่มีการเลือกข้อมูลผู้ป่วย' : 'No Patient Selected'}
                  </p>
                  <p className="max-w-[200px] leading-relaxed mx-auto text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {lang === 'th' ? 'คลิกแถวผู้ป่วยในตารางหรือเลือกจุดพินในแผนที่ เพื่อทำกิจกรรมจัดการเคส' : 'Click any row in the directory or a map node pin to manage Active Case isolation steps.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
