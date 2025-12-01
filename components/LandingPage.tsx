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
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  landingImages: LandingImage[];
  isLandingImagesLoading: boolean;
}

type FlyerData = Omit<FlyerMockupProps, 'theme'> & { theme: 'mechanic' | 'food' | 'law' | 'tech' };

const FALLBACK_FLYERS: FlyerData[] = [
    { bg: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop", title: "AUTO CENTER", subtitle: "REVISÃO • FREIOS • SUSPENSÃO", phone: "(11) 9998-2020", theme: "mechanic", badge: "PROMOÇÃO" },
    { bg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto-format&fit=crop", title: "RITA SALGADOS", subtitle: "Cento de Salgados fritos na hora. Coxinha & Kibe.", phone: "(21) 9888-7777", theme: "food", badge: "Oferta", price: "R$49" },
    { bg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto-format&fit=crop", title: "SILVA ADVOCACIA", subtitle: "Direito Trabalhista e Previdenciário.", phone: "(11) 3030-4040", theme: "law", badge: "Consultoria" },
    { bg: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto-format&fit=crop", title: "SMART AUDIO", subtitle: "Fone Bluetooth Pro com cancelamento de ruído.", phone: "www.site.com", theme: "tech", badge: "50% OFF" },
];

const sectionVariants = {
// ... restante do código