import { Outlet } from "react-router-dom";
import Tracking from "../User/pages/Tracking";
import Navbar from "./components/userNavbar.jsx"

const UserLayout = () => {
  return (
    <div>
      <Navbar />
      {/* <Tracking /> */}
      <Outlet />
    </div>
  );
};

export default UserLayout;
