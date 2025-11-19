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
        style={{ textAlign: "center", color: "#E14434", marginBottom: "30px" }}
      >
        จัดการอุปกรณ์
      </h3>

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
              padding: "8px",
              flex: "1",
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
              padding: "8px",
              width: "100px",
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
              padding: "8px",
              width: "100px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: "8px 16px",
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
        {message && (
          <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
        )}
      </div>

      <h4 style={{ color: "#E14434", marginBottom: "20px" }}>รายการอุปกรณ์</h4>
      {["กล่อง", "ซอง", "เชือก", "บับเบิ้ล"].map((category) => {
        const list =
          category === "กล่อง"
            ? boxes
            : category === "ซอง"
            ? envelopes
            : category === "เชือก"
            ? ties
            : bubbleWrap;

        return (
          <div
            key={category}
            style={{
              marginBottom: "25px",
              backgroundColor: "#fdf5e6",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            <h5 style={{ color: "#E14434", marginBottom: "10px" }}>
              {category}
            </h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {list.map((item) => (
                <li
                  key={item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    marginBottom: "8px",
                    borderRadius: "6px",
                    backgroundColor:
                      editingEquipment?._id === item._id ? "#fff1f0" : "#fff",
                    border: "1px solid #E14434",
                  }}
                >
                  {editingEquipment?._id === item._id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
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
                          flex: 1,
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                        }}
                      />
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
                      <input
                        type="number"
                        value={editingEquipment.quantity}
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
                    </div>
                  ) : (
                    <>
                      <span>
                        {item.name} - {item.price}฿ - {item.quantity} ชิ้น
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setEditingEquipment({ ...item })}
                          style={{
                            padding: "4px 10px",
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
                            padding: "4px 10px",
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
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default EditEquipment;
