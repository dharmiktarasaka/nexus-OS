// client/src/website/components/TemplatesModal.jsx - Modern Website Templates
import React from 'react';
import { X, Layout, Sparkles, ArrowRight, ShieldCheck, Stethoscope, Briefcase, ShoppingBag, Utensils, Home } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'dental-clinic',
    title: 'Modern Dental Clinic & Healthcare',
    category: 'healthcare',
    icon: Stethoscope,
    badge: 'Popular Healthcare',
    prompt: 'Build a modern dental clinic website with homepage, comprehensive services, doctor profiles, online appointment booking modal, and patient testimonials with dark blue primary accent.',
    description: 'Clean healthcare aesthetic with appointment booking, specialist bios, and emergency contact button.'
  },
  {
    id: 'saas-landing',
    title: 'AI SaaS Platform Landing Page',
    category: 'saas',
    icon: Sparkles,
    badge: 'High Conversion',
    prompt: 'Build a sleek AI SaaS product landing page with glowing gradient hero, interactive feature comparison table, customer ROI calculator, pricing tiers with monthly/annual switch, and FAQ accordion.',
    description: 'Dark-mode ready SaaS template with pricing switcher, live ROI calculator widget, and testimonials.'
  },
  {
    id: 'portfolio-studio',
    title: 'Creative Design & Engineering Portfolio',
    category: 'portfolio',
    icon: Briefcase,
    badge: 'Creative Showcase',
    prompt: 'Build a high-end personal portfolio for a senior product designer and software architect featuring interactive project grid, case study modal, skills matrix, and interactive contact form.',
    description: 'Minimalist editorial portfolio with interactive project case studies and contact form.'
  },
  {
    id: 'restaurant-bistro',
    title: 'Artisan Bistro & Fine Dining',
    category: 'restaurant',
    icon: Utensils,
    badge: 'Food & Hospitality',
    prompt: 'Build an elegant artisan restaurant website with ambient dark aesthetic, interactive food & wine menu with category filters, table reservation form, chef biography, and location map.',
    description: 'Sophisticated dining website with categorized menu filter tabs, reservation scheduler, and wine list.'
  },
  {
    id: 'real-estate',
    title: 'Luxury Real Estate & Properties',
    category: 'real-estate',
    icon: Home,
    badge: 'Luxury Property',
    prompt: 'Build a luxury real estate agency website with property listings grid, interactive mortgage payment calculator, virtual tour modal, agent contact cards, and search filters by price and bedrooms.',
    description: 'High-end property showcase with interactive mortgage calculator and search filters.'
  },
  {
    id: 'ecommerce-brand',
    title: 'Direct-to-Consumer Boutique Store',
    category: 'ecommerce',
    icon: ShoppingBag,
    badge: 'DTC Brand',
    prompt: 'Build a modern boutique e-commerce storefront with product cards, category navigation, interactive shopping cart drawer with quantity counter, product review stars, and promo banner.',
    description: 'Modern storefront featuring sliding cart drawer, star rating badges, and responsive product catalog.'
  }
];

export default function TemplatesModal({ isOpen, onClose, onSelectTemplate }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '92%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layout size={20} color="#2563eb" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Website Starter Templates
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Select an architecture to prompt Claude to generate a complete tailored website.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Template Grid */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {TEMPLATES.map(tpl => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                onClick={() => {
                  onSelectTemplate(tpl.prompt);
                  onClose();
                }}
                style={{
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--bg-subtle, #ffffff)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(37, 99, 235, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb'
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: '#eff6ff',
                        color: '#2563eb'
                      }}
                    >
                      {tpl.badge}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700 }}>
                    {tpl.title}
                  </h4>
                  <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2563eb'
                  }}
                >
                  <span>Build with Claude</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
