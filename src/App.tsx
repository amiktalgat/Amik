import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AIImagePage } from './pages/AIImagePage';
import { PixelForgePage } from './pages/PixelForgePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pixel-forge" component={PixelForgePage} />
      <Route path="/ai-image" component={AIImagePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
