import React, { useState } from 'react';
import { Play, SkipForward, ArrowRight, ArrowLeft, CheckCircle, HelpCircle, Shield, Award, MapPin, TrendingUp, BookOpen } from 'lucide-react';
import YalaEpidemicLogo from './YalaEpidemicLogo';

interface UserTutorialProps {
  lang: 'th' | 'en';
  onClose: () => void;
}

export default function UserTutorial({ lang, onClose }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      titleTh: 'ยินดีต้อนรับสู่พอร์ทัล Yala Epidemic Surveillance Portal',
      titleEn: 'Welcome to Yala Epidemic Surveillance Portal',
      descriptionTh: 'ยินดีต้อนรับเข้าสู่ระบบเฝ้าระวังและรับมือโรคระบาดอัจฉริยะแบบ GIS สำหรับเทศบาลนครยะลา ระบบนี้รวบรวมข้อมูลสาธารณสุขและประสานงานกู้ภัยอย่างเป็นส่วนตัวและแม่นยำ',
      descriptionEn: 'Welcome to the GIS-based epidemic surveillance portal for Yala City Municipality. This portal provides sanitary monitoring, live alerts, and official coordinate tracking.',
      icon: <YalaEpidemicLogo size={70} />,
      highlightId: 'left_sidebar'
    },
    {
      titleTh: 'หน้าหลัก: สถิติรวมและแดชบอร์ดสรุปยอดผู้ป่วย',
      titleEn: 'Home: Consolidation Dashboard & Case Counts',
      descriptionTh: 'หน้าหลักแสดงสถิติสะสมรวมที่ดึงจากระบบฐานข้อมูล ประกอบด้วยยอดผู้ติดโรคทั้งหมด, ยอดกักตัวแยกกันโรค, ยอดรอผลตรวจแล็บ และประวัติที่พ้นระยะโรคแล้ว',
      descriptionEn: 'The homepage displays consolidated active stats, tracking Total Reported Cases, Active Quarantined Patients, Pending Test Results, and Successfully Recovered Cases.',
      icon: <Shield size={48} className="text-blue-500" />,
      highlightId: 'consolidated_dashboard_stats'
    },
    {
      titleTh: 'หน้าหลัก: แถบข่าวด่วนวิ่งแจ้งเหตุ (Marquee News Ticker)',
      titleEn: 'Home: Scrolling Breaking News Marquee',
      descriptionTh: 'แถบข่าวด่วนกึ่งกลางหน้าจอจะคอยเลื่อนแสดงข่าวสารและสถานการณ์โรคระบาดล่าสุด ดึงข้อมูลแบบเรียลไทม์จากระบบประสานงานสาธารณสุขเพื่อความรวดเร็วสูงสุด',
      descriptionEn: 'The automated marquee ticker scrolling across the dashboard presents active epidemic alerts synchronized instantly from administrative news broadcasts.',
      icon: <TrendingUp size={48} className="text-cyan-500 animate-pulse" />,
      highlightId: 'marquee_news_ticker'
    },
    {
      titleTh: 'แผนที่ระบาดวิทยา: คลื่นน้ำเตือนภัยและวงรัศมีระบาดวิทยา',
      titleEn: 'GIS Map: Epidemic Water Wave & Dynamic Circle Overlays',
      descriptionTh: 'แผนที่แสดงตำแหน่งการแพร่ระบาดผ่านวงแหวน "เอฟเฟคคลื่นน้ำกระจาย" สวยงามและเด่นสะดุดตา พร้อมแถบวงกลมรัศมีคลาดเคลื่อนแยกตามแต่ละประเภทของโรคเพื่อเตือนผู้คน',
      descriptionEn: 'Hotspots exhibit glowing concentric "water wave ripple" rings and colored transmission circles customized based on specific transmission radii of each disease.',
      icon: <MapPin size={48} className="text-rose-500 animate-bounce" />,
      highlightId: 'gis_map_canvas_container'
    },
    {
      titleTh: 'แผนที่ระบาดวิทยา: การดูประวัติเจ้าหน้าที่และตัวสแกนพิกัด',
      titleEn: 'GIS Map: Draggable Target & Completed Green Icons',
      descriptionTh: 'สำหรับเจ้าหน้าที่ สามารถใช้เครื่องมือปักหมุดระบุพิกัดโดยลากหมุดน้ำเงิน (📍) และสามารถเปลี่ยนโหมดกรองพิกัด เพื่อแสดงประวัติภารกิจที่ทำเสร็จแล้ว (แสดงหมุดไอคอนสีเขียว) หรือแบบผสมได้',
      descriptionEn: 'Officials can target any spot by dragging the blue marker (📍) or filter the map view to display Completed History (rendered with green pins) or mixed active/completed views.',
      icon: <Award size={48} className="text-emerald-500" />,
      highlightId: 'map_pinning_toolbox'
    },
    {
      titleTh: 'แผนที่ระบาดวิทยา: แผงควบคุมสเต็ปกักกัน (Official Workflow)',
      titleEn: 'GIS Map: Dynamic Patient Containment Workflows',
      descriptionTh: 'เมื่อเจ้าหน้าที่คลิกที่จุดระบาด จะเปิดแผงข้อมูลผู้ป่วยขึ้นมา (ปุ่มปิดย้ายขึ้นด้านบนเพื่อความสะดวก) และมีเมนูให้กดรับกักตัวผู้ป่วย ➔ สั่งรอผลแล็บ ➔ เคลียร์เคสพ้นระยะโรค',
      descriptionEn: 'Tapping a hotspot expands a detailed dashboard (close button placed at the top). Officers can advance state controls: Admit Patient ➔ Wait Results ➔ Complete Mission.',
      icon: <HelpCircle size={48} className="text-yellow-500" />,
      highlightId: 'map_containment_panel'
    },
    {
      titleTh: 'พอร์ทัลสถิติ: กรองข้อมูลความเสี่ยงและกราฟแนวโน้ม',
      titleEn: 'Analytics Center: Demographic Charts & Risk Proportions',
      descriptionTh: 'วิเคราะห์อัตราส่วนผู้ติดโรคแยกตามเพศ ช่วงอายุ และสถิติแนวโน้มเป็นช่วงเวลาด้วยกราฟ Recharts อัจฉริยะ สามารถเลือกดูเฉพาะโรคนั้นๆ ได้เสถียร 100%',
      descriptionEn: 'Visualize patient details segmented by age, gender ratios, and time series. Easily filter the statistics using the responsive disease scrollable dropdown menu.',
      icon: <TrendingUp size={48} className="text-purple-500" />,
      highlightId: 'analytics_charts_section'
    },
    {
      titleTh: 'ลงทะเบียนพิกัดใหม่: การนำเข้ารายงานระบาดวิทยา',
      titleEn: 'Case Reporter: Active Ingestion & Health Logging',
      descriptionTh: 'แบบฟอร์มบันทึกข้อมูลระบาดวิทยาใหม่ระบุพิกัด ละติจูด ลองจิจูด ความด่วน อาการสำคัญ และประวัติการสัมผัสโรคนำไปแปรผลขึ้นบนแผนที่ GIS ทันที',
      descriptionEn: 'Submit new cases with custom coordinates, chief symptoms, demographic variables, contact histories, and clinical urgency levels to update the map instantly.',
      icon: <BookOpen size={48} className="text-orange-500" />,
      highlightId: 'case_logging_form'
    },
    {
      titleTh: 'คู่มือการป้องกันและคลังข้อมูลสารเคมีป้องกันระบาด',
      titleEn: 'Surveillance Brain Bank: Central Prevention Protocols',
      descriptionTh: 'รวบรวมข้อมูลสารเคมีป้องกันโรค สารระงับไข้เลือดออก วิธีดูแลตนเอง และขั้นตอนปฐมพยาบาลเบื้องต้นเข้าไว้ด้วยกัน ค้นหาหัวข้อที่กังวลได้ง่าย รวดเร็ว และเป็นระบบ',
      descriptionEn: 'Browse a unified database featuring sanitization guidelines, chemical prevention metrics, symptom identification, and standard clinical response protocols.',
      icon: <BookOpen size={48} className="text-indigo-500" />,
      highlightId: 'prevention_knowledge_hub'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('surveillance_tutorial_completed', 'true');
    onClose();
  };

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="user_tutorial_overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in flex flex-col">
        {/* Top visual accent */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
              {lang === 'th' ? 'แนะนำการใช้งานระบบเบื้องต้น' : 'Interactive System Walkthrough'}
            </h4>
          </div>
          <button 
            onClick={handleComplete}
            className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition uppercase cursor-pointer"
            type="button"
          >
            <SkipForward size={12} />
            <span>{lang === 'th' ? 'ข้ามสอน' : 'Skip Tour'}</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4 flex-1">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center shadow-2xs h-24 w-24">
            {activeStep.icon}
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base md:text-lg leading-tight tracking-tight">
              {lang === 'th' ? activeStep.titleTh : activeStep.titleEn}
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-semibold leading-relaxed max-w-sm mx-auto">
              {lang === 'th' ? activeStep.descriptionTh : activeStep.descriptionEn}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center space-x-2 pt-2">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`text-slate-600 hover:text-slate-950 text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-lg transition border border-slate-200 bg-white ${
              currentStep === 0 ? 'opacity-30 pointer-events-none' : 'cursor-pointer'
            }`}
            type="button"
          >
            <ArrowLeft size={14} />
            <span>{lang === 'th' ? 'ย้อนกลับ' : 'Back'}</span>
          </button>

          <button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg transition shadow-md shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
            type="button"
          >
            <span>{currentStep === steps.length - 1 ? (lang === 'th' ? 'เสร็จสิ้น' : 'Finish') : (lang === 'th' ? 'ถัดไป' : 'Next')}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
