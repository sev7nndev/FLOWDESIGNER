import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import useAdminGeneratedImages from '../hooks/useAdminGeneratedImages';
// import OwnerChatPanel from '../components/OwnerChatPanel'; // Componente de chat não implementado neste escopo

const OwnerPanelPage: React.FC = () => {
  const { images, isLoading, error } = useAdminGeneratedImages();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  }

  // Placeholder for metrics (you would fetch these from a dedicated API endpoint)
  const metrics = {
    totalUsers: 150,
    totalGenerations: images.length,
    activeSubscriptions: 12,
  };

  return (
    <div className="space-y-8 pt-8">
      <h1 className="text-4xl font-extrabold text-center">Owner Panel</h1>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">Total images created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Currently paying users</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for Chat/Client Management */}
      <Card>
        <CardHeader>
          <CardTitle>Client Management & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Client list and chat functionality would be implemented here.
          </p>
          {/* <OwnerChatPanel /> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerPanelPage;