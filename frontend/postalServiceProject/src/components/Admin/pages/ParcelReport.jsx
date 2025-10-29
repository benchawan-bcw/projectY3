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
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>📦 ParcelReport รายงานสถิติพัสดุ</h2>

      {/* เลือกช่วงเวลา */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholderText="เลือกวัน/สัปดาห์/เดือน"
          dateFormat={periodType === "monthly" ? "MM/yyyy" : "yyyy-MM-dd"}
          showMonthYearPicker={periodType === "monthly"}
        />

        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
        >
          <option value="daily">รายวัน</option>
          <option value="weekly">รายสัปดาห์</option>
          <option value="monthly">รายเดือน</option>
        </select>
      </div>

      <table
        border="1"
        cellPadding="5"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ผู้ส่ง</th>
            <th>จำนวนพัสดุ</th>
            <th>ค่าส่งรวม</th>
          </tr>
        </thead>
        <tbody>
          {report.length > 0 ? (
            report.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td> {/* แสดงลำดับ */}
                <td>{r.sender}</td>
                <td>{r.totalParcels}</td>
                <td>{r.totalPrice.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} align="center">
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* กราฟสรุป */}
      {report.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={report}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sender" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalParcels" fill="#8884d8" name="จำนวนพัสดุ" />
            <Bar dataKey="totalPrice" fill="#82ca9d" name="ค่าส่งรวม" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ParcelReport;
