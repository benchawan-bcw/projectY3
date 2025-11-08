import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";

// Admin pages
import AdminLayout from "./components/Admin/AdminLayout.jsx";
import Dashboard from "./components/Admin/pages/Dashboard.jsx";
import Receipt from "./components/Admin/pages/Receipt.jsx";
import RegisterParcel from "./components/Admin/pages/RegisterParcel.jsx";
import ParcelReport from "./components/Admin/pages/ParcelReport.jsx";
import Payment from "./components/Admin/pages/Payment.jsx";
import CheckParcel from "./components/Admin/pages/CheckParcel.jsx";

// User pages
import UserLayout from "./components/User/UserLayout.jsx";
import Tracking from "./components/User/pages/Tracking.jsx";
import Homeuser from "./components/User/pages/HomeUser.jsx";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="Receipt" element={<Receipt />} />
          <Route path="RegisterParcel" element={<RegisterParcel />} />
          <Route path="ParcelReport" element={<ParcelReport />} />
          <Route path="Payment" element={<Payment />} />
          <Route path="CheckParcel" element={<CheckParcel />} />
        </Route>

        {/* User routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Homeuser />} />
          <Route path="Tracking" element={<Tracking />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
