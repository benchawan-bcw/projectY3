import React, { useEffect, useState } from "react";
import axios from "axios";

const EditUser = () => {
  const [admins, setAdmins] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    role: "admin",
  });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token"); // token ของ super admin

  const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/admin-ban-poolsub",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // ===== โหลดรายชื่อ admin =====
  const fetchAdmins = async () => {
    try {
      const res = await axiosInstance.get("/manage-users");
      const data = res.data;

      if (data.users && Array.isArray(data.users)) {
        setAdmins(data.users);
      } else if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        setAdmins([data]);
      }
    } catch (err) {
      console.error(err);
      setMessage("ไม่สามารถโหลดข้อมูลได้");
    }
  };
  useEffect(() => {
    if (!token) return setMessage("คุณยังไม่ได้ล็อกอิน");
    fetchAdmins();
  }, [token]);

  // ===== เพิ่ม admin =====
  const addAdmin = async () => {
    try {
      await axiosInstance.post("/manage-users", newAdmin);
      setMessage("เพิ่ม admin สําเร็จ");
      setNewAdmin({ username: "", password: "", role: "admin" });
      fetchAdmins();
    } catch (err) {
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // ===== แก้ไข admin =====
  const startEdit = (admin) => setEditingAdmin({ ...admin });
  const cancelEdit = () => setEditingAdmin(null);

  const saveEdit = async () => {
    if (!editingAdmin) return;
    try {
      const { _id, username, role, password } = editingAdmin;
      await axiosInstance.put(`/manage-users/${_id}`, {
        username,
        role,
        password,
      });
      setMessage("บันทึกสำเร็จ");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // ===== ลบ admin =====
  const deleteAdmin = async (_id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบ admin นี้?")) return;
    try {
      await axiosInstance.delete(`/manage-users/${_id}`);
      setMessage("ลบสำเร็จ");
      fetchAdmins();
    } catch (err) {
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          color: "#E14434",
        }}
      >
        จัดการ Admin / Super Admin
      </h2>

      {message && (
        <p
          style={{ color: "green", textAlign: "center", marginBottom: "1rem" }}
        >
          {message}
        </p>
      )}

      {/* ฟอร์มเพิ่ม admin */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <input
          placeholder="Username"
          value={newAdmin.username}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, username: e.target.value })
          }
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "1 1 150px",
          }}
        />
        <input
          placeholder="Password"
          type="password"
          value={newAdmin.password}
          onChange={(e) =>
            setNewAdmin({ ...newAdmin, password: e.target.value })
          }
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "1 1 150px",
          }}
        />
        <select
          value={newAdmin.role}
          onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "1 1 150px",
          }}
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button
          onClick={addAdmin}
          style={{
            padding: "8px 16px",
            backgroundColor: "#E14434",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        >
          เพิ่ม Admin
        </button>
      </div>

      {/* ตาราง admin */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#E14434", color: "#fff" }}>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>
              Username
            </th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>
              Password
            </th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>Role</th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin._id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px" }}>
                {editingAdmin?._id === admin._id ? (
                  <input
                    value={editingAdmin?.username || ""}
                    onChange={(e) =>
                      setEditingAdmin({
                        ...editingAdmin,
                        username: e.target.value,
                      })
                    }
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  />
                ) : (
                  admin.username
                )}
              </td>
              <td style={{ padding: "10px" }}>
                {editingAdmin?._id === admin._id ? (
                  <input
                    type="password"
                    value={editingAdmin?.password || ""}
                    onChange={(e) =>
                      setEditingAdmin({
                        ...editingAdmin,
                        password: e.target.value,
                      })
                    }
                    placeholder="เปลี่ยน password"
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  />
                ) : (
                  <i>********</i>
                )}
              </td>
              <td style={{ padding: "10px" }}>
                {editingAdmin?._id === admin._id ? (
                  <select
                    value={editingAdmin?.role || ""}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, role: e.target.value })
                    }
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                ) : (
                  admin.role
                )}
              </td>
              <td style={{ padding: "10px", minWidth: "160px" }}>
                {editingAdmin?._id === admin._id ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={saveEdit}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        flex: "1 1 70px",
                      }}
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f44336",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        flex: "1 1 70px",
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
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() => startEdit(admin)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#2196F3",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        flex: "1 1 70px",
                      }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => deleteAdmin(admin._id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f44336",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        flex: "1 1 70px",
                      }}
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditUser;
