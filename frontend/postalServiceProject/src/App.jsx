import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";

import "./App.css";

// Admin pages
import AdminLayout from "./components/Admin/AdminLayout.jsx";
import Dashboard from "./components/Admin/pages/Dashboard.jsx";
import Receipt from "./components/Admin/pages/Receipt.jsx";
import RegisterParcel from "./components/Admin/pages/RegisterParcel.jsx";
import ParcelReport from "./components/Admin/pages/ParcelReport.jsx";

// User pages
import UserLayout from "./components/User/UserLayout.jsx";
import Tracking from "./components/User/pages/Tracking.jsx";

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Root redirect ไป admin dashboard */}
        <Route path="/" element={<Navigate to="/user" />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="Receipt" element={<Receipt />} />
          <Route path="RegisterParcel" element={<RegisterParcel />} />
          <Route path="ParcelReport" element={<ParcelReport />} />
        </Route>

        {/* User routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route path="Tracking" element={<Tracking />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
