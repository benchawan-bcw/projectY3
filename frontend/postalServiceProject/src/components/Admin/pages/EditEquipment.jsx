import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const EditEquipment = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [ties, setTies] = useState([]);
  const [bubbleWrap, setBubbleWrap] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const [newEquipment, setNewEquipment] = useState({
    name: "",
    price: "",
    quantity: 1,
  });
  const [editingEquipment, setEditingEquipment] = useState(null);

  const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/admin-ban-poolsub",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // ===== โหลดอุปกรณ์ =====
  const fetchEquipment = async () => {
    try {
      const res = await axiosInstance.get("/getEquipment");
      const data = res.data || [];
      setEquipmentList(data);

      setBoxes(data.filter((e) => e.name.includes("กล่อง")));
      setEnvelopes(data.filter((e) => e.name.includes("ซอง")));
      setTies(data.filter((e) => e.name.includes("เชือก")));
      setBubbleWrap(data.filter((e) => e.name.includes("บับเบิ้ล")));
    } catch (err) {
      console.error("ไม่สามารถโหลดข้อมูลอุปกรณ์:", err);
      setMessage("ไม่สามารถโหลดข้อมูลอุปกรณ์");
    }
  };

  // โหลดตอน component mount
  useEffect(() => {
    fetchEquipment();
  }, []);

  // ===== เพิ่มอุปกรณ์ =====
  const handleCreate = async () => {
    try {
      if (!newEquipment.name || !newEquipment.price) {
        setMessage("ต้องระบุชื่อและราคา");
        return;
      }

      const res = await axiosInstance.post("/createEquipment", newEquipment);
      setMessage("เพิ่มอุปกรณ์เรียบร้อย");
      setNewEquipment({ name: "", price: "", quantity: 1 });
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const startEditing = (item) => {
    setEditingEquipment({ ...item });
  };

  // ===== แก้ไขอุปกรณ์ =====
  const handleUpdate = async (id) => {
    try {
      const res = await axiosInstance.put(
        `/updateEquipment/${editingEquipment._id}`,
        editingEquipment
      );
      setMessage("แก้ไขอุปกรณ์เรียบร้อย");
      setEditingEquipment(null);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // ===== ลบอุปกรณ์ =====
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบอุปกรณ์นี้?")) return;

    try {
      const res = await axiosInstance.delete(`/deleteEquipment/${id}`);
      setMessage(res.data.message);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
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
        จัดการอุปกรณ์
      </h3>

      {/* เพิ่มอุปกรณ์ใหม่ */}
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
          เพิ่มอุปกรณ์ใหม่
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
            type="text"
            placeholder="ชื่ออุปกรณ์"
            value={newEquipment.name}
            onChange={(e) =>
              setNewEquipment({ ...newEquipment, name: e.target.value })
            }
            style={{
              flex: 2,
              minWidth: "0",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="ราคา"
            value={newEquipment.price}
            onChange={(e) =>
              setNewEquipment({
                ...newEquipment,
                price: Number(e.target.value),
              })
            }
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
            placeholder="จำนวน"
            value={newEquipment.quantity}
            onChange={(e) =>
              setNewEquipment({
                ...newEquipment,
                quantity: Number(e.target.value),
              })
            }
            style={{
              flex: 1,
              minWidth: "0",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleCreate}
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
            เพิ่มอุปกรณ์
          </button>
        </div>
      </div>

      {/* ตารางรายการอุปกรณ์ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 6px",
          textAlign: "center",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#E14434", color: "#fff" }}>
            <th style={{ padding: "12px", borderRadius: "6px 6px 0 0" }}>
              ชื่ออุปกรณ์
            </th>
            <th style={{ padding: "12px" }}>ราคา (฿)</th>
            <th style={{ padding: "12px" }}>จำนวน</th>
            <th style={{ padding: "12px", borderRadius: "6px 6px 0 0" }}>
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody>
          {["กล่อง", "ซอง", "เชือก", "บับเบิ้ล"].map((category) => {
            const list =
              category === "กล่อง"
                ? boxes
                : category === "ซอง"
                ? envelopes
                : category === "เชือก"
                ? ties
                : bubbleWrap;

            return list.map((item) => {
              const isEditing = editingEquipment?._id === item._id;
              return (
                <tr
                  key={item._id}
                  style={{
                    backgroundColor: isEditing ? "#fff1f0" : "#fdf5e6",
                    transition: "background 0.3s",
                  }}
                >
                  <td style={{ padding: "10px" }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingEquipment?.name || ""}
                        onChange={(e) =>
                          setEditingEquipment({
                            ...editingEquipment,
                            name: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                        }}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingEquipment?.price || ""}
                        onChange={(e) =>
                          setEditingEquipment({
                            ...editingEquipment,
                            price: Number(e.target.value),
                          })
                        }
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
                      <input
                        type="number"
                        value={editingEquipment?.quantity || ""}
                        onChange={(e) =>
                          setEditingEquipment({
                            ...editingEquipment,
                            quantity: Number(e.target.value),
                          })
                        }
                        style={{
                          width: "80px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                        }}
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      display: "flex",
                      gap: "6px",
                      justifyContent: "center",
                    }}
                  >
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdate(editingEquipment._id)}
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
                          onClick={() => setEditingEquipment(null)}
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
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingEquipment({ ...item })}
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
                      </>
                    )}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EditEquipment;
