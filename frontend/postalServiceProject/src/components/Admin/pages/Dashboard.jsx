// สรุปพัสดุส่งล่าสุด, สถิติพัสดุต่อวัน/เดือน, chart สรุปยอด
import React, { useEffect, useState } from "react";
import ParcelTable from "../components/ParcelTable.jsx";
import axios from "axios";

const Dashboard = () => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/admin-ban-poolsub/getParcels"
        );
        setParcels(res.data);
      } catch (err) {
        console.error("Error fetching parcels:", err);
      }
    };
    fetchParcels();
  }, []);

  if (loading) {return <p>Loading...</p>;}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      {/* สถิติ */}
      <div className="flex gap-4">
        <div className="bg-green-100 rounded-lg p-4 flex-1 text-center">
          <p className="text-sm text-gray-600">พัสดุทั้งหมด</p>
          <p className="text-xl font-bold">{parcels.length}</p>
        </div>
      </div>

      {/* ตาราง */}
      <ParcelTable parcels={parcels} />
    </div>
  );
};

export default Dashboard;
