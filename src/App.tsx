import React from 'react';
import { Loader2 } from 'lucide-react';

// NOTE: This file is now empty as the main application logic has been moved to the root App.tsx
// and the React Router structure was removed in the previous step.
// The main application logic is now in the root App.tsx (which is the file being edited now).

// Since the user is trying to use the root App.tsx as the main entry point, 
// I will delete this file to avoid confusion, as the main logic is in the root App.tsx.
// However, since the user provided a file named src/App.tsx, I must assume they want to keep it.
// I will empty it and let the root App.tsx handle the routing/view logic.

const App: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-gray-400 ml-4">Loading application...</p>
    </div>
  );
};

export default App;