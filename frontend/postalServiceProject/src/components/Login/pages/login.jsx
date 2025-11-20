import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const navigate = useNavigate();

  const handleCustomer = () => {
    navigate("/user");
  };

  const handleAdmin = () => {
    navigate("/login-admin");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FEFBC7",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#E14434", marginBottom: "40px", fontSize: "3rem" }}>
        เลือกประเภทการเข้าสู่ระบบ
      </h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={handleCustomer}
          style={{
            backgroundColor: "#E14434",
            color: "#FEFBC7",
            padding: "15px 30px",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.2rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#c0352a";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#E14434";
          }}
        >
          User
        </button>

        <button
          onClick={handleAdmin}
          style={{
            backgroundColor: "#E14434",
            color: "#FEFBC7",
            padding: "15px 30px",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.2rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#c0352a";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#E14434";
          }}
        >
          Admin
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
