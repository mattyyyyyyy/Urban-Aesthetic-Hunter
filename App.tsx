import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { GhostLens } from './pages/GhostLens';
import { MapPage } from './pages/MapPage';
import { BottomNav } from './components/Layout/BottomNav';
import { AppRoute } from './types';
import { AnimatePresence, motion } from 'framer-motion';

// Wrapper to handle navigation state
const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const location = useLocation();

  useEffect(() => {
     // Sync local state with router path
     const path = location.pathname.substring(1); // remove leading slash
     if (Object.values(AppRoute).includes(path as AppRoute)) {
         setCurrentRoute(path as AppRoute);
     }
  }, [location]);

  // Function to switch routes
  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    window.location.hash = `/${route}`;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-zinc-200 text-zinc-900 overflow-hidden font-sans">
      
      {/* Background Texture */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to={`/${AppRoute.HOME}`} replace />} />
          
          <Route path={`/${AppRoute.HOME}`} element={
            <PageWrapper>
              <Home />
            </PageWrapper>
          } />
          
          <Route path={`/${AppRoute.CAMERA}`} element={
            <PageWrapper>
              <GhostLens />
            </PageWrapper>
          } />
          
          <Route path={`/${AppRoute.MAP}`} element={
            <PageWrapper>
              <MapPage />
            </PageWrapper>
          } />
          
          <Route path={`/${AppRoute.MUSEUM}`} element={
            <PageWrapper>
              <div className="h-full w-full flex items-center justify-center font-mono text-xs text-zinc-500">
                MUSEUM_UNDER_CONSTRUCTION
              </div>
            </PageWrapper>
          } />

          {/* Catch-all route to ensure we never show a blank screen */}
          <Route path="*" element={<Navigate to={`/${AppRoute.HOME}`} replace />} />
        </Routes>
      </AnimatePresence>

      {/* Navigation - Always visible unless specified */}
      <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
    </div>
  );
};

// Simple wrapper for page transitions
const PageWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="w-full h-full relative z-10"
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;