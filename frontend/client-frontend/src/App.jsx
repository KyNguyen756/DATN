import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import SearchTrip from './pages/SearchTrip';
import SeatSelection from './pages/SeatSelection';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import MyTickets from './pages/MyTickets';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/search" element={<MainLayout><SearchTrip /></MainLayout>} />
        <Route path="/seat-selection" element={<MainLayout><SeatSelection /></MainLayout>} />
        <Route path="/booking" element={<MainLayout><Booking /></MainLayout>} />
        <Route path="/payment" element={<MainLayout><Payment /></MainLayout>} />
        <Route path="/my-tickets" element={<MainLayout><MyTickets /></MainLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
