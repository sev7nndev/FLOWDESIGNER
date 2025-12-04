import React from 'react';
import { User } from '@/types';
import { SaasLogoManager } from './SaasLogoManager';
import { MercadoPagoManager } from './MercadoPagoManager';
import { PlanSettingsManager } from './PlanSettingsManager';
import { GeneratedImagesManager } from './GeneratedImagesManager';
import { LandingImagesManager } from './LandingImagesManager';

interface DeveloperPanelProps {
    user: User;
    saasLogoUrl: string | null;
    refreshConfig: () => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ user, saasLogoUrl, refreshConfig }) => {
    return (
        <div className="space-y-12">
            <SaasLogoManager user={user} saasLogoUrl={saasLogoUrl} refreshConfig={refreshConfig} />
            <MercadoPagoManager user={user} />
            <PlanSettingsManager />
            <GeneratedImagesManager userRole={user.role} />
            <LandingImagesManager user={user} />
        </div>
    );
};