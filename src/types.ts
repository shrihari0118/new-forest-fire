export interface Region {
  id: string;
  name: string;
  state: string;
  area: number; // in sq km
  bounds: {
    center: [number, number];
    bounds: [[number, number], [number, number]];
  };
  datasets: {
    dem: boolean;
    weather: boolean;
    lulc: boolean;
    fireHistory: boolean;
  };
}

export interface RiskZone {
  id: number;
  lat: number;
  lng: number;
  risk: 'high' | 'moderate' | 'low';
  confidence: number;
}

export interface PredictionData {
  region: string;
  timestamp: Date;
  riskZones: RiskZone[];
  confidence: number;
  totalArea: number;
  highRiskArea: number;
  moderateRiskArea: number;
  lowRiskArea: number;
}

export interface SimulationData {
  region: string;
  timestamp: Date;
  timeSteps: number[];
  spreadData: { [key: number]: SpreadPoint[] };
  totalBurnedArea: number[];
  spreadRate: number[];
}

export interface SpreadPoint {
  lat: number;
  lng: number;
  intensity: number;
  timestamp: number;
}

export interface ProcessingStep {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}