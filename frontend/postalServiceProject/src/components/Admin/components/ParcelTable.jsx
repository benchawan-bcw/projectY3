import React, { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

const ParcelTable = ({ parcels = [], onUpdateSuccess }) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);

  const handleEdit = (parcel) => {
    setEditingParcel(parcel);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingParcel(null);
  };

  const handleChange = (e) => {
    setEditingParcel({
      ...editingParcel,
      [e.target.name]: e.target.value,
    });
  };

  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!trackingNumber.trim()) {
        alert("ยังไม่มีเลขพัสดุ");
        return;
      }

      console.log("📦 สแกนพัสดุแล้ว:", trackingNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingParcel?._id) return;

    try {
      console.log(editingParcel._id);
      await axios.put(
        `http://localhost:4000/admin-ban-poolsub/editParcel/${editingParcel._id}`,
        editingParcel,
        { auth: { username: "admin", password: "bands" } }
      );
      alert("อัปเดตข้อมูลสำเร็จ!");
      onUpdateSuccess(); // reload list from parent
      handleClose();
    } catch (err) {
      console.error("Update error:", err);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพัสดุนี้?")) return;

    try {
      await axios.delete(
        `http://localhost:4000/admin-ban-poolsub/deleteParcel/${id}`,
        { auth: { username: "admin", password: "bands" } }
      );
      alert("ลบข้อมูลสำเร็จ!");
      onUpdateSuccess(); // reload รายการจาก parent component
    } catch (err) {
      console.error("Delete error:", err);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FFFDF5]">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg w-full max-w-6xl">
        <table className="w-full table-auto rounded-lg text-sm border-none mx-auto">
          <thead style={{ backgroundColor: "#E14434", color: "white" }}>
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-32">
                Tracking No.
              </th>
              <th className="px-4 py-3 text-left font-semibold w-48">ผู้ส่ง</th>
              <th className="px-4 py-3 text-left font-semibold w-48">ผู้รับ</th>
              <th className="px-4 py-3 text-left font-semibold w-64">
                ที่อยู่
              </th>
              <th className="px-4 py-3 text-left font-semibold w-26">
                น้ำหนัก
              </th>
              <th className="px-4 py-3 text-left font-semibold w-32">บริการ</th>
              <th className="px-4 py-3 text-left font-semibold w-40">สถานะ</th>
              <th className="px-4 py-3 text-left font-semibold w-48">
                แก้ไขเมื่อ
              </th>
              <th className="px-4 py-3 text-center font-semibold w-24">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E14434]/30 bg-white">
            {parcels.length > 0 ? (
              parcels.map((parcel, index) => (
                <tr
                  key={parcel._id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#FFF7DD" : "white",
                  }}
                  className="hover:bg-[#FFF3A0] transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-gray-800">
                    {parcel.tracking_number}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{parcel.sender}</td>
                  <td className="px-4 py-3 text-gray-800">{parcel.receiver}</td>
                  <td className="px-4 py-3 text-gray-800 truncate max-w-xs">
                    {parcel.address}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{parcel.weight} g</td>
                  <td className="px-4 py-3 text-gray-800">
                    {parcel.service_type}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#E14434]">
                    {parcel.status}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(parcel.update_at).toLocaleString("th-TH")}
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() => handleEdit(parcel)}
                      style={{
                        color: "#2563eb",
                        fontWeight: 500,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) => (e.target.style.color = "#1e40af")}
                      onMouseOut={(e) => (e.target.style.color = "#2563eb")}
                    >
                      แก้ไข
                    </button>

                    <button
                      onClick={() => handleDelete(parcel._id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "black",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.backgroundColor = "#dc2626")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.backgroundColor = "#ef4444")
                      }
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-500 italic bg-[#FFF9D0]"
                >
                  ไม่มีข้อมูลพัสดุ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          >
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 transform transition-all duration-300 ease-out scale-100 animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                ✏️ แก้ไขข้อมูลพัสดุ
              </h3>

              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Tracking No.",
                    name: "tracking_number",
                    type: "text",
                  },
                  { label: "ผู้ส่ง", name: "sender", type: "text" },
                  { label: "ผู้รับ", name: "receiver", type: "text" },
                  { label: "ที่อยู่", name: "address", type: "text" },
                  { label: "น้ำหนัก (g)", name: "weight", type: "number" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block mb-1 text-sm font-medium">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={editingParcel?.[field.name] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-[#E14434]"
                    />
                  </div>
                ))}

                {/* ปุ่ม */}
                <div className="col-span-2 flex justify-end mt-4 gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#E14434] text-white rounded-lg hover:bg-red-700"
                  >
                    บันทึก
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ParcelTable;
