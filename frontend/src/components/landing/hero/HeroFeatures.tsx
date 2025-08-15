import React from 'react';

interface HeroFeatureItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface HeroFeaturesProps {
  items: HeroFeatureItem[];
}

export const HeroFeatures: React.FC<HeroFeaturesProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.title} className="p-6 rounded-lg border bg-card/60 backdrop-blur-sm">
          <div className="mb-2 text-red-500">{item.icon}</div>
          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </div>
      ))}
    </div>
  );
};