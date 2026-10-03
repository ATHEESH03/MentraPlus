'use client';
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
  className?: string;
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = '',
}: SliderProps) {
  return (
    <label className={`block mt-3 space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="font-semibold text-teal-deep">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-2 bg-paper-deep rounded-lg appearance-none cursor-pointer accent-[#2F6F6A]"
      />
    </label>
  );
}
