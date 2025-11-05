import React from "react";

const ParcelTable = ({ parcels }) => {
  return (
    <div className="rounded-xl shadow-lg bg-white p-6 overflow-x-auto">
      <table className="w-full table-auto border border-[#E14434] rounded-lg text-sm">
        <thead style={{ backgroundColor: "#E14434", color: "white" }}>
          <tr>
            <th className="px-4 py-3 text-left font-semibold w-32">
              Tracking No.
            </th>
            <th className="px-4 py-3 text-left font-semibold w-48">Sender</th>
            <th className="px-4 py-3 text-left font-semibold w-48">Receiver</th>
            <th className="px-4 py-3 text-left font-semibold w-64">Address</th>
            <th className="px-4 py-3 text-left font-semibold w-24">Weight</th>
            <th className="px-4 py-3 text-left font-semibold w-32">Service</th>
            <th className="px-4 py-3 text-left font-semibold w-40">Status</th>
            <th className="px-4 py-3 text-left font-semibold w-48">
              Updated At
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E14434]/30 bg-white">
          {parcels.length > 0 ? (
            parcels.map((parcel) => (
              <tr
                key={parcel._id}
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
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="8"
                className="text-center py-6 text-gray-500 italic bg-[#FFF9D0]"
              >
                ไม่มีข้อมูลพัสดุ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ParcelTable;
