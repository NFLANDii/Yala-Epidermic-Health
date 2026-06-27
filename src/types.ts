export interface GPSLocation {
  lat: number;
  lng: number;
}

export interface PersonalInfo {
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: string; // "Quarantined" | "Self-Isolating" | "Hospitalized" | "At Home" etc.
  occupation?: string;
  residencyStatus?: string; // e.g. คนในพื้นที่, นอกพื้นที่, นักท่องเที่ยว, ต่างด้าว
  allergies?: string;
  demands?: string;
}

export interface ClinicalInfo {
  symptoms: string[];
  days: number;
  contactHistory: string;
}

export type CaseStatus = 'New' | 'Accepted' | 'Waiting' | 'Completed';
export type SeverityLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'critical' | 'moderate' | 'low';
export type ScenarioMode = 'Normal' | 'Flood';

export interface Case {
  id: string;
  gps: GPSLocation;
  personalInfo: PersonalInfo;
  clinicalInfo: ClinicalInfo;
  disease: string;
  severity: SeverityLevel;
  status: CaseStatus;
  createdAt: string;
  areaName: string; // The subdistrict or neighborhood in Yala Municipality
  priority: PriorityLevel; // Critical, Moderate, Low
  scenario: ScenarioMode;   // Normal or Flood-related
}

export interface DiseaseGuide {
  disease: string;
  cause: string;
  symptoms: string;
  prevention: string;
  whatToDo: string;
  icon?: string;
}
