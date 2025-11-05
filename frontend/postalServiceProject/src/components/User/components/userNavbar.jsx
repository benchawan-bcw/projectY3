import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useState } from "react";

const UserNavbar = () => {
  const [hovered, setHovered] = useState(null);

  const navItems = [
    { to: "/user", label: "หน้าหลัก", icon: "bi-house" },
    {
      to: "/user/Tracking",
      label: "ตรวจสอบสถานะพัสดุ",
      icon: "bi-truck",
    },
  ];

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
              as={Link}
              key={item.to}
              to={item.to}
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
                width: "20%",
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

export default UserNavbar;
