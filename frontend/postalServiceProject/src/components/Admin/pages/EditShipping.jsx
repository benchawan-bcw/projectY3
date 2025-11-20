import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const EditShipping = () => {
  const [list, setList] = useState([]);
  const [max, setMax] = useState("");
  const [price, setPrice] = useState("");
  const [editId, setEditId] = useState(null);
  const [newMax, setNewMax] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/admin-ban-poolsub",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // โหลดข้อมูลทั้งหมด
  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/getAllEMSCost");
      setList(res.data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = async () => {
    if (!newMax || !newPrice) return alert("กรุณากรอกข้อมูลให้ครบ");
    try {
      await axiosInstance.post("/createEMSCost", {
        max: newMax,
        price: newPrice,
      });
      setNewMax("");
      setNewPrice("");
      fetchData();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await axiosInstance.put(`/updateEMSCost/${id}`, { max, price });
      cancelEdit();
      fetchData();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบรายการนี้?")) return;

    try {
      await axiosInstance.delete(`/deleteEMSCost/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // ตั้งค่าฟอร์มเวลาแก้ไข
  const handleEdit = (item) => {
    setMax(item.max);
    setPrice(item.price);
    setEditId(item._id);
  };

  // เริ่มแก้ไขแถว
  const startEdit = (item) => {
    setEditId(item._id);
    setMax(item.max);
    setPrice(item.price);
  };

  // ยกเลิกการแก้ไข
  const cancelEdit = () => {
    setEditId(null);
    setMax("");
    setPrice("");
  };

  // บันทึกแถวที่แก้ไข
  const handleSubmitRow = async (id) => {
    try {
      await axiosInstance.put(`/updateEMSCost/${id}`, { max, price });
      cancelEdit();
      fetchData(); // โหลดข้อมูลใหม่
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#E14434",
          fontWeight: "bold",
        }}
      >
        จัดการค่าส่ง EMS
      </h3>

      {/* แถวเพิ่มใหม่ */}
      <div
        style={{
          marginBottom: "40px",
          padding: "20px",
          backgroundColor: "#fff7f0",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ color: "#E14434", marginBottom: "15px" }}>
          เพิ่มค่าส่งใหม่
        </h4>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "15px",
          }}
        >
          <input
            type="number"
            value={newMax}
            onChange={(e) => setNewMax(e.target.value)}
            placeholder="น้ำหนักมากสุด"
            style={{
              flex: 1,
              minWidth: "0",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="ราคา"
            style={{
              flex: 1,
              minWidth: "0",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleAddNew}
            style={{
              flex: 1,
              minWidth: "0",
              padding: "8px",
              backgroundColor: "#E14434",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            เพิ่ม
          </button>
        </div>
      </div>

      {/* ตารางรายการ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 10px",
          textAlign: "center",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: "12px",
                backgroundColor: "#E14434",
                color: "#fff",
                borderRadius: "6px 6px 0 0",
              }}
            >
              น้ำหนักมากสุด (กรัม)
            </th>
            <th
              style={{
                padding: "12px",
                backgroundColor: "#E14434",
                color: "#fff",
                borderRadius: "6px 6px 0 0",
              }}
            >
              ราคาค่าส่ง (฿)
            </th>
            <th
              style={{
                padding: "12px",
                backgroundColor: "#E14434",
                color: "#fff",
                borderRadius: "6px 6px 0 0",
              }}
            >
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => {
            const isEditing = editId === item._id;
            return (
              <tr
                key={item._id}
                style={{
                  backgroundColor: isEditing ? "#fff1f0" : "#fdf5e6",
                  borderRadius: "10px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                  transition: "background 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff7f0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = isEditing
                    ? "#fff1f0"
                    : "#fdf5e6")
                }
              >
                <td style={{ padding: "10px" }}>
                  {isEditing ? (
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    />
                  ) : (
                    item.max
                  )}
                </td>
                <td style={{ padding: "10px" }}>
                  {isEditing ? (
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    />
                  ) : (
                    item.price
                  )}
                </td>
                <td style={{ padding: "10px" }}>
                  {isEditing ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleSubmitRow(item._id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#4CAF50",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#ccc",
                          color: "#333",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => startEdit(item)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#FFD700",
                          color: "#333",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#E14434",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default EditShipping;
