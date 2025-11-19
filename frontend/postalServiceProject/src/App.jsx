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
import EditUser from "./components/Admin/pages/EditUser.jsx";
import PrivateRoute from "./components/Login/pages/privateRoute.jsx";
import SelectRole from "./components/Login/pages/login.jsx";
import LoginAdmin from "./components/Login/pages/loginAdmin.jsx";
import ManageAllLayout from "./components/Admin/pages/ManageAllLayout.jsx";
import EditEquipment from "./components/Admin/pages/EditEquipment.jsx";
import EditShipping from "./components/Admin/pages/EditShipping.jsx";
import EditZipcode from "./components/Admin/pages/EditZipcode.jsx";

// User pages
import UserLayout from "./components/User/UserLayout.jsx";
import Tracking from "./components/User/pages/Tracking.jsx";
import Homeuser from "./components/User/pages/HomeUser.jsx";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/SelectRole" />} />

        <Route path="/SelectRole" element={<SelectRole />} />
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* Admin routes */}
        <Route
          element={<PrivateRoute allowedRoles={["admin", "super_admin"]} />}
        >
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="Receipt" element={<Receipt />} />
            <Route path="RegisterParcel" element={<RegisterParcel />} />
            <Route path="ParcelReport" element={<ParcelReport />} />
            <Route path="Payment" element={<Payment />} />
            <Route path="CheckParcel" element={<CheckParcel />} />
            {/* <Route path="EditEquipment" element={<EditEquipment />} /> */}
            <Route path="EditUser" element={<EditUser />} />

            <Route path="ManageAll/*" element={<ManageAllLayout />}>
              <Route index element={<EditEquipment />} />
              <Route path="EditEquipment" element={<EditEquipment />} />
              <Route path="EditShipping" element={<EditShipping />} />
              <Route path="EditZipcode" element={<EditZipcode />} />
            </Route>
          </Route>
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
