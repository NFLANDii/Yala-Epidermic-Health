import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, HeartPulse, HelpCircle, ArrowRight, Sparkles, Info } from 'lucide-react';
import { preventionData } from '../preventionData';

interface PreventionGuidesProps {
  lang: 'th' | 'en';
}

export default function PreventionGuides({ lang }: PreventionGuidesProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isBlockExpanded, setIsBlockExpanded] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'guides' | 'intel'>('guides');

  const selectedGuide = preventionData[selectedIdx] || preventionData[0];

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" id="prevention_guides_section">
      
      {/* 1. Main Block Collapsible Trigger Bar */}
      <button
        onClick={() => setIsBlockExpanded(!isBlockExpanded)}
        type="button"
        className="w-full text-left bg-slate-50 border-b border-slate-200 p-4.5 flex items-center justify-between cursor-pointer focus:outline-hidden hover:bg-slate-100/60 transition"
      >
        <div className="flex items-center space-x-3.5">
          <div className="bg-blue-600 text-white p-2.5 rounded shadow-sm">
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center space-x-2">
              <span>{lang === 'th' ? 'คู่มือป้องกันโรคระบาดและคลังความรู้เฝ้าระวังภัย' : 'Prevention Guides & Surveillance Brain Bank'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              {lang === 'th' ? 'รวมคู่มือสุขภาพ วิธีดูแลตนเอง และหลักเกณฑ์จำแนกภัยคุกคามอย่างละเอียด' : 'Combined clinical guides, self-care steps, and risk level calculators'}
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isBlockExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* 2. Expandable Panel Details */}
      {isBlockExpanded && (
        <div className="p-5 space-y-5 animate-fade-in">
          
          {/* Sub-Tabs for Merged Views */}
          <div className="flex border-b border-slate-100 pb-2 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('guides')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wide transition-all border rounded-lg cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'guides'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={14} />
              <span>{lang === 'th' ? 'คู่มือป้องกันและสังเกตอาการ' : 'Prevention Guides'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('intel')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wide transition-all border rounded-lg cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'intel'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={14} />
              <span>{lang === 'th' ? 'คลังสมองเฝ้าระวังภัย GIS' : 'Disease Intelligence'}</span>
            </button>
          </div>

          {activeSubTab === 'guides' ? (
            /* SUB-TAB 1: PREVENTION GUIDES */
            <div className="space-y-5 animate-fade-in">
              {/* Info banner */}
              <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl text-slate-800">
                <p className="font-extrabold text-blue-900 uppercase tracking-wide text-xs mb-1 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-blue-600" />
                  <span>{lang === 'th' ? 'เลือกโรคที่ต้องการศึกษาคู่มือการดูแลรักษา' : 'Select a disease to learn about'}</span>
                </p>
                <p className="text-xs md:text-[13px] leading-relaxed font-medium text-slate-700">
                  {lang === 'th' ? 'เลือกหัวข้อโรคระบาดจากแถบด้านล่าง เพื่อเปิดอ่านคู่มือทางการแพทย์อย่างเป็นทางการ วิธีตรวจคัดกรองอาการแสดงเบื้องต้น และวิธีดูแลสุขอนามัยส่วนบุคคลอย่างปลอดภัย' 
                                : 'Select any disease below to display authorized clinical guidelines on checking symptoms, prevention protocols, and primary care.'}
                </p>
              </div>

              {/* Quick Disease Selector Chips */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {preventionData.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    type="button"
                    className={`px-3.5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition border cursor-pointer ${
                      selectedIdx === idx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'th' ? item.disease_th : item.disease_en}
                  </button>
                ))}
              </div>

              {/* Guide Display Card */}
              <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/60 space-y-4.5 animate-fade-in">
                <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                  <h4 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight">
                    {lang === 'th' ? selectedGuide.disease_th : selectedGuide.disease_en}
                  </h4>
                </div>

                {/* 4 Core Topics ordered and translated explicitly with LARGE font sizing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* TOPIC 1: Origin & Transmission */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block font-mono mb-1.5">
                        {lang === 'th' ? '1. โรคนี้มาจากไหน ติดได้อย่างไร?' : '1. Origin & Transmission'}
                      </span>
                      <p className="text-xs md:text-[13px] text-slate-800 leading-relaxed font-bold">
                        {lang === 'th' ? selectedGuide.cause_th : selectedGuide.cause_en}
                      </p>
                    </div>
                  </div>

                  {/* TOPIC 2: Checking symptoms */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block font-mono mb-1.5">
                        {lang === 'th' ? '2. สังเกตอาการอย่างไร? (เช็คอาการ)' : '2. Checking Symptoms'}
                      </span>
                      <p className="text-xs md:text-[13px] text-slate-800 leading-relaxed font-bold">
                        {lang === 'th' ? selectedGuide.symptoms_th : selectedGuide.symptoms_en}
                      </p>
                    </div>
                  </div>

                  {/* TOPIC 3: Prevention methods */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block font-mono mb-1.5">
                        {lang === 'th' ? '3. วิธีป้องกันตนเองและครอบครัว' : '3. Prevention Methods'}
                      </span>
                      <p className="text-xs md:text-[13px] text-slate-800 leading-relaxed font-bold">
                        {lang === 'th' ? selectedGuide.prevention_th : selectedGuide.prevention_en}
                      </p>
                    </div>
                  </div>

                  {/* TOPIC 4: Handling/Treatment methods */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block font-mono mb-1.5">
                        {lang === 'th' ? '4. วิธีรับมือและการดูแลรักษาเบื้องต้น' : '4. Handling & Treatment'}
                      </span>
                      <p className="text-xs md:text-[13px] text-slate-800 leading-relaxed font-bold">
                        {lang === 'th' ? selectedGuide.whatToDo_th : selectedGuide.whatToDo_en}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Disclaimer */}
                <p className="text-[10px] font-extrabold text-slate-400 italic text-center uppercase tracking-wider pt-2 border-t border-slate-150">
                  {lang === 'th' 
                    ? '* ข้อมูลนี้ใช้เพื่อสังเกตเฝ้าระวังเบื้องต้นเท่านั้น หากอาการป่วยไม่ดีขึ้นโปรดเข้าพบแพทย์โรงพยาบาลยะลาโดยทันที' 
                    : '* Provided for emergency reference. Consult professional physicians at Yala Hospital for clinical diagnosis.'}
                </p>
              </div>
            </div>
          ) : (
            /* SUB-TAB 2: DISEASE INTELLIGENCE / BRAIN BANK */
            <div className="space-y-5 animate-fade-in">
              <div className="bg-white p-1 rounded-lg space-y-5">
                
                {/* Environmental Classification grid table with larger read-optimized sizing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  
                  {/* Normal period diseases */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-blue-600 text-white p-4.5 font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-2">
                      <span>☀️</span>
                      <span>{lang === 'th' ? 'กลุ่มโรคระบาดสภาวะปกติ (Normal Period)' : 'Normal Period Diseases'}</span>
                    </div>
                    <div className="p-4 md:p-5 divide-y divide-slate-100 text-xs md:text-sm space-y-3.5">
                      <div className="pt-1">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">1. โรคไข้เลือดออก (Dengue Fever)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'แพร่พันธุ์โดยมียุงลายเป็นพาหะนำโรคหลัก ชอบน้ำขังใส รัศมีความเสี่ยงเฉลี่ยรอบแหล่งกำเนิดคือ 35 เมตร' : 'Transmitted by female Aedes mosquitoes breeding in stagnant clear water. Risk radius: 35 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">2. โรคไข้หวัดใหญ่ (Influenza)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'ติดต่อผ่านสารคัดหลั่ง ละอองฝอยทางระบบหายใจ จากการจามและไอ รัศมีเฝ้าระวังปลอดภัยเฉลี่ย 40 เมตร' : 'Airborne transmission via respiratory droplets. Risk radius: 40 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">3. โรคมือ เท้า ปาก (Hand, Foot, Mouth Disease)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'พบบ่อยในสถานรับเลี้ยงเด็กเล็กและโรงเรียน ติดต่อผ่านน้ำลายและการสัมผัสตุ่มแผล รัศมีปิดกั้นควบคุม 20 เมตร' : 'Contagious in children via saliva, blisters contact or common toys. Control quarantine radius: 20 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">4. โรคอาหารเป็นพิษ (Food Poisoning)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'รับสารแบคทีเรียปนเปื้อนในอาหารบูดเสียช่วงหน้าร้อน รัศมีเสี่ยงรอบแหล่งจำหน่ายอาหารสัมผัส 35 เมตร' : 'Ingestion of raw, improperly refrigerated foods. Risk radius limited to source location: 35 meters.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flood period diseases */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-amber-600 text-white p-4.5 font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-2">
                      <span>🌧️</span>
                      <span>{lang === 'th' ? 'กลุ่มโรคระบาดช่วงอุทกภัย (Flood Scenario)' : 'Flood-Related Outbreaks'}</span>
                    </div>
                    <div className="p-4 md:p-5 divide-y divide-slate-100 text-xs md:text-sm space-y-3.5">
                      <div className="pt-1">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">1. โรคฉี่หนู (Leptospirosis)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'แบคทีเรียผ่านรอยแผลที่ย่ำน้ำโคลนที่มีปัสสาวะสัตว์นำโรค รัศมีระวังระบาดแพร่ขยายตัวได้กว้างสูงสุด 65 เมตร' : 'Contamination of soft soil or floodwaters by rodent urine. Broad quarantine range radius: 65 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">2. โรคอุจจาระร่วงเฉียบพลัน (Diarrhea)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'เกิดจากการขาดแคลนสุขอนามัย น้ำกินน้ำใช้ไม่สะอาดปนเปื้อนจากสุขาเสียหาย รัศมีควบคุมวิเคราะห์ภัย 40 เมตร' : 'Ingestion of dirty water or fecal contamination in supply lines. Danger radius: 40 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">3. โรคผิวหนังอักเสบและน้ำกัดเท้า (Skin Infections)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'เกิดจากการแช่น้ำโสโครกเป็นระยะเวลานาน ทำให้ผิวเปื่อยติดเชื้อยีสต์รา แบคทีเรีย รัศมีควบคุมสัมผัส 30 เมตร' : 'Maceration of skin tissues from standing water. Localized contact threat radius: 30 meters.'}
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-extrabold text-slate-900 block text-xs md:text-sm">4. โรคอหิวาตกโรค (Cholera)</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold mt-1">
                          {lang === 'th' ? 'ระบาดรวดเร็วมากจากระบบประปาและท่อน้ำสุขาภิบาลเมืองที่เสียหายหนัก รัศมีวงล้อมสกัดลามเร่งด่วน 55 เมตร' : 'Rapid outbreak through municipal sanitary grid destruction. Active containment radius: 55 meters.'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Smart Rules explanation banner */}
                <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
                  <p className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-2 text-xs md:text-[13px]">
                    <Info size={16} className="text-blue-600" />
                    <span>{lang === 'th' ? 'หลักเกณฑ์ทางระบาดวิทยาในการประเมินความรุนแรงเชิงพื้นที่' : 'Dynamic Risk Sizing & Contagiousness Calculation Principles'}</span>
                  </p>
                  <p className="leading-relaxed font-bold text-slate-600 text-xs md:text-[13px]">
                    {lang === 'th' ? 'เทศบาลเมืองยะลาใช้หลักระบาดวิทยาในการคำนวณหารัศมีความปลอดภัย โดยอ้างอิงจาก (1) อัตราความรวดเร็วในการแพร่ระบาดของโรคแต่ละสายพันธุ์ (Pathogen Contagiousness Index) (2) ช่องทางการติดต่อ (Transmission vectors) และ (3) ผลกระทบจากปัญหาน้ำท่วมขัง (Hydrological variables) เพื่อสร้างแนวป้องกันเชิงรับรอบบ้านผู้ป่วยรายงานใหม่ ช่วยให้ทีมแพทย์เคลื่อนที่และรถพ่นหมอกควันสกัดวงระบาดได้แม่นยำภายในระยะจำกัดเขต' 
                                  : 'Our surveillance engine parses transmission speeds and fluid vectors to mathematically output dynamic contagion boundaries. High-danger pathogens trigger Red Alerts on our GIS layers instantly for official quarantine response.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
