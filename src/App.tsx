import { BrowserRouter } from 'react-router-dom';
import AppRouter from '@/app/router';
import ToastContainer from '@/components/toasts/ToastContainer';

const App = () => (
  <BrowserRouter>
    <AppRouter />
    <ToastContainer />
  </BrowserRouter>
);

export default App;
