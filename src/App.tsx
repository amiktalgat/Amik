import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PixelForgePage } from './pages/PixelForgePage';

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pixel-forge" component={PixelForgePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
