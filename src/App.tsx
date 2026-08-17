import { Route, Switch } from 'wouter';
import { DevicePreview } from './components/DevicePreview';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AIImagePage } from './pages/AIImagePage';
import { PixelForgePage } from './pages/PixelForgePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { BattlePage } from './pages/BattlePage';
import { RegisterPage } from './pages/RegisterPage';

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
    <DevicePreview>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/battle" component={BattlePage} />
        <Route path="/pixel-forge" component={ProtectedPixelForgePage} />
        <Route path="/ai-image" component={ProtectedAIImagePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/signup" component={RegisterPage} />
        <Route path="/profile" component={ProtectedProfilePage} />
        <Route component={ProtectedNotFoundPage} />
      </Switch>
    </DevicePreview>
  );
}
