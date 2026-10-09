/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ConverterCard } from './components/ConverterCard';
import { TranscriptResultView } from './components/TranscriptResultView';
import { ToolsShowcase } from './components/ToolsShowcase';
import { WorkflowSection } from './components/WorkflowSection';
import { BenefitsSection } from './components/BenefitsSection';
import { PricingSection } from './components/PricingSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/Modals/AuthModal';
import { PrivacyModal } from './components/Modals/PrivacyModal';
import { TermsModal } from './components/Modals/TermsModal';
import { ServerStatus, TranscriptResult } from './types';

export default function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [currentResult, setCurrentResult] = useState<TranscriptResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'url'>('upload');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Check backend server status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data);
        }
      } catch (err) {
        console.warn('Could not contact /api/status:', err);
      }
    }
    checkStatus();
  }, []);

  const scrollToConverter = (tab: 'upload' | 'record' | 'url' = 'upload') => {
    setActiveTab(tab);
    setCurrentResult(null); // Return to converter if looking at results
    setTimeout(() => {
      const el = document.getElementById('converter');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        {/* Sticky Header */}
        <Header
          serverStatus={serverStatus}
          onOpenAuth={() => setIsAuthOpen(true)}
          onScrollToConverter={() => scrollToConverter('upload')}
          activeSection="home"
        />

        <main className="flex-1">
          {/* If there is an active transcription result, display the full split result screen */}
          {currentResult ? (
            <div className="py-8">
              <TranscriptResultView
                result={currentResult}
                onReset={() => {
                  setCurrentResult(null);
                  scrollToConverter('upload');
                }}
              />
            </div>
          ) : (
            /* Otherwise display the landing page & primary converter card */
            <>
              {/* Hero Section */}
              <Hero
                onStartTranscribing={() => scrollToConverter('upload')}
                onExploreFeatures={() => scrollToSection('tools')}
              />

              {/* Main Conversion Card (Section C & D) */}
              <ConverterCard
                key={activeTab}
                initialTab={activeTab}
                serverStatus={serverStatus}
                onTranscriptionComplete={(result) => {
                  setCurrentResult(result);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Supplementary Tools Showcase (Section F) */}
              <ToolsShowcase
                onSelectTool={(tab) => scrollToConverter(tab)}
              />

              {/* 3-Step Workflow Section (Section G) */}
              <WorkflowSection />

              {/* Benefits Section (Section H) */}
              <BenefitsSection />

              {/* Pricing Section */}
              <PricingSection
                onSelectPlan={() => scrollToConverter('upload')}
              />

              {/* FAQ Section (Section I) */}
              <FAQSection />
            </>
          )}
        </main>

        {/* Footer (Section J) */}
        <Footer
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenTerms={() => setIsTermsOpen(true)}
          onSelectTool={(tab) => scrollToConverter(tab)}
        />

        {/* Modals */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
        <PrivacyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />
        <TermsModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
