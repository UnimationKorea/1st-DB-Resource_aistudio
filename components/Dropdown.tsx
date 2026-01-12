
import React from 'react';

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, className }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer hover:bg-white/20 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-gray-800">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};
