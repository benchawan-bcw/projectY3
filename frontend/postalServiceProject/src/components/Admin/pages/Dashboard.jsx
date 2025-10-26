// สรุปพัสดุส่งล่าสุด, สถิติพัสดุต่อวัน/เดือน
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ParcelTable from "../components/ParcelTable.jsx";
import axios from "axios";
// import { set } from "mongoose";

const Dashboard = () => {
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  // เลือก วัน เดือน ปี
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthDate, setMonthDate] = useState(null);
  const [yearDate, setYearDate] = useState(null);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/admin-ban-poolsub/getParcels",
          {
            auth: {
              username: "admin",
              password: "bands",
            },
          }
        );
        setParcels(res.data);
        setFilteredParcels(res.data.slice(0, 10)); // แสดง 10 รายการล่าสุด
      } catch (err) {
        console.error("Error fetching parcels:", err);
      } finally {
        setLoading(false); // ✅ ไม่ว่าจะสำเร็จหรือ error ให้หยุดโหลด
      }
    };
    fetchParcels();
  }, []);

  const filterByDate = () => {
    const filtered = parcels.filter((p) => {
      const parcelDate = new Date(p.update_at);
      let start = startDate;
      let end = endDate;

      // ถ้าเลือก month
      if (monthDate) {
        start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        end = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );
      }

      // ถ้าเลือก year
      if (yearDate) {
        start = new Date(yearDate.getFullYear(), 0, 1);
        end = new Date(yearDate.getFullYear(), 11, 31, 23, 59, 59);
      }

      // ถ้าไม่มี start/end ให้ default
      if (!start) start = new Date("1970-01-01");
      if (!end) end = new Date();

      return parcelDate >= start && parcelDate <= end;
    });

    setFilteredParcels(filtered);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      {/* ค้นหาพัสดุจาก วัน เดือน ปี */}
      <div>
        <div>
          <label>เริ่มวันที่ :</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            isClearable
            placeholderText="เลือกวันที่เริ่ม"
          />
        </div>

        <div>
          <label>ถึงวันที่ :</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            isClearable
            placeholderText="เลือกวันที่สิ้นสุด"
          />
        </div>

        <div>
          <label>เลือกเดือน :</label>
          <DatePicker
            selected={monthDate}
            onChange={(date) => setMonthDate(date)}
            dateFormat="yyyy-MM"
            showMonthYearPicker
            isClearable
            placeholderText="เลือกเดือน"
          />
        </div>

        <div>
          <label>เลือกปี :</label>
          <DatePicker
            selected={yearDate}
            onChange={(date) => setYearDate(date)}
            showYearPicker
            dateFormat="yyyy"
            isClearable
            placeholderText="เลือกปี"
          />
        </div>

        <button onClick={filterByDate}>ค้นหา</button>
      </div>

      {/* สถิติ พัสดุทั้งหมด */}
      <div className="flex gap-4">
        <div className="bg-green-100 rounded-lg p-4 flex-1 text-center">
          <p className="text-sm text-gray-600">พัสดุทั้งหมด</p>
          <p className="text-xl font-bold">{parcels.length}</p>
        </div>
      </div>

      {/* ตาราง */}
      <ParcelTable parcels={filteredParcels} />
    </div>
  );
};

export default Dashboard;
