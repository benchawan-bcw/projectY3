// ตารางพัสดุ
import React from "react";

const ParcelTable = ({ parcels }) => {
  return (
    <div className="overflow-x-auto rounded-lg shadow-md bg-white p-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tracking No.</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Sender</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Receiver</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Address</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weight</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Service</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Update At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {parcels.map((parcel) => (
            <tr key={parcel._id}>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.tracking_number}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.sender}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.receiver}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.address}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.weight} kg</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.service_type}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{parcel.status}</td>
              <td className="px-4 py-2 text-sm text-gray-800">{new Date(parcel.update_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParcelTable;
