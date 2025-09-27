import { useEffect } from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import ScriptGeneratorPage from "@/pages/ScriptGeneratorPage";
import ContentHistoryPage from "@/pages/ContentHistoryPage";
import ScriptToolsPage from "@/pages/ScriptToolsPage";
import Layout from "@/components/Layout";


function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ScriptGeneratorPage} />
        <Route path="/generator" component={ScriptGeneratorPage} />
        <Route path="/history" component={ContentHistoryPage} />
        <Route path="/tools" component={ScriptToolsPage} />
      </Switch>
    </Layout>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <GlobalComplianceHeader />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
