import { Outlet } from "react-router-dom";
import Tracking from "../User/pages/Tracking";

const UserLayout = () => {
  return (
    <div>
      <Tracking />
      <Outlet />
    </div>
  );
};

export default UserLayout;
