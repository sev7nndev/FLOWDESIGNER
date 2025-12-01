import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { HoverBorderGradient } from './HoverBorderGradient';
import { ChevronRight, Sparkles, ShieldCheck, Zap, Image as ImageIcon, CreditCard, Loader2, Edit3, Bot, Download } from 'lucide-react';
import { TestimonialCard } from './TestimonialCard';
import { Accordion } from './Accordion';
import { FlyerMockupProps, FlyerMockup } from './FlyerMockup';
import { LandingImage } from '../types';
import { HeroSection } from './Hero';
import { PricingModal } from './PricingModal';
import { PricingCard } from './PricingCard';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { BeamsBackground } from './BeamsBackground';
import { cn } from "@/lib/utils"; // <-- IMPORTAÇÃO ADICIONADA

interface LandingPageProps {
  onGetStarted: () => void;
// ... restante do código