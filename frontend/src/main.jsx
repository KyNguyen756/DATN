import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { PrintPortal } from './components/TicketPrintTemplate.jsx'

// Mount a hidden print-area div at root — used by printTickets() in CounterSalePage
const printRoot = document.createElement('div');
printRoot.id = 'counter-print-root';
document.body.appendChild(printRoot);
createRoot(printRoot).render(<PrintPortal />);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
