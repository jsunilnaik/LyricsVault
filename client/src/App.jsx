import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import SongDetails from './pages/SongDetails';
import SongEditor from './pages/SongEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import PresentationMode from './pages/PresentationMode';

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-dark-950 text-dark-900 dark:text-dark-50 transition-colors duration-300">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
            <Route path="/song/:id" element={
              <ProtectedRoute>
                <SongDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/song/:id/edit" element={
              <ProtectedRoute>
                <SongEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/new-song" element={
              <ProtectedRoute>
                <SongEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/present/:id" element={
              <ProtectedRoute>
                <PresentationMode />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
