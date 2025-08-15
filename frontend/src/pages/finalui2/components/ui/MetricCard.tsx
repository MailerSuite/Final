import React from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import SmoothCard from './Card3D';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color?: 'cyan' | 'blue' | 'purple' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  trend = 'neutral',
  subtitle,
  color = 'cyan',
  size = 'md'
}) => {
  const colorClasses = {
    cyan: 'from-cyan-400 to-cyan-600',
    blue: 'from-blue-400 to-blue-600', 
    purple: 'from-purple-400 to-purple-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
    red: 'from-red-400 to-red-600'
  };

  const changeColors = {
    increase: 'text-green-400',
    decrease: 'text-red-400',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : trend === 'down' ? ArrowTrendingDownIcon : null;

  return (
    <SmoothCard variant="gradient" size={size} glow interactive>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {Icon && (
              <div className={`p-2 rounded-xl bg-gradient-to-r ${colorClasses[color]} bg-opacity-20 backdrop-blur-sm`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
            )}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>

          <div className="space-y-1">
            <div className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
              {value}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${changeColors[changeType]}`}>
                {TrendIcon && <TrendIcon className="w-4 h-4" />}
                <span>{change > 0 ? '+' : ''}{change}%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
        </div>

        {/* 3D Visual Element */}
        <motion.div 
          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClasses[color]} opacity-20 blur-xl`}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Progress Bar */}
      {typeof value === 'number' && value <= 100 && (
        <div className="mt-4 h-2 bg-card rounded-full overflow-hidden">
          <motion.div 
            className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      )}
    </SmoothCard>
  );
};

export default MetricCard;