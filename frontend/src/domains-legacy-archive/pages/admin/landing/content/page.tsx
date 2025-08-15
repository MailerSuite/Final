/**
 * Landing Page Content Management
 * Admin interface for managing landing page sections, features, and pricing
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import axios from 'axios';

interface LandingSection {
  id?: string;
  section_type: string;
  content: Record<string, any>;
  is_active: boolean;
  order_index: number;
}

interface LandingFeature {
  id?: string;
  title: string;
  description: string;
  icon: string;
  tech_stack?: string;
  gradient?: string;
  animation?: string;
  is_active: boolean;
  order_index: number;
}

interface LandingPricing {
  id?: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon?: string;
  is_popular: boolean;
  badge_text?: string;
  cta_text: string;
  is_active: boolean;
  order_index: number;
}

export default function AdminLandingContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');
  
  // State for content
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [features, setFeatures] = useState<LandingFeature[]>([]);
  const [pricing, setPricing] = useState<LandingPricing[]>([]);
  
  // Hero section state
  const [heroContent, setHeroContent] = useState({
    headline: '',
    subheadline: '',
    ctaText: 'Start Free Trial',
    ctaLink: '/auth/register',
    showVideo: false,
    videoUrl: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch sections
      const sectionsRes = await axios.get('/api/v1/admin/landing/sections');
      setSections(sectionsRes.data);
      
      // Extract hero content
      const heroSection = sectionsRes.data.find((s: LandingSection) => s.section_type === 'hero');
      if (heroSection) {
        setHeroContent(heroSection.content);
      }
      
      // Fetch features
      const featuresRes = await axios.get('/api/v1/admin/landing/features');
      setFeatures(featuresRes.data);
      
      // Fetch pricing
      const pricingRes = await axios.get('/api/v1/admin/landing/pricing');
      setPricing(pricingRes.data);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load landing page content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveHeroSection = async () => {
    try {
      setSaving(true);
      await axios.post('/api/v1/admin/landing/sections', {
        section_type: 'hero',
        content: heroContent,
        is_active: true,
        order_index: 0
      });
      
      toast({
        title: 'Success',
        description: 'Hero section updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save hero section',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveFeature = async (feature: LandingFeature) => {
    try {
      if (feature.id) {
        await axios.put(`/api/v1/admin/landing/features/${feature.id}`, feature);
      } else {
        await axios.post('/api/v1/admin/landing/features', feature);
      }
      
      toast({
        title: 'Success',
        description: 'Feature saved successfully'
      });
      
      fetchContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save feature',
        variant: 'destructive'
      });
    }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    
    try {
      await axios.delete(`/api/v1/admin/landing/features/${id}`);
      
      toast({
        title: 'Success',
        description: 'Feature deleted successfully'
      });
      
      fetchContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete feature',
        variant: 'destructive'
      });
    }
  };

  const savePricing = async (plan: LandingPricing) => {
    try {
      if (plan.id) {
        await axios.put(`/api/v1/admin/landing/pricing/${plan.id}`, plan);
      } else {
        await axios.post('/api/v1/admin/landing/pricing', plan);
      }
      
      toast({
        title: 'Success',
        description: 'Pricing plan saved successfully'
      });
      
      fetchContent();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save pricing plan',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Landing Page Content</h1>
        <Button
          variant="outline"
          onClick={() => window.open('http://localhost:3001', '_blank')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Landing Page
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Headline</label>
                <Input
                  value={heroContent.headline}
                  onChange={(e) => setHeroContent({...heroContent, headline: e.target.value})}
                  placeholder="Transform Your Email Marketing with AI"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subheadline</label>
                <Textarea
                  value={heroContent.subheadline}
                  onChange={(e) => setHeroContent({...heroContent, subheadline: e.target.value})}
                  placeholder="Next-generation platform powered by GPT-4"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">CTA Button Text</label>
                  <Input
                    value={heroContent.ctaText}
                    onChange={(e) => setHeroContent({...heroContent, ctaText: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">CTA Button Link</label>
                  <Input
                    value={heroContent.ctaLink}
                    onChange={(e) => setHeroContent({...heroContent, ctaLink: e.target.value})}
                  />
                </div>
              </div>
              
              <Button onClick={saveHeroSection} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Hero Section
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Features</h2>
            <Button
              onClick={() => {
                const newFeature: LandingFeature = {
                  title: 'New Feature',
                  description: 'Feature description',
                  icon: 'Star',
                  tech_stack: '',
                  gradient: 'from-blue-500 to-purple-500',
                  animation: 'float',
                  is_active: true,
                  order_index: features.length
                };
                setFeatures([...features, newFeature]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <Card key={feature.id || index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move mt-2" />
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={feature.title}
                          onChange={(e) => {
                            const updated = [...features];
                            updated[index] = {...feature, title: e.target.value};
                            setFeatures(updated);
                          }}
                          placeholder="Feature Title"
                        />
                        
                        <Input
                          value={feature.icon}
                          onChange={(e) => {
                            const updated = [...features];
                            updated[index] = {...feature, icon: e.target.value};
                            setFeatures(updated);
                          }}
                          placeholder="Icon (e.g., Brain, Shield, Zap)"
                        />
                      </div>
                      
                      <Textarea
                        value={feature.description}
                        onChange={(e) => {
                          const updated = [...features];
                          updated[index] = {...feature, description: e.target.value};
                          setFeatures(updated);
                        }}
                        placeholder="Feature Description"
                        rows={2}
                      />
                      
                      <Input
                        value={feature.tech_stack || ''}
                        onChange={(e) => {
                          const updated = [...features];
                          updated[index] = {...feature, tech_stack: e.target.value};
                          setFeatures(updated);
                        }}
                        placeholder="Tech Stack (e.g., GPT-4 + Custom ML)"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={feature.is_active ? 'default' : 'outline'}
                          onClick={() => {
                            const updated = [...features];
                            updated[index] = {...feature, is_active: !feature.is_active};
                            setFeatures(updated);
                          }}
                        >
                          {feature.is_active ? (
                            <Eye className="w-4 h-4 mr-2" />
                          ) : (
                            <EyeOff className="w-4 h-4 mr-2" />
                          )}
                          {feature.is_active ? 'Active' : 'Inactive'}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => saveFeature(feature)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        
                        {feature.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteFeature(feature.id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Pricing Plans</h2>
            <Button
              onClick={() => {
                const newPlan: LandingPricing = {
                  name: 'New Plan',
                  price: '$0',
                  period: 'per month',
                  description: 'Plan description',
                  features: [],
                  icon: 'Zap',
                  is_popular: false,
                  cta_text: 'Get Started',
                  is_active: true,
                  order_index: pricing.length
                };
                setPricing([...pricing, newPlan]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pricing Plan
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, index) => (
              <Card key={plan.id || index} className={plan.is_popular ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  {plan.is_popular && (
                    <Badge className="mb-2 w-fit">Most Popular</Badge>
                  )}
                  <Input
                    value={plan.name}
                    onChange={(e) => {
                      const updated = [...pricing];
                      updated[index] = {...plan, name: e.target.value};
                      setPricing(updated);
                    }}
                    className="text-xl font-bold"
                    placeholder="Plan Name"
                  />
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={plan.price}
                      onChange={(e) => {
                        const updated = [...pricing];
                        updated[index] = {...plan, price: e.target.value};
                        setPricing(updated);
                      }}
                      placeholder="$99"
                    />
                    
                    <Input
                      value={plan.period}
                      onChange={(e) => {
                        const updated = [...pricing];
                        updated[index] = {...plan, period: e.target.value};
                        setPricing(updated);
                      }}
                      placeholder="per month"
                    />
                  </div>
                  
                  <Textarea
                    value={plan.description}
                    onChange={(e) => {
                      const updated = [...pricing];
                      updated[index] = {...plan, description: e.target.value};
                      setPricing(updated);
                    }}
                    placeholder="Plan description"
                    rows={2}
                  />
                  
                  <div>
                    <label className="text-sm font-medium">Features (one per line)</label>
                    <Textarea
                      value={plan.features.join('\n')}
                      onChange={(e) => {
                        const updated = [...pricing];
                        updated[index] = {...plan, features: e.target.value.split('\n').filter(f => f.trim())};
                        setPricing(updated);
                      }}
                      placeholder="Unlimited emails&#10;Priority support&#10;Advanced analytics"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={plan.is_popular ? 'default' : 'outline'}
                      onClick={() => {
                        const updated = [...pricing];
                        // Ensure only one plan is popular
                        updated.forEach((p, i) => {
                          updated[i] = {...p, is_popular: i === index};
                        });
                        setPricing(updated);
                      }}
                    >
                      {plan.is_popular ? '⭐ Popular' : 'Set as Popular'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => savePricing(plan)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}