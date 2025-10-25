import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";

import "./App.css";

// Admin pages
import AdminLayout from "./components/Admin/AdminLayout.jsx";
import Dashboard from "./components/Admin/pages/Dashboard.jsx";
import ParcelManagement from "./components/Admin/pages/ParcelManagement.jsx";
import Receipt from "./components/Admin/pages/Receipt.jsx";
import ScanParcel from "./components/Admin/pages/ScanParcel.jsx";

// User pages
import Tracking from "./components/User/Tracking.jsx";

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Root redirect ไป admin dashboard */}
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ParcelManagement" element={<ParcelManagement />} />
          <Route path="Receipt" element={<Receipt />} />
          <Route path="ScanParcel" element={<ScanParcel />} />
        </Route>

        {/* User routes */}
        <Route>
          <Route path="/" element={<Tracking />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
