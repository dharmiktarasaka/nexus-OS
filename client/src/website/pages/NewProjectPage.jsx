import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { createClientFallbackProject, saveOfflineProject } from '../utils/clientGenerator';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Palette,
  Sliders,
  Code,
  Layers,
  RefreshCw,
  Zap,
  Globe,
  Wand2
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'fish',
    label: 'Aquarium & Fish',
    icon: '🐠',
    prompt: 'Create a luxury marine aquarium and rare tropical fish website called AquaVibe Marine with interactive tank volume & salinity calculator, coral reef species showcase, and bespoke consultation booking.'
  },
  {
    id: 'pets',
    label: 'Pets & Veterinary',
    icon: '🐾',
    prompt: 'Create a premium organic pet wellness and veterinarian website with interactive daily pet calorie & nutrition calculator, organic diet subscription, and appointment booking.'
  },
  {
    id: 'shoes',
    label: 'Sneakers & Shoes',
    icon: '👟',
    prompt: 'Create a modern boutique sneaker shop called KINETIX Footwear with interactive 360° colorway customizer, size selector, instant shopping bag drawer, and limited drop lookbook.'
  },
  {
    id: 'cafe',
    label: 'Bakery & Cafe',
    icon: '☕',
    prompt: 'Create an artisanal sourdough bakery and specialty coffee roastery with interactive coffee flavor profiler, morning pastry menu, and table reservation booking modal.'
  },
  {
    id: 'realestate',
    label: 'Luxury Real Estate',
    icon: '🏡',
    prompt: 'Create a luxury architectural villas and real estate website with interactive mortgage and rental yield investment calculator, floor plan viewer, and private tour scheduler.'
  },
  {
    id: 'saas',
    label: 'AI & SaaS Stack',
    icon: '⚡',
    prompt: 'Create a modern developer AI workflow platform called OmniFlow with interactive code syntax switcher, dynamic monthly vs annual pricing calculator with ROI discount, and sign-in modal.'
  },
  {
    id: 'fitness',
    label: 'Gym & Athletics',
    icon: '🏋️',
    prompt: 'Create a high-performance athletic club and fitness studio website with interactive 1-rep max calculator, membership tier comparison, and free class pass booking.'
  },
  {
    id: 'legal',
    label: 'Corporate Law',
    icon: '💼',
    prompt: 'Create an executive corporate law firm website with confidential case assessment intake, practice area showcase, and senior partner consultation scheduler.'
  },
  {
    id: 'healthcare',
    label: 'Clinical Longevity',
    icon: '🩺',
    prompt: 'Create a luxury concierge healthcare and longevity clinic website called AuraHealth with interactive biomarker calculator, consultation booking dialog, and physician faculty.'
  },
  {
    id: 'restaurant',
    label: 'Fine Dining',
    icon: '🍽️',
    prompt: 'Create a Michelin-star farm-to-table restaurant website with seasonal tasting menu display, sommelier wine pairing notes, and live table reservation dialog.'
  },
  {
    id: 'agency',
    label: 'Creative Agency',
    icon: '🎨',
    prompt: 'Create an award-winning digital design and branding agency portfolio with interactive case study filter, project timeline estimator, and inquiry contact form.'
  },
  {
    id: 'motors',
    label: 'Exotic & EV Motors',
    icon: '🚗',
    prompt: 'Create a futuristic electric performance vehicle website with interactive battery range and 0-60 acceleration simulator, bespoke configuration studio, and test drive booking.'
  },
  {
    id: 'skincare',
    label: 'Organic Skincare',
    icon: '🌿',
    prompt: 'Create a luxury organic botanical skincare brand with skin quiz routine builder, ingredient purity breakdown, and subscription box customizer.'
  },
  {
    id: 'industrial',
    label: 'Manufacturing & CNC',
    icon: '🏭',
    prompt: 'Create a high-end aerospace and defense precision manufacturing website for Vanguard Precision Dynamics with interactive RFQ pricing and lead-time estimator, 5-axis CNC specs, and AS9100D compliance standards.'
  }
];

