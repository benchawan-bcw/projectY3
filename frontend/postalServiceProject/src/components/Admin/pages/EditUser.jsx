import React, { useEffect, useState } from "react";
import axios from "axios";

const EditUser = () => {
  const [admins, setAdmins] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);
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
      let data = res.data;

      // ถ้า backend ส่ง { users: [...] } ให้ใช้ data.users
      if (data.users && Array.isArray(data.users)) {
        setAdmins(data.users);
      } else if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        // ถ้า backend ส่ง object เดียว
        setAdmins([data]);
      }
    } catch (err) {
      console.error(err);
      setMessage("ไม่สามารถโหลดข้อมูลได้");
    }
  };

  // ===== แก้ไข admin =====
  const startEdit = (admin) => {
    setEditingAdmin({ ...admin });
  };

  // ===== ยกเลิกการแก้ไข =====
  const cancelEdit = () => {
    setEditingAdmin(null);
    setMessage("");
  };

  // ===== บันทึกการแก้ไข =====
  const saveEdit = async () => {
    try {
      const { _id, username, role } = editingAdmin;

      const res = await axiosInstance.put(`/manage-users/${_id}`, {
        username,
        role,
      });

      setMessage("บันทึกสำเร็จ");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>จัดการ Admin / Super Admin</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin._id}>
              <td>
                {editingAdmin?._id === admin._id ? (
                  <input
                    value={editingAdmin.username}
                    onChange={(e) =>
                      setEditingAdmin({
                        ...editingAdmin,
                        username: e.target.value,
                      })
                    }
                  />
                ) : (
                  admin.username
                )}
              </td>
              <td>
                {editingAdmin?._id === admin._id ? (
                  <select
                    value={editingAdmin.role}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, role: e.target.value })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                ) : (
                  admin.role
                )}
              </td>
              <td>
                {editingAdmin?._id === admin._id ? (
                  <>
                    <button onClick={saveEdit}>บันทึก</button>
                    <button onClick={cancelEdit}>ยกเลิก</button>
                  </>
                ) : (
                  <button onClick={() => startEdit(admin)}>แก้ไข</button>
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
