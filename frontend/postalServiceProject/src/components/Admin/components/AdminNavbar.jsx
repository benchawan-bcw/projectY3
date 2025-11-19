import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useState, useEffect } from "react";

const AdminNavbar = () => {
  const [hovered, setHovered] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    // ดึง role จาก localStorage (ควรเก็บตอน login)
    const storedRole = localStorage.getItem("role");
    if (storedRole) setRole(storedRole);
  }, []);

  const navItems = [
    { to: "/admin", label: "หน้าหลัก", icon: "bi-house" },
    {
      to: "/admin/CheckParcel",
      label: "ตรวจสอบสถานะพัสดุ",
      icon: "bi-truck",
    },
    {
      to: "/admin/RegisterParcel",
      label: "ลงทะเบียนพัสดุใหม่",
      icon: "bi-box-seam",
    },
    {
      to: "/admin/Payment",
      label: "คำนวณค่าจัดส่งพัสดุ",
      icon: "bi-calculator",
    },
    { to: "/admin/Receipt", label: "พิมพ์ใบเสร็จ", icon: "bi-receipt" },
    ...(role === "super_admin"
      ? [
          { to: "/admin/ManageAll", label: "จัดการ", icon: "bi-pencil-square" },
          {
            to: "/admin/EditUser",
            label: "จัดการผู้ใช้",
            icon: "bi-person-gear",
          },
        ]
      : []),
    {
      to: "/logout",
      label: "Logout",
      icon: "bi-box-arrow-right",
      logout: true,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/SelectRole";
  };

  return (
    <>
      <Navbar
        fixed="top"
        className="py-2"
        style={{
          backgroundColor: "#E14434",
        }}
      >
        <Container className="justify-content-around">
          {navItems.map((item, index) => (
            <Nav.Link
              key={item.to}
              as={item.logout ? "div" : Link}
              to={item.logout ? undefined : item.to}
              onClick={item.logout ? handleLogout : undefined}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: hovered === index ? "#E14434" : "#FEFBC7",
                backgroundColor: hovered === index ? "#FEFBC7" : "transparent",
                padding: "0.2rem 0.5rem",
                borderRadius: "8px",
                width: "100%",
                textAlign: "center",
              }}
            >
              {item.icon && <i className={`bi ${item.icon} fs-4`}></i>}
              <small>{item.label}</small>
            </Nav.Link>
          ))}
        </Container>
      </Navbar>
    </>
  );
};

export default AdminNavbar;
