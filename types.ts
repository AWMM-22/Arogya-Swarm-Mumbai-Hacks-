export interface Medication {
  id: string;
  name: string;
  dose: string;
  icon: string;
  color: string; // e.g., 'blue', 'orange'
  schedule: {
    [key: string]: boolean | number; // day: hasDose or doseCount
  };
}

export interface ChartData {
  time: string;
  bpm: number;
}