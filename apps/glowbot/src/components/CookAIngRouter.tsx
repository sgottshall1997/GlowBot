import { Switch, Route } from "wouter";

// Placeholder component for CookAIng marketing pages that are not yet implemented
function CookAIngPlaceholder({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          CookAIng Marketing - {pageName}
        </h1>
        <p className="text-gray-600">
          This page is under development and will be available soon.
        </p>
      </div>
    </div>
  );
}

function CookAIngRouter() {
  return (
    <Switch>
      {/* CookAIng Marketing Dashboard - Main page */}
      <Route path="/cookaing-marketing" component={() => <CookAIngPlaceholder pageName="Dashboard" />} />
      
      {/* CookAIng Marketing Sub-pages - Placeholder routes */}
      <Route path="/cookaing-marketing/organizations" component={() => <CookAIngPlaceholder pageName="Organizations" />} />
      <Route path="/cookaing-marketing/contacts" component={() => <CookAIngPlaceholder pageName="Contacts" />} />
      <Route path="/cookaing-marketing/segments" component={() => <CookAIngPlaceholder pageName="Segments" />} />
      <Route path="/cookaing-marketing/campaigns" component={() => <CookAIngPlaceholder pageName="Campaigns" />} />
      <Route path="/cookaing-marketing/experiments" component={() => <CookAIngPlaceholder pageName="Experiments" />} />
      <Route path="/cookaing-marketing/workflows" component={() => <CookAIngPlaceholder pageName="Workflows" />} />
      <Route path="/cookaing-marketing/personalization" component={() => <CookAIngPlaceholder pageName="Personalization" />} />
      <Route path="/cookaing-marketing/forms" component={() => <CookAIngPlaceholder pageName="Forms" />} />
      <Route path="/cookaing-marketing/submissions" component={() => <CookAIngPlaceholder pageName="Submissions" />} />
      <Route path="/cookaing-marketing/affiliate-products" component={() => <CookAIngPlaceholder pageName="Affiliate Products" />} />
      <Route path="/cookaing-marketing/trends" component={() => <CookAIngPlaceholder pageName="Trends" />} />
      <Route path="/cookaing-marketing/reports" component={() => <CookAIngPlaceholder pageName="Reports" />} />
      <Route path="/cookaing-marketing/costs" component={() => <CookAIngPlaceholder pageName="Costs" />} />
      <Route path="/cookaing-marketing/attribution" component={() => <CookAIngPlaceholder pageName="Attribution" />} />
      <Route path="/cookaing-marketing/integrations-health" component={() => <CookAIngPlaceholder pageName="Integrations Health" />} />
      <Route path="/cookaing-marketing/webhooks" component={() => <CookAIngPlaceholder pageName="Webhooks" />} />
      <Route path="/cookaing-marketing/email-test" component={() => <CookAIngPlaceholder pageName="Email Test" />} />
      <Route path="/cookaing-marketing/devtools" component={() => <CookAIngPlaceholder pageName="Dev Tools" />} />
      <Route path="/cookaing-marketing/intelligence" component={() => <CookAIngPlaceholder pageName="Intelligence" />} />
      <Route path="/cookaing-marketing/docs" component={() => <CookAIngPlaceholder pageName="Documentation" />} />
    </Switch>
  );
}

export default CookAIngRouter;