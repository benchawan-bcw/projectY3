import { Outlet } from "react-router-dom";
import Navbar from "./components/AdminNavbar.jsx";

const AdminLayout = () => {
  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: "70px" }}></div>
      <Outlet />
    </div>
  );
};

export default AdminLayout;
