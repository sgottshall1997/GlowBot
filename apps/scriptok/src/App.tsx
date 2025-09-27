import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";

// Simple placeholder components since @/ imports are not available in this app structure
const Toaster = () => <div></div>;
const Layout = ({ children }: { children: React.ReactNode }) => <div className="min-h-screen bg-gray-50">{children}</div>;

const ScriptGeneratorPage = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold mb-4">Script Generator</h1>
    <p>ScriptTok script generation will be available soon.</p>
  </div>
);

const ContentHistoryPage = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold mb-4">Content History</h1>
    <p>Your script history will appear here.</p>
  </div>
);

const ScriptToolsPage = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold mb-4">Script Tools</h1>
    <p>Advanced script tools coming soon.</p>
  </div>
);

// Simple query client setup
const queryClient = {
  getQueryCache: () => ({ clear: () => {} }),
  getMutationCache: () => ({ clear: () => {} }),
  clear: () => {},
  refetchQueries: () => Promise.resolve([]),
  invalidateQueries: () => Promise.resolve(),
};


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
