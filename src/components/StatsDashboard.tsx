import React, { useState } from 'react';
import { 
  TrendingUp, Users, Calendar, Filter, CircleDot, 
  CheckSquare, Activity, ShieldAlert, Award, ChevronDown, ChevronUp, BarChart4, AlertTriangle 
} from 'lucide-react';
import { Case, CaseStatus } from '../types';

interface StatsDashboardProps {
  cases: Case[];
  lang: 'th' | 'en';
  selectedDisease: string;
  onDiseaseSelect: (disease: string) => void;
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
}

export default function StatsDashboard({
  cases,
  lang,
  selectedDisease,
  onDiseaseSelect,
  timeFilter,
  onTimeFilterChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange
}: StatsDashboardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isBlockExpanded, setIsBlockExpanded] = useState(true);

  // Distinct disease list from existing data + presets
  const availableDiseases = Array.from(new Set([
    'All Diseases',
    'Dengue Fever',
    'COVID-19',
    'Hand, Foot, and Mouth Disease',
    'Influenza',
    ...cases.map(c => c.disease)
  ].filter(Boolean)));

  const translateDiseaseLabel = (d: string) => {
    if (d === 'All Diseases') return lang === 'th' ? 'โรคติดต่อทั้งหมด' : 'All Diseases';
    if (d === 'Dengue Fever') return lang === 'th' ? 'โรคไข้เลือดออก' : 'Dengue Fever';
    if (d === 'COVID-19') return lang === 'th' ? 'โรคโควิด-19' : 'COVID-19';
    if (d === 'Hand, Foot, and Mouth Disease') return lang === 'th' ? 'โรคมือ เท้า ปาก' : 'Hand, Foot, & Mouth';
    if (d === 'Influenza') return lang === 'th' ? 'โรคไข้หวัดใหญ่' : 'Influenza';
    return d;
  };

  const translateTimeFilterLabel = (f: string) => {
    if (f === 'all') return lang === 'th' ? 'ทั้งหมด' : 'All';
    if (f === 'daily') return lang === 'th' ? 'รายวัน' : 'Daily';
    if (f === 'weekly') return lang === 'th' ? 'รายสัปดาห์' : 'Weekly';
    if (f === 'monthly') return lang === 'th' ? 'รายเดือน' : 'Monthly';
    if (f === 'yearly') return lang === 'th' ? 'รายปี' : 'Yearly';
    if (f === 'custom') return lang === 'th' ? 'กำหนดเอง' : 'Custom';
    return f;
  };

  const translateArea = (a: string) => {
    if (a.includes('Center')) return lang === 'th' ? 'สะเตงกลาง (เขตเมือง)' : 'Sateng Center';
    if (a.includes('Nok')) return lang === 'th' ? 'สะเตงนอก' : 'Sateng Nok';
    if (a.includes('Sap')) return lang === 'th' ? 'ท่าสาป' : 'Tha Sap';
    return a;
  };

  // Apply time filters
  const filterByTime = (c: Case) => {
    const createdTime = new Date(c.createdAt).getTime();
    const now = Date.now();

    if (timeFilter === 'daily') {
      return now - createdTime <= 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'weekly') {
      return now - createdTime <= 7 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'monthly') {
      return now - createdTime <= 30 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'yearly') {
      return now - createdTime <= 365 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const startMs = customStartDate ? new Date(customStartDate).getTime() : 0;
      const endMs = customEndDate ? new Date(customEndDate).getTime() + 86400000 : Infinity;
      return createdTime >= startMs && createdTime <= endMs;
    }
    return true;
  };

  // Filter cases based on selected disease AND time filter
  const timeFilteredCases = cases.filter(filterByTime);
  const activeCases = selectedDisease === 'All Diseases'
    ? timeFilteredCases
    : timeFilteredCases.filter(c => c.disease.toLowerCase() === selectedDisease.toLowerCase());

  // Calculations for KPI blocks
  const quarantinedCount = activeCases.filter(c => 
    c.personalInfo?.status === 'Quarantined' || 
    (c.status === 'Accepted')
  ).length;

  const waitingCount = activeCases.filter(c => c.status === 'Waiting').length;
  const completedCount = activeCases.filter(c => c.status === 'Completed').length;
  const totalCasesCount = activeCases.length;

  // Calculate top outbreaks in Yala
  const getTopDiseases = () => {
    const counts: { [key: string]: number } = {};
    timeFilteredCases.forEach(c => {
      counts[c.disease] = (counts[c.disease] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const top3Diseases = getTopDiseases();

  // Area distribution
  const getAreaDistribution = () => {
    const distribution: { [key: string]: number } = {
      'Sateng Center': 0,
      'Sateng Nok': 0,
      'Tha Sap': 0
    };

    activeCases.forEach(c => {
      if (c.areaName.toLowerCase().includes('center') || c.areaName.toLowerCase().includes('sateng')) {
        distribution['Sateng Center']++;
      } else if (c.areaName.toLowerCase().includes('nok')) {
        distribution['Sateng Nok']++;
      } else {
        distribution['Tha Sap']++;
      }
    });

    return distribution;
  };

  const areaCounts = getAreaDistribution();

  // Demographic breakdowns
  const getGenderDistribution = () => {
    let male = 0;
    let female = 0;
    let other = 0;

    activeCases.forEach(c => {
      const g = (c.personalInfo?.gender || '').toLowerCase();
      if (g.startsWith('m')) male++;
      else if (g.startsWith('f')) female++;
      else other++;
    });

    return { male, female, other };
  };

  const genderStats = getGenderDistribution();

  // Age breakdowns
  const getAgeDistribution = () => {
    let kids = 0;
    let teens = 0;
    let adults = 0;
    let elderly = 0;

    activeCases.forEach(c => {
      const age = c.personalInfo?.age || 0;
      if (age === 0) return;
      if (age < 12) kids++;
      else if (age < 20) teens++;
      else if (age < 60) adults++;
      else elderly++;
    });

    return { kids, teens, adults, elderly };
  };

  const ageStats = getAgeDistribution();

  return (
    <div className="space-y-4" id="stats_dashboard_section">
      
      {/* 1. Collapsible Header & Filter Control Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Main Block Trigger */}
        <button
          onClick={() => setIsBlockExpanded(!isBlockExpanded)}
          type="button"
          className="w-full text-left bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between cursor-pointer focus:outline-none hover:bg-slate-100/60 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded shadow-xs">
              <BarChart4 size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                {lang === 'th' ? 'สถิติเฝ้าระวังและการกรองสถานการณ์โรคติดต่อ' : 'Outbreak Statistics & Control Panel'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {lang === 'th' ? 'คัดกรองตามหมวดหมู่โรค ช่วงเวลา และแสดงอัตราส่วนระบาดวิทยา' : 'Filter by disease categories, query timeline curves, and sanitary indicators'}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {isBlockExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isBlockExpanded && (
          <div className="p-4 space-y-4 animate-fade-in">
            {/* Filter Deck Grid */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Disease Selector Select Element */}
              <div className="relative flex-1 max-w-sm">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  {lang === 'th' ? 'เลือกจำแนกตามชนิดโรค' : 'Disease Classification'}
                </label>
                <div className="relative">
                  <Activity size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none z-10" />
                  <select
                    value={selectedDisease}
                    onChange={(e) => onDiseaseSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 transition duration-150 cursor-pointer uppercase tracking-wider appearance-none focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    id="disease_filter_dropdown_select"
                  >
                    {availableDiseases.map((diseaseName) => (
                      <option key={diseaseName} value={diseaseName} className="text-slate-700 bg-white">
                        {translateDiseaseLabel(diseaseName)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                </div>
              </div>

              {/* Time Filters Selector */}
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  {lang === 'th' ? 'กรองตามกรอบช่วงเวลา' : 'Timeline Query Interval'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'].map((f) => (
                    <button
                      key={f}
                      onClick={() => onTimeFilterChange(f)}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 uppercase tracking-wider border cursor-pointer ${
                        timeFilter === f
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      id={`time_filter_btn_${f}`}
                    >
                      {translateTimeFilterLabel(f)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {timeFilter === 'custom' && (
              <div className="bg-blue-50/20 p-4 rounded-lg border border-blue-100 flex flex-wrap items-center gap-4 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <Calendar size={15} className="text-blue-600" />
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800">
                    {lang === 'th' ? 'กำหนดระยะเวลาด้วยตนเอง:' : 'Custom Calendar Interval:'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => onCustomStartDateChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-700 font-semibold text-xs"
                  />
                  <span className="text-slate-400 font-extrabold text-xs">{lang === 'th' ? 'ถึง' : 'to'}</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => onCustomEndDateChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 focus:ring-2 focus:ring-blue-500/10 focus:outline-none text-slate-700 font-semibold text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Counters Deck & Graphical breakdowns (Shown only if expanded is true, or you can let KPIs be persistently visible) */}
      {isBlockExpanded && (
        <div className="space-y-4 animate-fade-in">
          
          {/* KPI Counters Deck */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Monitored */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center space-x-3.5">
              <div className="bg-slate-50 text-blue-600 p-2.5 rounded-lg border border-slate-100">
                <CircleDot size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'เคสรวมเฝ้าระวัง' : 'Monitored Cases'}
                </p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{totalCasesCount}</h4>
              </div>
            </div>

            {/* Quarantined */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center space-x-3.5">
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg border border-rose-100">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'กักกันโรค (Quarantine)' : 'Quarantined'}
                </p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{quarantinedCount}</h4>
              </div>
            </div>

            {/* Waiting for test */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center space-x-3.5">
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg border border-purple-100">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'รอผลตรวจทางคลินิก' : 'Waiting on Test'}
                </p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{waitingCount}</h4>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex items-center space-x-3.5">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                <CheckSquare size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'หายดี/พ้นระยะเสี่ยง' : 'Discharged / Free'}
                </p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{completedCount}</h4>
              </div>
            </div>

          </div>

          {/* Graphical Distributions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Top outbreaks chart */}
            {selectedDisease === 'All Diseases' ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center space-x-1.5">
                    <Award size={14} className="text-yellow-500" />
                    <span>{lang === 'th' ? 'โรคติดต่อหลักเขตเทศบาล' : 'Top Outbreaks in Yala'}</span>
                  </h5>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {lang === 'th' ? 'สถิติสุ่มจำแนกสูงสุดจากเหตุส่งแจ้งเตือน' : 'Based on active reports for selected timeline'}
                  </p>
                </div>

                {top3Diseases.length > 0 ? (
                  <div className="space-y-3.5 pt-1">
                    {top3Diseases.map((item, index) => {
                      const percentage = totalCasesCount > 0 ? Math.round((item.count / totalCasesCount) * 100) : 0;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 flex items-center space-x-1 font-bold">
                              <span className="text-[10px] text-slate-400">#{index + 1}</span>
                              <span>{translateDiseaseLabel(item.name)}</span>
                            </span>
                            <span className="text-slate-900 font-extrabold">{item.count} {lang === 'th' ? 'ราย' : 'cases'}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                            <div 
                              className={`h-full rounded ${
                                index === 0 ? 'bg-rose-600' : index === 1 ? 'bg-amber-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 text-right uppercase tracking-wider font-bold">
                            {percentage}% {lang === 'th' ? 'ของเคสรายงานทั้งหมดในยะลา' : 'of all Yala outbreaks'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {lang === 'th' ? 'ไม่พบข้อมูลในช่วงเวลานี้' : 'No outbreaks in this range.'}
                  </div>
                )}
              </div>
            ) : (
              /* Age breakdown index */
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center space-x-1.5">
                    <Users size={14} className="text-blue-500" />
                    <span>{lang === 'th' ? 'ช่วงอายุผู้รับเชื้อติดต่อ' : 'Patient Age Demographics'}</span>
                  </h5>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {lang === 'th' ? `ข้อมูลแบ่งกลุ่มประชากรของ ${translateDiseaseLabel(selectedDisease)}` : `Age profile of registered ${selectedDisease} clusters`}
                  </p>
                </div>

                {totalCasesCount > 0 && (ageStats.kids > 0 || ageStats.teens > 0 || ageStats.adults > 0 || ageStats.elderly > 0) ? (
                  <div className="space-y-3 pt-1">
                    {[
                      { label: lang === 'th' ? 'เด็กปฐมวัย (<12 ปี)' : 'Children (<12y)', val: ageStats.kids, color: 'bg-indigo-400' },
                      { label: lang === 'th' ? 'วัยรุ่น (12-19 ปี)' : 'Teens (12-19y)', val: ageStats.teens, color: 'bg-blue-400' },
                      { label: lang === 'th' ? 'ผู้ใหญ่ (20-59 ปี)' : 'Adults (20-59y)', val: ageStats.adults, color: 'bg-emerald-400' },
                      { label: lang === 'th' ? 'ผู้สูงอายุ (60 ปีขึ้นไป)' : 'Elderly (60+y)', val: ageStats.elderly, color: 'bg-rose-400' }
                    ].map((ageGrp) => {
                      const pct = totalCasesCount > 0 ? Math.round((ageGrp.val / totalCasesCount) * 100) : 0;
                      return (
                        <div key={ageGrp.label} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{ageGrp.label}</span>
                            <span className="text-slate-900 font-extrabold">{ageGrp.val} {lang === 'th' ? 'ราย' : 'cases'} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                            <div className={`h-full rounded ${ageGrp.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-wider">
                    {totalCasesCount === 0 
                      ? (lang === 'th' ? 'ไม่พบบันทึกข้อมูลในช่วงนี้' : 'No cases registered.') 
                      : (lang === 'th' ? 'ประชากรถูกจำกัดการเข้าถึงความปลอดภัยในฐานะประชาชน' : 'Confidential demographic security filter active.')}
                  </div>
                )}
              </div>
            )}

            {/* Geographic Area Breakdown */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center space-x-1.5">
                  <Filter size={14} className="text-blue-500" />
                  <span>{lang === 'th' ? 'ความหนาแน่นรายพื้นที่เขตเมือง' : 'Yala Geographic Outbreak Spread'}</span>
                </h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {lang === 'th' ? 'สถิติการระบาดจำแนกตามเขตสะเตงและท่าสาป' : 'Outbreak density grouped by sub-municipal areas'}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { name: 'Sateng Center', count: areaCounts['Sateng Center'], color: 'border-l-rose-500 text-rose-700 bg-rose-50/10' },
                  { name: 'Sateng Nok', count: areaCounts['Sateng Nok'], color: 'border-l-amber-500 text-amber-700 bg-amber-50/10' },
                  { name: 'Tha Sap', count: areaCounts['Tha Sap'], color: 'border-l-blue-500 text-blue-700 bg-blue-50/10' }
                ].map((area) => {
                  const pct = totalCasesCount > 0 ? Math.round((area.count / totalCasesCount) * 100) : 0;
                  return (
                    <div 
                      key={area.name} 
                      className={`border-l-4 p-2 rounded-r flex items-center justify-between text-xs font-semibold ${area.color}`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-slate-800 font-extrabold uppercase tracking-tight text-[11px]">{translateArea(area.name)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{pct}% {lang === 'th' ? 'ของจุดระเบิดภัย' : 'of active focus'}</p>
                      </div>
                      <span className="font-extrabold text-slate-900">{area.count} {lang === 'th' ? 'ราย' : 'cases'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outbreak control risk indicators */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight flex items-center space-x-1.5">
                  <Activity size={14} className="text-blue-500" />
                  <span>{lang === 'th' ? 'ดัชนีระดับสุขาภิบาลควบคุมโรค' : 'Epidemic Control Indicators'}</span>
                </h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {lang === 'th' ? 'เกณฑ์ชี้วัดความรุนแรงรวมของพื้นที่เทศบาล' : 'Overall risk parameters and sanitary safety level'}
                </p>
              </div>

              <div className="space-y-3.5 pt-1 text-xs">
                {totalCasesCount > 0 && (genderStats.male > 0 || genderStats.female > 0) ? (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">{lang === 'th' ? 'สัดส่วนเพศผู้ป่วย' : 'Patient Gender Profile'}</p>
                    <div className="flex h-3 rounded overflow-hidden">
                      {genderStats.male > 0 && (
                        <div 
                          className="bg-blue-600 flex items-center justify-center text-[9px] text-white font-extrabold"
                          style={{ width: `${(genderStats.male / totalCasesCount) * 100}%` }}
                        />
                      )}
                      {genderStats.female > 0 && (
                        <div 
                          className="bg-pink-600 flex items-center justify-center text-[9px] text-white font-extrabold"
                          style={{ width: `${(genderStats.female / totalCasesCount) * 100}%` }}
                        />
                      )}
                      {genderStats.other > 0 && (
                        <div 
                          className="bg-purple-600 flex items-center justify-center text-[9px] text-white font-extrabold"
                          style={{ width: `${(genderStats.other / totalCasesCount) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>{lang === 'th' ? `ชาย: ${genderStats.male}` : `M: ${genderStats.male}`}</span>
                      <span>{lang === 'th' ? `หญิง: ${genderStats.female}` : `F: ${genderStats.female}`}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    {lang === 'th' ? 'ปิดบังตัวตนของประชาชน' : 'Gender metrics are restricted.'}
                  </div>
                )}

                {/* Alarm level indicator card */}
                <div className="bg-blue-50/20 p-3 rounded-lg border border-blue-100 space-y-1">
                  <p className="font-extrabold text-[9px] text-blue-900 uppercase tracking-wider">{lang === 'th' ? 'สถานะเตือนภัยล่วงหน้า' : 'Outbreak Warning Level'}</p>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      totalCasesCount === 0 
                        ? 'bg-emerald-500' 
                        : activeCases.some(c => c.severity === 'high' && c.status !== 'Completed') 
                        ? 'bg-rose-500 animate-pulse' 
                        : 'bg-amber-500'
                    }`} />
                    <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
                      {totalCasesCount === 0 
                        ? (lang === 'th' ? 'ปลอดภัย / ควบคุมได้สมบูรณ์' : 'SECURE / CONTROLLED') 
                        : activeCases.some(c => c.severity === 'high' && c.status !== 'Completed') 
                        ? (lang === 'th' ? 'เตือนภัยขั้นสูง / มีเคสเสี่ยงสีแดง' : 'ALERT / RED CASES DETECTED') 
                        : (lang === 'th' ? 'ปานกลาง / เฝ้าระวังใกล้ชิด' : 'MONITORING / MEDIUM RISK')}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
