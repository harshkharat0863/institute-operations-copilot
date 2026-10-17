import React, { useState } from 'react';
import { LandingPageView } from './LandingPageView';
import { AuthView } from './AuthView';

export const LoginView: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'auth') {
    return <AuthView initialMode={authMode} onBackToHome={handleBackToLanding} />;
  }

  return <LandingPageView onOpenAuth={handleOpenAuth} />;
};

