import { Route, Switch } from 'wouter';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AIImagePage } from './pages/AIImagePage';
import { PixelForgePage } from './pages/PixelForgePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';

function ProtectedHomePage() {
  return (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  );
}

function ProtectedPixelForgePage() {
  return (
    <RequireAuth>
      <PixelForgePage />
    </RequireAuth>
  );
}

function ProtectedAIImagePage() {
  return (
    <RequireAuth>
      <AIImagePage />
    </RequireAuth>
  );
}

function ProtectedProfilePage() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}

function ProtectedNotFoundPage() {
  return (
    <RequireAuth>
      <NotFoundPage />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={ProtectedHomePage} />
      <Route path="/pixel-forge" component={ProtectedPixelForgePage} />
      <Route path="/ai-image" component={ProtectedAIImagePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProtectedProfilePage} />
      <Route component={ProtectedNotFoundPage} />
    </Switch>
  );
}
