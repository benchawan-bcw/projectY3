import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ children, allowRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/select-role" replace />;
  if (allowRoles && !allowRoles.includes(role))
    return <Navigate to="/select-role" replace />;

  return <Outlet />;
};

export default PrivateRoute;
