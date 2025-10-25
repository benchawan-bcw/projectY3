import { Outlet } from "react-router-dom";
import Navbar from "./components/AdminNavbar.jsx";

const AdminLayout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};

export default AdminLayout;
