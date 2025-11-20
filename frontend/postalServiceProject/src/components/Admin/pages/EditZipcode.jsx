import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const EditZipcode = () => {
  const [list, setList] = useState([]);
  const [newPostcode, setNewPostcode] = useState("");
  const [editId, setEditId] = useState(null);
  const [editPostcode, setEditPostcode] = useState("");

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
      const res = await axiosInstance.get("/getAllPostcodes");
      setList(res.data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // เพิ่มข้อมูลใหม่
  const handleAddNew = async () => {
    if (!newPostcode) return alert("กรุณากรอก postcode");

    try {
      await axiosInstance.post("/createPostcode", { postcode: newPostcode });
      setNewPostcode("");
      fetchData();
    } catch (err) {
      console.error("Error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // เริ่มแก้ไข
  const startEdit = (item) => {
    setEditId(item._id);
    setEditPostcode(item.postcode);
  };

  // ยกเลิกแก้ไข
  const cancelEdit = () => {
    setEditId(null);
    setEditPostcode("");
  };

  // บันทึกแก้ไข
  const handleSubmitRow = async (id) => {
    if (!editPostcode) return alert("กรุณากรอก postcode");

    try {
      await axiosInstance.put(`/updatePostcode/${id}`, {
        postcode: editPostcode,
      });
      setEditId(null);
      setEditPostcode("");
      fetchData();
    } catch (err) {
      console.error("Error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // ลบข้อมูล
  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบรายการนี้?")) return;

    try {
      await axiosInstance.delete(`/deletePostcode/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
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
        จัดการรหัสไปรษณีย์พื้นที่พิเศษ
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
          เพิ่มรหัสไปรษณีย์พื้นที่พิเศษ
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
            value={newPostcode}
            onChange={(e) => setNewPostcode(e.target.value)}
            placeholder="รหัสไปรษณีย์พื้นที่พิเศษ"
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

      {/* ตาราง */}
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
              รหัสไปรษณีย์พื้นที่พิเศษ
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
                      type="text"
                      value={editPostcode}
                      onChange={(e) => setEditPostcode(e.target.value)}
                      style={{
                        padding: "6px",
                        width: "140px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    />
                  ) : (
                    item.postcode
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
export default EditZipcode;
