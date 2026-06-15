import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PassStore from './pages/PassStore';
import MyPasses from './pages/MyPasses';
import GroupClasses from './pages/GroupClasses';
import MyClasses from './pages/MyClasses';
import Checkin from './pages/Checkin';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import AdminClasses from './pages/AdminClasses';
import AdminAnnouncements from './pages/AdminAnnouncements';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/pass-store" element={
        <ProtectedRoute><PassStore /></ProtectedRoute>
      } />
      <Route path="/my-passes" element={
        <ProtectedRoute><MyPasses /></ProtectedRoute>
      } />
      <Route path="/classes" element={
        <ProtectedRoute><GroupClasses /></ProtectedRoute>
      } />
      <Route path="/my-classes" element={
        <ProtectedRoute><MyClasses /></ProtectedRoute>
      } />
      <Route path="/checkin" element={
        <ProtectedRoute><Checkin /></ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute><History /></ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/classes" element={
        <ProtectedRoute adminOnly><AdminClasses /></ProtectedRoute>
      } />
      <Route path="/admin/announcements" element={
        <ProtectedRoute adminOnly><AdminAnnouncements /></ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
