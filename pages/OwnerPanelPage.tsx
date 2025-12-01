import React, { useState, useCallback } from 'react';
import { User } from '../types'; // FIX: Removed unused UserRole import (Error 11)
import { ArrowLeft, Users, DollarSign, CheckCircle, PauseCircle, Loader2, MessageSquare, User as UserIcon, Zap, Shield, Star, LogOut, ShieldOff, TrendingUp, Edit, X } from 'lucide-react';
import { Button } from '../components/Button';
import { useOwnerMetrics } from '../hooks/useOwnerMetrics';
import { MetricCard } from '../components/MetricCard';
import { OwnerChatPanel } from '../components/OwnerChatPanel';
import { api } from '../services/api'; // Importando a API para atualização

// ... (rest of the file)