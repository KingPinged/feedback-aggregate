import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { Dashboard, Issues, IssueDetail, Feedback, Providers } from './pages';
import { SyncProvider } from './context/SyncContext';
import { ToastContainer, useToast } from './components/Toast';

function AppContent() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/issues/:id" element={<IssueDetail />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/providers" element={<Providers />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  const { toasts, addToast, dismissToast } = useToast();

  return (
    <BrowserRouter>
      <SyncProvider onToast={addToast}>
        <AppContent />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </SyncProvider>
    </BrowserRouter>
  );
}

export default App;
