import React from 'react';
import { Medication } from '../types';
import { Icons } from './ui/Icons';

const days = ['Mon 20', 'Tue 21', 'Wed 22', 'Thu 23', 'Fri 24', 'Sat 25', 'Sun 26'];

const medications: Medication[] = [
  {
    id: '1',
    name: 'Albufin',
    dose: '20mg',
    icon: 'pill',
    color: 'blue',
    schedule: { 'Tue 21': 1 }
  },
  {
    id: '2',
    name: 'Vitamin D',
    dose: '100mg',
    icon: 'bottle',
    color: 'cyan',
    schedule: { 'Wed 22': 2 }
  },
  {
    id: '3',
    name: 'Omega 3',
    dose: 'Design by Fluttertop',
    icon: 'bottle',
    color: 'blue',
    schedule: { 'Thu 23': 2 }
  },
  {
    id: '4',
    name: 'Ibuprofen',
    dose: '75mg',
    icon: 'bottle',
    color: 'cyan',
    schedule: { 'Fri 24': 2 }
  },
  {
    id: '5',
    name: 'Aspirin',
    dose: 'Fluttertop',
    icon: 'bottle',
    color: 'mixed',
    schedule: { 'Wed 22': 2, 'Thu 23': 1 }
  }
];

const MedicationRow: React.FC<{ med: Medication }> = ({ med }) => {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4 py-3 border-b border-white/5 last:border-0">
      {/* Med Info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Icons.Pill className="w-4 h-4 text-gray-300" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{med.name}</span>
          <span className="text-[10px] text-gray-500">{med.dose}</span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative h-10 flex items-center">
         {/* Dashed line background */}
         <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-white/10 -translate-y-1/2" />
         
         <div className="grid grid-cols-7 w-full h-full">
            {days.map((day) => {
              const dose = med.schedule[day];
              if (!dose) return <div key={day} className="h-full" />;
              
              const isBlue = med.color === 'blue';
              const isCyan = med.color === 'cyan';
              const bgColor = isBlue ? 'bg-primary' : (isCyan ? 'bg-secondary' : 'bg-orange-500'); // simplistic fallback
              
              // Custom logic for the mixed case or specific styling from the image
              let pillClass = "bg-primary text-white";
              if (med.color === 'cyan') pillClass = "bg-[#00C2FF] text-black";
              if (med.color === 'mixed') pillClass = "bg-gradient-to-r from-orange-400 to-pink-500 text-white";

              return (
                <div key={day} className="flex items-center justify-center relative z-10">
                   <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg ${pillClass}`}>
                      <Icons.Sun className="w-3 h-3" />
                      <span className="text-xs font-bold">{dose}</span>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};

const MedicationTimeline: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-200">Medication</h3>
      </div>
      
      {/* Date Headers */}
      <div className="grid grid-cols-[160px_1fr] gap-4 mb-2">
        <div></div> {/* Spacer for names */}
        <div className="grid grid-cols-7 text-[10px] uppercase tracking-wider text-gray-500 font-medium text-center">
           {days.map((d, i) => (
             <div key={i}>{d}</div>
           ))}
        </div>
      </div>

      <div className="flex flex-col">
        {medications.map(med => (
          <MedicationRow key={med.id} med={med} />
        ))}
      </div>
    </div>
  );
};

export default MedicationTimeline;