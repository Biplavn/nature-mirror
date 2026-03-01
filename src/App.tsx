import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { FeedbackPage } from './pages/FeedbackPage';
import './styles/global.css';

const ExperiencePage = lazy(() => import('./pages/ExperiencePage'));

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
            </Route>
            <Route path="/experience" element={
                <Suspense fallback={
                    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/60 font-body">Loading experience...</p>
                        </div>
                    </div>
                }>
                    <ExperiencePage />
                </Suspense>
            } />
        </Routes>
    );
}

export default App;
