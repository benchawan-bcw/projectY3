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
      <div
        className="relative overflow-x-auto shadow-md sm:rounded-lg w-full max-w-6xl"
        style={{
          borderRadius: "10px",
        }}
      >
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={handleClose}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-8 relative transform transition-all duration-300 ease-out"
              style={{
                width: "800px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                position: "fixed",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)", // 💡 เพิ่มเงาสวยๆ
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-semibold text-[#E14434] mb-6 text-center">
                ✏️ แก้ไขข้อมูลพัสดุ
              </h3>

              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
                {/* Tracking No. เต็มแถว */}
                <div className="col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Tracking No.
                  </label>
                  <input
                    type="text"
                    name="tracking_number"
                    value={editingParcel?.tracking_number || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#E14434] focus:outline-none"
                    style={{
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* ผู้ส่ง */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    ผู้ส่ง
                  </label>
                  <input
                    type="text"
                    name="sender"
                    value={editingParcel?.sender || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#E14434] focus:outline-none"
                    style={{
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* ผู้รับ */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    ผู้รับ
                  </label>
                  <input
                    type="text"
                    name="receiver"
                    value={editingParcel?.receiver || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#E14434] focus:outline-none"
                    style={{
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* ที่อยู่ */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    ที่อยู่
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingParcel?.address || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#E14434] focus:outline-none"
                    style={{
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* น้ำหนัก */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    น้ำหนัก (g)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={editingParcel?.weight || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#E14434] focus:outline-none"
                    style={{
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* ปุ่มบันทึก/ยกเลิก */}
                <div className="col-span-2 flex justify-end mt-6 gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#E14434] text-white rounded-lg hover:bg-red-700 transition"
                    style={{
                      borderRadius: "10px",
                    }}
                  >
                    💾 บันทึก
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    style={{
                      borderRadius: "10px",
                    }}
                  >
                    ❌ ยกเลิก
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
