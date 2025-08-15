import React from 'react';
import { motion } from 'framer-motion';
import SmoothCard from './Card3D';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DataVisualizationProps {
  title: string;
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'donut' | 'area';
  height?: number;
  showLegend?: boolean;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  title,
  data,
  type,
  height = 200,
  showLegend = true
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#22d3ee', '#3b82f6', '#8b5cf6', '#06d6a0', '#f59e0b', '#ef4444'];

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((point, index) => (
        <motion.div 
          key={point.label}
          className="flex flex-col items-center flex-1 min-w-0"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.div
            className="w-full rounded-t-lg relative overflow-hidden"
            style={{ 
              backgroundColor: point.color || colors[index % colors.length],
              opacity: 0.8
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(point.value / maxValue) * 100}%` }}
            transition={{ 
              duration: 0.8,
              delay: index * 0.1,
              ease: "easeOut"
            }}
            whileHover={{ opacity: 1, scale: 1.05 }}
          >
            {/* Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-white/30 pointer-events-none" />
            
            {/* Value Label */}
            <motion.div 
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white bg-background/80 px-2 py-1 rounded backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              {point.value}
            </motion.div>
          </motion.div>
          
          <div className="text-xs text-muted-foreground mt-2 truncate w-full text-center">
            {point.label}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (point.value / maxValue) * 80
    }));

    const pathD = points.reduce((path, point, index) => {
      return index === 0 
        ? `M ${point.x} ${point.y}`
        : `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
      <div className="relative w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid Lines */}
          {[20, 40, 60, 80].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Area Fill */}
          <motion.path
            d={`${pathD} L 100 100 L 0 100 Z`}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
          />
          
          {/* Line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {/* Data Points */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#22d3ee"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              whileHover={{ scale: 1.5, fill: "#06d6a0" }}
            />
          ))}
          
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  const renderDonutChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.map((point, index) => {
              const percentage = (point.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -currentAngle;
              currentAngle += percentage;

              return (
                <motion.circle
                  key={point.label}
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke={point.color || colors[index % colors.length]}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDasharray: "0 100" }}
                  animate={{ strokeDasharray }}
                  transition={{ 
                    duration: 1,
                    delay: index * 0.2,
                    ease: "easeOut"
                  }}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              );
            })}
          </svg>
          
          {/* Center Value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-cyan-400">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const chartRenderers = {
    bar: renderBarChart,
    line: renderLineChart,
    area: renderLineChart,
    donut: renderDonutChart
  };

  return (
    <SmoothCard variant="gradient" size="lg" glow interactive>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150" />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300" />
          </div>
        </div>
        
        <div className="relative" style={{ height }}>
          {chartRenderers[type]()}
        </div>
        
        {showLegend && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
            {data.map((point, index) => (
              <motion.div 
                key={point.label}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: point.color || colors[index % colors.length] }}
                />
                <span className="text-muted-foreground">{point.label}</span>
                <span className="text-muted-foreground">({point.value})</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SmoothCard>
  );
};

export default DataVisualization;