const SURPRISE_PROMPTS = [
  'Create a modern boutique sneaker shop called KINETIX Footwear with interactive 360° colorway customizer, size selector, instant shopping bag drawer, and limited drop lookbook.',
  'Create an artisanal sourdough bakery and specialty coffee roastery with interactive coffee flavor profiler, morning pastry menu, and table reservation booking modal.',
  'Create a luxury architectural villas and real estate website with interactive mortgage and rental yield investment calculator, floor plan viewer, and private tour scheduler.',
  'Create a bespoke Japanese matcha bar & ceremonial tea house with interactive tea pairing guide, tasting flight reservation, and matcha starter kit shop.',
  'Create an elite pet wellness & fresh organic dog food subscription website with personalized canine calorie and nutrition calculator.',
  'Create an eco-luxury safari retreat in Kenya with interactive tent visualizer, wildlife migration calendar, and bespoke expedition booking wizard.',
  'Create an AI-powered contract analytics platform for legal teams with interactive PDF risk scan simulator and enterprise seat calculator.'
];

export default function NewProjectPage() {
  const [prompt, setPrompt] = useState(CATEGORIES[0].prompt);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/apps/website-builder') ? '/apps/website-builder' : '';
  const { user } = useAuth();

  // Category chip selection
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat.id);
    setPrompt(cat.prompt);
    setBlueprint(null); // Reset blueprint for new prompt
  };

  // Surprise Me / Random prompt
  const handleSurpriseMe = () => {
    const randomIndex = Math.floor(Math.random() * SURPRISE_PROMPTS.length);
    const chosenPrompt = SURPRISE_PROMPTS[randomIndex];
    setPrompt(chosenPrompt);
    setBlueprint(null);
  };

  // Step 1: AI Prompt Analysis
  const handleAnalyzePrompt = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);

    try {
      const customKey = localStorage.getItem('gemini_custom_api_key') || '';
      const res = await fetch('/api/analyze-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-key': customKey } : {})
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to analyze prompt');
      }

      const data = await res.json();
      setBlueprint(data);
    } catch (err) {
      console.warn('AI prompt analysis fallback:', err.message);
      // Fallback blueprint
      setBlueprint({
        category: 'Custom Digital Web Experience',
        suggestedBrand: 'Apex Visionary Studio',
        tagline: 'Engineered for Performance, Crafted for Modern Excellence',
        targetAudience: 'Discerning customers seeking premium, responsive, conversion-focused design',
        colorPalette: {
          primary: '#0f172a',
          accent: '#4f46e5',
          background: '#f8fafc',
          surface: '#ffffff'
        },
        typography: {
          headings: 'Space Grotesk',
          body: 'Plus Jakarta Sans'
        },
        recommendedSections: [
          'High-impact Hero with value proposition',
          'Interactive Showcase & Customizer Widget',
          'Feature Breakdown with metric indicators',
          'Social Proof & Verified Testimonials',
          'Direct Contact / Lead Intake Modal'
        ],
        interactiveWidget: 'Interactive Niche Customizer & Real-time Calculation Widget',
        summary: 'Fully responsive web application tailored to your custom prompt specifications.'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2: Website Generation
  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setGenerationStep('Synthesizing visual hierarchy & brand identity...');

    try {
      const customKey = localStorage.getItem('gemini_custom_api_key') || '';

      setTimeout(() => {
        setGenerationStep('Architecting semantic HTML5 layout & responsive grids...');
      }, 700);

      setTimeout(() => {
        setGenerationStep('Generating bespoke CSS tokens, typography & glassmorphism...');
      }, 1400);

      setTimeout(() => {
        setGenerationStep('Wiring interactive JavaScript widgets, modals & state...');
      }, 2100);

      let newProject = null;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.id || user?.uid ? { 'x-user-id': user.id || user.uid } : {}),
            ...(user?.email ? { 'x-user-email': user.email } : {}),
            ...(customKey ? { 'x-gemini-key': customKey } : {})
          },
          body: JSON.stringify({
            prompt,
            category: blueprint?.category || selectedCategory,
            blueprint,
            userId: user?.id || user?.uid || 'anonymous',
            userEmail: user?.email || '',
            stylePreferences: 'High-end design, crisp modern light mode palette, responsive fluid typography, interactive JS widgets'
          })
        });

        if (res.ok) {
          newProject = await res.json();
        } else {
          console.warn('Backend generation returned status', res.status, 'using resilient client synthesizer');
        }
      } catch (networkErr) {
        console.warn('Backend generation network error, activating resilient client synthesizer:', networkErr.message);
      }

      // If backend generation didn't return a project, use client-side generator
      if (!newProject || !newProject.id) {
        newProject = createClientFallbackProject(
          prompt,
          blueprint?.category || selectedCategory,
          blueprint,
          user
        );
      }

      // Save to offline storage so it always opens in Editor and Dashboard
      saveOfflineProject(newProject);

      setGenerationStep('Packaging project & launching Live Studio...');

      setTimeout(() => {
        navigate(`${basePath}/editor/${newProject.id}`);
      }, 600);
    } catch (err) {
      console.error('Generation exception handled:', err);
      // Failsafe recovery
      const fallbackProj = createClientFallbackProject(
        prompt,
        blueprint?.category || selectedCategory,
        blueprint,
        user
      );
      saveOfflineProject(fallbackProj);
      navigate(`${basePath}/editor/${fallbackProj.id}`);
    }
  };

  return (
    <div className="new-project-container">
      <Navbar />

      <main className="new-project-main">
        {/* Header */}
        <div className="new-proj-header">
          <div className="header-badge">
            <Sparkles size={14} />
            <span>AI Architecture & Prompt Studio</span>
          </div>
          <h1 className="header-title">Create Any Website on Your Prompt</h1>
          <p className="header-sub">
            Type any prompt for any category or business idea. Our AI analyzes your concept, designs an architectural blueprint, and generates a production-ready, interactive website.
          </p>
        </div>

        {/* Category Inspiration Chips */}
        <div className="inspiration-container">
          <div className="inspiration-header">
            <span className="inspiration-title">
              <Globe size={16} /> Explore Categories & Ideas:
            </span>
            <button
              type="button"
              className="btn-surprise-me"
              onClick={handleSurpriseMe}
              title="Pick a random creative prompt"
            >
              <Wand2 size={14} />
              <span>Surprise Me</span>
            </button>
          </div>

          <div className="category-chips-scroll">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(cat)}
                >
                  <span className="chip-icon">{cat.icon}</span>
                  <span className="chip-label">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Input Studio Card */}
        <div className="prompt-studio-card">
          <div className="studio-card-head">
            <div className="head-left">
              <h2 className="studio-card-title">1. Describe Your Website Concept</h2>
              <span className="head-sub">Be as specific as you like: brand name, products, colors, or interactive widgets.</span>
            </div>
            <div className="head-right">
              <span className="char-count">{prompt.length} characters</span>
            </div>
          </div>

          <textarea
            className="prompt-textarea-large"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a modern boutique sneaker shop called KINETIX Footwear with interactive 360° colorway customizer, size selector, instant shopping bag drawer, and limited drop lookbook..."
            required
          />

          <div className="prompt-action-row">
            <button
              type="button"
              className="btn-analyze-prompt"
              onClick={handleAnalyzePrompt}
              disabled={analyzing || loading || !prompt.trim()}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>AI Analyzing Prompt & Designing Architecture...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze Prompt & Architect Blueprint</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-fast-generate"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              title="Generate immediately without reviewing blueprint"
            >
              <Zap size={16} />
              <span>Instant Generate</span>
            </button>
          </div>
        </div>

        {/* Step 2: AI Architectural Blueprint (Visible when analyzed) */}
        {blueprint && (
          <div className="blueprint-card-wrapper">
            <div className="blueprint-card">
              <div className="blueprint-header">
                <div className="blueprint-badge">
                  <CheckCircle size={16} className="text-emerald" />
                  <span>AI Architecture Blueprint</span>
                </div>
                <span className="blueprint-category-pill">
                  {blueprint.category || 'Custom Category'}
                </span>
              </div>

              <div className="blueprint-body-grid">
                {/* Brand & Tagline Customizer */}
                <div className="blueprint-field-group">
                  <label className="bp-label">Suggested Brand Name</label>
                  <input
                    type="text"
                    className="bp-input"
                    value={blueprint.suggestedBrand || ''}
                    onChange={(e) => setBlueprint({ ...blueprint, suggestedBrand: e.target.value })}
                    placeholder="Brand Name"
                  />
                </div>

                <div className="blueprint-field-group">
                  <label className="bp-label">Strategic Tagline</label>
                  <input
                    type="text"
                    className="bp-input"
                    value={blueprint.tagline || ''}
                    onChange={(e) => setBlueprint({ ...blueprint, tagline: e.target.value })}
                    placeholder="Brand Tagline"
                  />
                </div>

                {/* Target Audience */}
                <div className="blueprint-field-group full-width">
                  <label className="bp-label">Target Audience & Market Positioning</label>
                  <div className="bp-text-display">
                    {blueprint.targetAudience || 'Modern discerning customers looking for top-tier digital experience.'}
                  </div>
                </div>

                {/* Color Palette Preview */}
                <div className="blueprint-field-group">
                  <label className="bp-label">
                    <Palette size={14} /> Curated Color Palette
                  </label>
                  <div className="palette-chips-row">
                    {blueprint.colorPalette && (
                      <>
                        <div className="color-swatch-chip" title="Primary Color">
                          <span
                            className="swatch-circle"
                            style={{ background: blueprint.colorPalette.primary || '#0f172a' }}
                          ></span>
                          <span className="swatch-hex">{blueprint.colorPalette.primary}</span>
                        </div>
                        <div className="color-swatch-chip" title="Accent Color">
                          <span
                            className="swatch-circle"
                            style={{ background: blueprint.colorPalette.accent || '#4f46e5' }}
                          ></span>
                          <span className="swatch-hex">{blueprint.colorPalette.accent}</span>
                        </div>
                        <div className="color-swatch-chip" title="Background Color">
                          <span
                            className="swatch-circle"
                            style={{
                              background: blueprint.colorPalette.background || '#f8fafc',
                              border: '1px solid #cbd5e1'
                            }}
                          ></span>
                          <span className="swatch-hex">Bg: {blueprint.colorPalette.background}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Typography Hierarchy */}
                <div className="blueprint-field-group">
                  <label className="bp-label">
                    <Code size={14} /> Typography Tokens
                  </label>
                  <div className="typography-chips-row">
                    <span className="font-tag">
                      <strong>Headings:</strong> {blueprint.typography?.headings || 'Space Grotesk'}
                    </span>
                    <span className="font-tag">
                      <strong>Body:</strong> {blueprint.typography?.body || 'Plus Jakarta Sans'}
                    </span>
                  </div>
                </div>

                {/* Interactive Functional Widget */}
                <div className="blueprint-field-group full-width">
                  <label className="bp-label">
                    <Sliders size={14} /> Domain-Specific Interactive Widget (JavaScript)
                  </label>
                  <div className="widget-highlight-box">
                    <div className="widget-icon">⚡</div>
                    <div className="widget-desc">
                      <strong>{blueprint.interactiveWidget || 'Custom Interactive Calculation & Filter Widget'}</strong>
                      <p>Coded in semantic Vanilla JS with zero external framework bloat, reactive state, and accessible interactions.</p>
                    </div>
                  </div>
                </div>

                {/* Recommended Sections */}
                {blueprint.recommendedSections && blueprint.recommendedSections.length > 0 && (
                  <div className="blueprint-field-group full-width">
                    <label className="bp-label">
                      <Layers size={14} /> Planned Page Architecture
                    </label>
                    <div className="sections-pill-grid">
                      {blueprint.recommendedSections.map((sec, i) => (
                        <div key={i} className="section-step-pill">
                          <span className="step-num">{i + 1}</span>
                          <span className="step-text">{sec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Blueprint CTA */}
              <div className="blueprint-footer">
                <button
                  type="button"
                  className="btn-generate-from-blueprint"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-stage">
                      <span className="spinner-sm"></span>
                      <span>{generationStep || 'Generating website...'}</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Generate Bespoke Website ({blueprint.suggestedBrand || 'Custom'})</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="guarantees-grid">
          <div className="guarantee-card">
            <div className="g-icon">📱</div>
            <h4>Full Responsive Fluid Layout</h4>
            <p>Clamp() typography and adaptive CSS grid for mobile, tablet, and ultra-wide screens.</p>
          </div>
          <div className="guarantee-card">
            <div className="g-icon">⚡</div>
            <h4>Real Interactive Vanilla JS</h4>
            <p>Every website includes working calculators, sliders, colorway switchers, or booking modals.</p>
          </div>
          <div className="guarantee-card">
            <div className="g-icon">🖼️</div>
            <h4>Curated High-Res Imagery</h4>
            <p>Context-aware photography from Unsplash with descriptive alt tags and semantic hierarchy.</p>
          </div>
          <div className="guarantee-card">
            <div className="g-icon">📦</div>
            <h4>One-Click Production ZIP</h4>
            <p>Export standalone HTML, CSS, JS, and Schema.org JSON-LD for instant deployment to any host.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
