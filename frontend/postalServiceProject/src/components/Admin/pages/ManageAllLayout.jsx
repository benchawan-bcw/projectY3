import { Outlet, NavLink, useLocation } from "react-router-dom";

const ManageAllLayout = () => {
  const location = useLocation();

  const navItems = [
    { to: "/admin/ManageAll/EditEquipment", label: "จัดการอุปกรณ์" },
    { to: "/admin/ManageAll/EditShipping", label: "จัดการค่าส่ง" },
    { to: "/admin/ManageAll/EditZipcode", label: "จัดการรหัสไปรษณีย์" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar ย่อย */}
      <div style={{ width: "220px", background: "#f5f5f5", padding: "20px" }}>
        <h4>จัดการระบบ</h4>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to} // relative path
            end
            style={({ isActive }) => ({
              display: "block",
              padding: "10px 12px",
              margin: "6px 0",
              borderRadius: "6px",
              color: isActive ? "#fff" : "#333",
              background: isActive ? "#E14434" : "transparent",
              textDecoration: "none",
              fontWeight: isActive ? "bold" : "normal",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* เนื้อหาหลัก */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ManageAllLayout;
