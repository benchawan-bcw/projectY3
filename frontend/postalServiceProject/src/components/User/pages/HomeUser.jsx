import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const Homeuser = () => {
  const [equipment, setEquipment] = useState([]);
  const [rates, setRates] = useState([]);

  const midpoint = Math.ceil(rates.length / 2);
  const firstHalf = rates.slice(0, midpoint);
  const secondHalf = rates.slice(midpoint);

  // อุปกรณ์
  useEffect(() => {
    axios
      .get("http://localhost:4000/admin-ban-poolsub/equipment", {
        auth: {
          username: "admin",
          password: "bands",
        },
      })
      .then((res) => {
        setEquipment(res.data);
      })
      .catch((err) => console.error("ไม่สามารถโหลดข้อมูลอุปกรณ์:", err));
  }, []);

  const quarter = Math.ceil(rates.length / 4);
  const firstQuarter = rates.slice(0, quarter);
  const secondQuarter = rates.slice(quarter, quarter * 2);
  const thirdQuarter = rates.slice(quarter * 2, quarter * 3);
  const fourthQuarter = rates.slice(quarter * 3);

  const categoryName = (key) => {
    switch (key) {
      case "boxes":
        return "กล่องพัสดุ";
      case "envelopes":
        return "ซอง";
      case "ties":
        return "เชือก";
      case "bubble_wrap":
        return "บับเบิ้ลกันกระแทก";
      default:
        return key;
    }
  };

  //ค่าส่ง EMS
  useEffect(() => {
    axios
      .get("http://localhost:4000/customer-ban-poolsub/shippingRate")
      .then((res) => setRates(res.data))
      .catch((err) => console.error("Error fetching shipping rates:", err));
  }, []);

  const renderTable = (data) => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "transform 0.2s ease",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "15px",
        }}
      >
        <thead
          style={{
            backgroundColor: "#E14434",
            color: "white",
            textAlign: "left",
          }}
        >
          <tr>
            <th style={{ padding: "8px 14px", width: "70%" }}>
              น้ำหนักสูงสุด (กรัม)
            </th>
            <th style={{ padding: "8px 14px", textAlign: "right" }}>
              ราคา (บาท)
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((rate, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
              }}
            >
              <td style={{ padding: "8px 14px", textAlign: "left" }}>
                {rate.max.toLocaleString()} กรัม
              </td>
              <td
                style={{
                  padding: "8px 14px",
                  textAlign: "right",
                  fontWeight: "500",
                  color: "#E14434",
                }}
              >
                {rate.price.toLocaleString()} บาท
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      style={{
        padding: "32px",
        fontFamily: "Prompt, sans-serif",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          backgroundColor: "#FEFBC7",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontFamily: "K2D, sans-serif",
            fontSize: "48px",
            fontWeight: "bold",
            textAlign: "center",
            color: "#E14434",
            letterSpacing: "0.5px",
            margin: "3rem",
            padding: "1rem",
          }}
        >
          🏠 บ้านไปรษณีย์พูลทรัพย์
        </h1>
      </header>

      {/* ตารางค่าส่ง */}
      <div
        style={{
          padding: "10px",
          borderRadius: "16px",
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "2rem",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#E14434",
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "16px",
          }}
        >
          ค่าส่งพัสดุ(รวมค่าบริการ)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            justifyContent: "center",
          }}
        >
          {renderTable(firstQuarter)}
          {renderTable(secondQuarter)}
          {renderTable(thirdQuarter)}
          {renderTable(fourthQuarter)}
        </div>
      </div>

      {/* ค่าอุปกร */}
      <div
        style={{
          padding: "10px",
          borderRadius: "16px",
          maxWidth: "1500px",
          margin: "0 auto",
          marginTop: "2rem",
          padding: "2rem",
          backgroundColor: "white",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#E14434",
            fontSize: "22px",
            fontWeight: "700",
            marginBottom: "16px",
          }}
        >
          ค่าอุปกรณ์
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "1rem",
          }}
        >
          {Object.entries(equipment).map(([category, items]) => (
            <div
              key={category}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
                transition: "transform 0.2s ease",
              }}
            >
              <h3
                style={{
                  backgroundColor: "#E14434",
                  color: "white",
                  padding: "10px 16px",
                  fontSize: "18px",
                }}
              >
                {categoryName(category)}
              </h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "15px",
                }}
              >
                <thead
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                    textAlign: "left",
                  }}
                >
                  <tr>
                    <th style={{ padding: "10px 16px", width: "70%" }}>
                      ชื่ออุปกรณ์
                    </th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>
                      ราคา
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
                        transition: "0.2s",
                      }}
                    >
                      <td style={{ padding: "10px 16px", textAlign: "left" }}>
                        {Array.isArray(item.name)
                          ? item.name.join(", ")
                          : item.name}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          textAlign: "right",
                          fontWeight: "500",
                        }}
                      >
                        {item.price} บาท
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homeuser;
