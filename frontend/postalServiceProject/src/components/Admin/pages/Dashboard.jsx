import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ParcelTable from "../components/ParcelTable.jsx";
import axios from "axios";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

const Dashboard = () => {
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // ช่วงเวลา
  const [selectedDate, setSelectedDate] = useState(null);
  const [periodType, setPeriodType] = useState("daily");

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/admin-ban-poolsub/getParcels",
          {
            auth: { username: "admin", password: "bands" },
          }
        );
        setParcels(res.data);
        setFilteredParcels(res.data.slice(0, 10)); // แสดง 10 รายการล่าสุด
      } catch (err) {
        console.error("Error fetching parcels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchParcels();
  }, []);

  // กรองพัสดุตามช่วงเวลา
  const filterByDate = () => {
    if (!selectedDate) return setFilteredParcels(parcels.slice(0, 10));

    const filtered = parcels.filter((p) => {
      const parcelDate = dayjs(p.update_at);
      if (periodType === "daily") return parcelDate.isSame(selectedDate, "day");
      if (periodType === "weekly")
        return (
          parcelDate.week() === dayjs(selectedDate).week() &&
          parcelDate.year() === dayjs(selectedDate).year()
        );
      if (periodType === "monthly")
        return parcelDate.isSame(selectedDate, "month");
      return false;
    });

    setFilteredParcels(filtered);
  };

  // ประมวลผลรายงานสรุปตามช่วงเวลา
  useEffect(() => {
    if (!selectedDate || parcels.length === 0) return setReport([]);

    const filtered = parcels.filter((p) => {
      if (!p.update_at) return false;
      const date = dayjs(p.update_at);

      if (periodType === "daily") return date.isSame(selectedDate, "day");
      if (periodType === "weekly")
        return (
          date.week() === dayjs(selectedDate).week() &&
          date.year() === dayjs(selectedDate).year()
        );
      if (periodType === "monthly") return date.isSame(selectedDate, "month");
      return false;
    });

    const grouped = {};
    filtered.forEach((p) => {
      const key = p.sender;
      if (!grouped[key])
        grouped[key] = { sender: p.sender, totalParcels: 0, totalPrice: 0 };
      grouped[key].totalParcels += 1;
      grouped[key].totalPrice += Number(p.price || 0);
    });

    setReport(Object.values(grouped));
  }, [parcels, selectedDate, periodType]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6 px-6 py-4 font-sans max-w-[1400px] mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 text-center">
        Dashboard Admin
      </h1>

      {/* เลือกช่วงเวลา */}
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholderText="เลือกวัน/สัปดาห์/เดือน"
          dateFormat={periodType === "monthly" ? "MM/yyyy" : "yyyy-MM-dd"}
          showMonthYearPicker={periodType === "monthly"}
          isClearable
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
          style={{
            marginRight: "16px", // ช่องว่างด้านขวา
          }}
        />

        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-40"
          style={{
            marginRight: "16px", // ช่องว่างด้านขวา
            marginLeft: "16px",
          }}
        >
          <option value="daily">รายวัน</option>
          <option value="weekly">รายสัปดาห์</option>
          <option value="monthly">รายเดือน</option>
        </select>

        <button
          onClick={filterByDate}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded shadow-md transition-colors w-32"
          style={{ backgroundColor: "#E14434", color: "white" }}
        >
          ค้นหา
        </button>
      </div>

      {/* สถิติพัสดุ */}
      <div className="flex gap-4">
        <div className="bg-green-100 rounded-lg p-4 flex-1 text-center">
          <p className="text-sm text-gray-600">พัสดุทั้งหมด</p>
          <p className="text-xl font-bold">{parcels.length}</p>
        </div>
      </div>

      {/* ตาราง */}
      <ParcelTable
        parcels={filteredParcels}
        onUpdateSuccess={() => {
          // reload data หลังอัปเดต
          axios
            .get("http://localhost:4000/admin-ban-poolsub/getParcels", {
              auth: { username: "admin", password: "bands" },
            })
            .then((res) => setFilteredParcels(res.data.slice(0, 10)));
        }}
      />
    </div>
  );
};

export default Dashboard;
