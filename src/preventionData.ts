export interface BilingualDiseaseGuide {
  disease_th: string;
  disease_en: string;
  cause_th: string;
  cause_en: string;
  symptoms_th: string;
  symptoms_en: string;
  prevention_th: string;
  prevention_en: string;
  whatToDo_th: string;
  whatToDo_en: string;
  icon: string;
}

export const preventionData: BilingualDiseaseGuide[] = [
  {
    disease_th: 'โรคไข้เลือดออก',
    disease_en: 'Dengue Fever',
    cause_th: 'ติดต่อผ่านการกัดของยุงลายตัวเมีย (ยุงลายบ้าน Aedes aegypti) ที่มีเชื้อไวรัสเดงกี ยุงชนิดนี้มักเพาะพันธุ์ในน้ำสะอาดที่ขังนิ่งในภาชนะต่างๆ รอบๆ บ้าน',
    cause_en: 'Bite of an infected female Aedes mosquito (mainly Aedes aegypti) which breeds in clean, stagnant water containers around households.',
    symptoms_th: 'มีไข้สูงเฉียบพลัน (39-40°C) ติดต่อกัน 2-7 วัน, ปวดศีรษะรุนแรง, ปวดกระบอกตา, ปวดเมื่อยกล้ามเนื้อและข้อต่ออย่างมาก, คลื่นไส้, อาเจียน, มีผื่นแดง หรือมีจุดเลือดออกตามผิวหนัง',
    symptoms_en: 'High fever (up to 104°F/40°C), severe headache, pain behind the eyes, joint and muscle aches, fatigue, nausea, vomiting, and skin rash.',
    prevention_th: 'ใช้หลัก 3 เก็บ (เก็บบ้าน เก็บขยะ เก็บน้ำ) เพื่อป้องกันยุงลาย: ปิดฝาภาชนะบรรจุน้ำให้มิดชิด เปลี่ยนน้ำในแจกันทุกสัปดาห์ ปล่อยปลากินลูกน้ำ ทายากันยุง นอนในมุ้ง และสนับสนุนเทศบาลในการพ่นหมอกควันกำจัดยุง',
    prevention_en: 'Eliminate stagnant water in pots, tires, and jars. Cover water storage containers. Use mosquito repellents and mosquito nets. Support municipality chemical misting (fogging) schedules.',
    whatToDo_th: 'ดื่มน้ำหรือน้ำเกลือแร่บ่อยๆ ทานยาพาราเซตามอลเพื่อลดไข้ (ห้ามทานยาแอสไพรินหรือไอบูโพรเฟนเด็ดขาดเพราะอาจทำให้เลือดออกภายในรุนแรงขึ้น) หากมีอาการเตือนภัย เช่น ปวดท้องรุนแรง อาเจียนบ่อย เลือบออกตามไรฟัน ซึมกระสับกระส่าย ให้รีบไปโรงพยาบาลยะลาทันที',
    whatToDo_en: 'Drink plenty of oral rehydration fluids. Take paracetamol for fever (AVOID aspirin or ibuprofen as they can worsen bleeding). If warning signs appear (severe abdominal pain, persistent vomiting, bleeding gums, fatigue), seek immediate care at Yala Hospital.',
    icon: 'ShieldAlert'
  },
  {
    disease_th: 'โรคฉี่หนู',
    disease_en: 'Leptospirosis',
    cause_th: 'ติดต่อผ่านการสัมผัสกับปัสสาวะของสัตว์นำโรค (ส่วนใหญ่เป็นหนู) ที่ปนเปื้อนอยู่ในน้ำ ดิน โคลน หรืออาหาร โดยเชื้อจะชอนไชเข้าทางบาดแผล ผิวหนังที่เปื่อยจากการแช่น้ำนานๆ หรือเยื่อบุตาและปาก',
    cause_en: 'Bacteria from urine of infected rodents (rats) contaminating floodwaters, damp soil, or mud. The pathogen penetrates skin abrasions, waterlogged skin, or mucous membranes.',
    symptoms_th: 'ไข้สูงหนาวสั่นเฉียบพลัน, ปวดศีรษะรุนแรง, ปวดกล้ามเนื้ออย่างรุนแรงโดยเฉพาะที่น่องและโคนขา, ตาแดงกระตุก, คลื่นไส้, และอาจเกิดภาวะแทรกซ้อนรุนแรง เช่น ตัวเหลือง ตาเหลือง (ดีซ่าน) หรือไตวายเฉียบพลัน',
    symptoms_en: 'Sudden high fever, chills, severe headache, intense muscle aches (especially in calves and lower back), red eyes (conjunctival suffusion), vomiting, diarrhea, jaundice (yellow skin/eyes), and potential kidney failure.',
    prevention_th: 'หลีกเลี่ยงการเดินลุยน้ำท่วมขังหรือโคลนด้วยเท้าเปล่า หากจำเป็นต้องเดินลุยน้ำให้สวมรองเท้าบูทยางทุกครั้ง ล้างทำความสะอาดมือและเท้าด้วยสบู่ทันทีหลังจากขึ้นจากน้ำ ควบคุมและกำจัดหนูในบริเวณที่อยู่อาศัย ปิดฝาอาหารและน้ำดื่มให้มิดชิด',
    prevention_en: 'Avoid wading in stagnant floodwaters, mud, or sewage barefoot. Always wear high rubber boots if water contact is unavoidable. Wash hands and limbs thoroughly with soap immediately. Keep food covered and exterminate rodents.',
    whatToDo_th: 'หากมีไข้สูงเฉียบพลันหลังจากแช่น้ำลุยโคลนภายใน 1-2 สัปดาห์ ให้รีบไปพบแพทย์ที่โรงพยาบาลหรืออนามัยเทศบาลนครยะลาทันที แจ้งประวัติการแช่น้ำลุยโคลนให้ละเอียดเพื่อรับยาปฏิชีวนะประคองอาการตั้งแต่ระยะเริ่มต้น',
    whatToDo_en: 'If high fever or severe calf pain develops within 1-2 weeks after wading in floodwaters, seek urgent medical treatment at Yala Hospital. Disclose exposure history to receive early antibiotic therapy.',
    icon: 'Droplet'
  },
  {
    disease_th: 'โรคอหิวาตกโรค',
    disease_en: 'Cholera',
    cause_th: 'ติดต่อจากการรับประทานอาหารหรือน้ำดื่มที่ปนเปื้อนเชื้อแบคทีเรีย Vibrio cholerae ซึ่งมักระบาดได้ง่ายขึ้นในสภาวะน้ำท่วมขังเนื่องจากระบบสุขาภิบาลและระบบกรองน้ำถูกทำลาย',
    cause_en: 'Ingestion of food or water contaminated with Vibrio cholerae. Easily spreads during floods when clean water supplies and sanitation infrastructure are compromised.',
    symptoms_th: 'อุจจาระร่วงรุนแรง ถ่ายเป็นน้ำปริมาณมากคล้ายน้ำซาวข้าวโดยไม่มีอาการปวดท้อง, อาเจียนบ่อย, ตะคริวตามเนื้อตัว, อ่อนเพลียอย่างรุนแรงเนื่องจากการสูญเสียน้ำและเกลือแร่อย่างรวดเร็ว ซึ่งเป็นอันตรายถึงชีวิต',
    symptoms_en: 'Profuse painless watery diarrhea (often described as "rice-water stools"), rapid dehydration, severe vomiting, muscle cramps, and extreme lethargy, leading to hypovolemic shock if untreated.',
    prevention_th: 'ดื่มน้ำสะอาดบรรจุขวดที่ผ่านการฆ่าเชื้อหรือน้ำต้มสุกเท่านั้น รับประทานอาหารที่ปรุงสุกใหม่ๆ ร้อนๆ ล้างมือให้สะอาดก่อนรับประทานอาหารและหลังขับถ่ายทุกครั้ง หลีกเลี่ยงผักสดปนเปื้อนน้ำท่วมขัง',
    prevention_en: 'Drink only bottled or boiled water. Consume freshly cooked hot foods. Avoid raw vegetables or food rinsed in floodwaters. Practice meticulous handwashing with soap.',
    whatToDo_th: 'ละลายผงเกลือแร่ (ORS) ดื่มในปริมาณมากๆ เพื่อทดแทนน้ำที่เสียไป หากอาการถ่ายร่วงไม่ทุเลา หรือมีภาวะช็อก ตากระตุก ตัวเย็น ขาดน้ำรุนแรง ให้ประคองผู้ป่วยส่งแผนกฉุกเฉินโรงพยาบาลยะลาทันทีเพื่อรับน้ำเกลือทางหลอดเลือดดำ',
    whatToDo_en: 'Initiate oral rehydration solution (ORS) immediately. If severe diarrhea persists, or signs of shock (cold skin, sunken eyes, rapid pulse) appear, transport the patient to Yala Hospital emergency room for IV fluids.',
    icon: 'Flame'
  },
  {
    disease_th: 'โรคอุจจาระร่วงเฉียบพลัน',
    disease_en: 'Diarrhea',
    cause_th: 'เกิดจากเชื้อไวรัส โรตาไวรัส หรือแบคทีเรียปนเปื้อนในอาหาร น้ำ และภาชนะที่ไม่สะอาด มักเกิดขึ้นระหว่างอุทกภัยเพราะแหล่งน้ำสะอาดขาดแคลน',
    cause_en: 'Infection from rotavirus, norovirus, or bacteria via fecal-oral route. High incidence during floods due to contaminated municipal drinking water channels.',
    symptoms_th: 'ถ่ายอุจจาระเหลวหรือเป็นน้ำมากกว่า 3 ครั้งต่อวัน, ปวดมวนท้องรุนแรง, มีไข้ต่ำๆ, คลื่นไส้อาเจียน, และมีอาการขาดน้ำปานกลาง',
    symptoms_en: 'Loose or watery stool 3 or more times in 24 hours, abdominal pain, mild fever, nausea, vomiting, and moderate dehydration.',
    prevention_th: 'กินร้อน ช้อนกลาง ล้างมือ และดื่มน้ำสะอาดต้มสุก เปลี่ยนถ่ายภาชนะบรรจุน้ำสะอาดเก็บไว้พ้นมือเด็กและสัตว์เลื้อยคลาน ล้างผักและเนื้อสัตว์ให้สะอาดด้วยน้ำยาล้างผักปลอดสารเคมี',
    prevention_en: 'Eat cooked food, use personal spoons, wash hands frequently, drink boiled water, and cover water storage containers tightly.',
    whatToDo_th: 'จิบนมหรือสารละลายผงเกลือแร่ ORS บ่อยๆ เพื่อรักษาสมดุลน้ำในร่างกาย ทานอาหารอ่อนๆ ที่ย่อยง่าย เช่น โจ๊ก ข้าวต้ม งดอาหารรสจัด หากอาการรุนแรงขึ้นมีไข้สูง ถ่ายเป็นมูกเลือด ให้รีบนำส่งพบแพทย์',
    whatToDo_en: 'Sip ORS liquids continuously, eat soft easily digestible meals (rice soup, porridge), and avoid rich, spicy food. Seek medical attention if high fever or bloody mucus is present.',
    icon: 'ShieldAlert'
  },
  {
    disease_th: 'โรคผิวหนังอักเสบและน้ำกัดเท้า',
    disease_en: 'Skin Infection / Athlete\'s Foot',
    cause_th: 'เกิดจากการที่ผิวหนังเท้าสัมผัสสิ่งสกปรกและอับชื้นในน้ำท่วมขังเป็นเวลานานจนเกิดแผลเปื่อย ตามด้วยการติดเชื้อราหรือเชื้อแบคทีเรียแทรกซ้อนตามซอกนิ้วเท้า',
    cause_en: 'Prolonged exposure of skin to floodwater, mud, and continuous dampness causing maceration, followed by secondary fungal (Tinea) or bacterial infections.',
    symptoms_th: 'ผิวหนังซอกนิ้วเท้าเปื่อย แดง คัน อักเสบ หากติดเชื้อแบคทีเรียแทรกซ้อนจะมีตุ่มหนอง มีกลิ่นเหม็น ปวดบวมแดง และอาจมีไข้ต่ำๆ',
    symptoms_en: 'Itching, scaling, redness, and painful maceration between toes. Bacterial complications can cause warm swelling, pus, foul smell, and localized pain.',
    prevention_th: 'หลีกเลี่ยงการแช่น้ำเป็นเวลานาน หากหลีกเลี่ยงไม่ได้ให้รีบเช็ดเท้าให้แห้งสนิททันทีหลังพ้นจากน้ำ ทายาป้องกันเชื้อราตามซอกนิ้วเท้า และล้างเท้าด้วยสบู่ยาทำความสะอาดเชื้อโรคพยาธิ',
    prevention_en: 'Keep feet clean and completely dry. If feet touch dirty water, wash with soap immediately and dry with a clean cloth. Apply antifungal creams to susceptible toe clefts.',
    whatToDo_th: 'ทายาฆ่าเชื้อราหรือขี้ผึ้งรักษาน้ำกัดเท้าสม่ำเสมอ หากมีตุ่มหนอง ปวด บวม แดง มีการอักเสบลุกลาม ให้ล้างทำความสะอาดแผลด้วยแอลกอฮอล์หรือเบตาดีน และไปพบแพทย์เพื่อพิจารณายาปฏิชีวนะชนิดกิน',
    whatToDo_en: 'Apply topical antifungal or antiseptic ointments regularly. If warm swelling, severe pain, or red streaks develop, disinfect with iodine and consult a physician for oral antibiotics.',
    icon: 'Activity'
  },
  {
    disease_th: 'โรคอาหารเป็นพิษ',
    disease_en: 'Food Poisoning',
    cause_th: 'เกิดจากการรับประทานอาหารที่ปนเปื้อนสารพิษของเชื้อแบคทีเรียหรือเชื้อจุลินทรีย์ที่เจริญเติบโตในอาหารที่บูดเสีย หรือเตรียมไม่ถูกสุขลักษณะ',
    cause_en: 'Consumption of food contaminated with bacterial toxins (e.g., Staphylococcus aureus, Bacillus cereus) due to poor refrigeration or unsanitary handling.',
    symptoms_th: 'คลื่นไส้ อาเจียนอย่างรุนแรงร่วมกับอาการปวดท้องเกร็ง ถ่ายอุจจาระเหลว มีไข้หนาวสั่น ปวดศีรษะ และกล้ามเนื้อล้า',
    symptoms_en: 'Severe nausea, rapid onset of projectile vomiting, abdominal cramps, diarrhea, fever, headache, and generalized muscle weakness.',
    prevention_th: 'เลือกรับประทานอาหารที่ปรุงสุกใหม่ๆ หลีกเลี่ยงอาหารค้างคืนที่ไม่ได้อุ่นร้อน ไม่รับประทานอาหารที่มีกลิ่น สี หรือรสชาติผิดปกติ ล้างภาชนะที่เตรียมอาหารให้สะอาดสะอ้านอยู่เสมอ',
    prevention_en: 'Eat freshly prepared meals, heat leftovers thoroughly before eating, avoid food that has been stored at room temperature, and maintain strict kitchen hygiene.',
    whatToDo_th: 'ดื่มน้ำและผงเกลือแร่ ORS ชดเชยการสูญเสียน้ำจากการอาเจียน พักผ่อนร่างกาย งดรับประทานอาหารที่มีไขมันสูง หากอาเจียนรุนแรงจนดื่มน้ำไม่ได้และมีไข้สูง ให้รีบไปรับการรักษาที่ศูนย์แพทย์สาธารณสุขเทศบาล',
    whatToDo_en: 'Stay hydrated by sipping ORS solution or clear fluids. Rest your digestive system by eating bland food like crackers. Seek clinical care if vomiting prevents oral fluid intake.',
    icon: 'Users'
  }
];

