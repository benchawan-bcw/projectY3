import { Link } from "react-router-dom";

const AdminNavbar = () => {
  const navItems = [
    { to: "/admin", label: "หน้าหลัก" },
    { to: "/admin/RegisterParcel", label: "ลงทะเบียนพัสดุใหม่" },
    { to: "/admin/Payment", label: "คำนวณค่าจัดส่งพัสดุ" },
    { to: "/admin/Receipt", label: "พิมพ์ใบเสร็จ" },
    { to: "/admin/ParcelReport", label: "รายงานสถิติพัสดุ" },
  ];

  return (
    <div>
      <h1>navbar</h1>

      <div className="flex justify-center items-center absolute bottom-5 left-1/2 transform -translate-x-1/2 gap-8 p-0 rounded-4xl bg-[#0dc964] w-[300px] h-[60px]">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center text-blue no-underline"
          >
            <i className={`bi ${item.icon} mt-3 text-2xl`}></i>
            <p className="text-xs">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminNavbar;
