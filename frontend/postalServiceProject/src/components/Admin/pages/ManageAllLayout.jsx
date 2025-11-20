import { Outlet, NavLink, useLocation } from "react-router-dom";

const ManageAllLayout = () => {
  const location = useLocation();

  const navItems = [
    { to: "/admin/ManageAll/EditEquipment", label: "จัดการอุปกรณ์" },
    { to: "/admin/ManageAll/EditShipping", label: "จัดการค่าส่ง" },
    {
      to: "/admin/ManageAll/EditZipcode",
      label: "จัดการรหัสไปรษณีย์พื้นที่พิเศษ",
    },
  ];

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* หัวข้อ */}
      <h2
        style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#E14434",
          fontWeight: "bold",
          fontSize: "2rem",
          letterSpacing: "1px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
          marginTop: "2rem",
        }}
      >
        จัดการระบบ
      </h2>

      {/* Navbar ด้านบน */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "10px 0",
          marginBottom: "20px",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            style={({ isActive }) => ({
              padding: "10px 20px",
              borderRadius: "12px",
              textDecoration: "none",
              color: isActive ? "#fff" : "#333",
              background: isActive ? "#E14434" : "#f9f9f9",
              fontWeight: isActive ? "bold" : "500",
              transition: "0.3s",
              border: isActive ? "none" : "1px solid #ccc",
              boxShadow: isActive ? "0 4px 8px rgba(0,0,0,0.15)" : "none",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* เนื้อหา */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default ManageAllLayout;
