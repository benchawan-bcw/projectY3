import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

dayjs.extend(weekOfYear);

const ParcelReport = () => {
  const [parcels, setParcels] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // เพิ่มตรงนี้
  const [periodType, setPeriodType] = useState("daily"); // "daily", "weekly", "monthly"
  const [report, setReport] = useState([]);

  // ดึงข้อมูลพัสดุทั้งหมด
  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/admin-ban-poolsub/getParcels",
          {
            auth: { username: "admin", password: "bands" },
          }
        );
        if (Array.isArray(res.data)) setParcels(res.data);
        else setParcels([]);
      } catch (err) {
        console.error(err);
        setParcels([]);
      }
    };
    fetchParcels();
  }, []);

  // ประมวลผลสรุปตามช่วงเวลา
  useEffect(() => {
    if (!selectedDate || parcels.length === 0) return setReport([]);

    const filtered = parcels.filter((p) => {
      if (!p.update_at) return false;
      const date = dayjs(p.update_at);

      if (periodType === "daily") {
        return date.isSame(selectedDate, "day");
      } else if (periodType === "weekly") {
        return (
          date.week() === dayjs(selectedDate).week() &&
          date.year() === dayjs(selectedDate).year()
        );
      } else if (periodType === "monthly") {
        return date.isSame(selectedDate, "month");
      }
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

  return (
    <div
      style={{
        padding: "32px",
        fontFamily: "Prompt, sans-serif",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          fontSize: "26px",
          fontWeight: "700",
          marginBottom: "20px",
          textAlign: "center",
          color: "#2563eb",
        }}
      >
        📦 รายงานสถิติพัสดุ (Parcel Report)
      </h2>

      {/* 🔹 ตัวเลือกช่วงเวลา */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholderText="เลือกวัน / สัปดาห์ / เดือน"
          dateFormat={periodType === "monthly" ? "MM/yyyy" : "yyyy-MM-dd"}
          showMonthYearPicker={periodType === "monthly"}
          className="border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.borderColor = "#60a5fa")}
          onMouseLeave={(e) => (e.target.style.borderColor = "#d1d5db")}
        >
          <option value="daily">รายวัน</option>
          <option value="weekly">รายสัปดาห์</option>
          <option value="monthly">รายเดือน</option>
        </select>
      </div>

      {/* 🔹 ตารางข้อมูล */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          overflow: "hidden",
          marginBottom: "32px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "15px",
          }}
        >
          <thead
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              textAlign: "center",
            }}
          >
            <tr>
              <th style={{ padding: "10px" }}>ลำดับ</th>
              <th style={{ padding: "10px" }}>ผู้ส่ง</th>
              <th style={{ padding: "10px" }}>จำนวนพัสดุ</th>
              <th style={{ padding: "10px" }}>ค่าส่งรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {report.length > 0 ? (
              report.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#f9fafb" : "white",
                    textAlign: "center",
                    transition: "0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e0f2fe")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      i % 2 === 0 ? "#f9fafb" : "white")
                  }
                >
                  <td style={{ padding: "8px" }}>{i + 1}</td>
                  <td style={{ padding: "8px" }}>{r.sender}</td>
                  <td style={{ padding: "8px" }}>{r.totalParcels}</td>
                  <td style={{ padding: "8px" }}>{r.totalPrice.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  <span style={{ color: "#9ca3af" }}>ไม่มีข้อมูล</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 กราฟสรุป */}
      {report.length > 0 && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            padding: "20px",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              marginBottom: "16px",
              color: "#374151",
              fontWeight: "600",
            }}
          >
            📊 สรุปยอดพัสดุและค่าส่ง
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={report}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sender" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalParcels" fill="#3b82f6" name="จำนวนพัสดุ" />
              <Bar dataKey="totalPrice" fill="#10b981" name="ค่าส่งรวม" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ParcelReport;
