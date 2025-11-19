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
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>Login</h2>
      <button
        onClick={handleCustomer}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        User
      </button>
      <button
        onClick={handleAdmin}
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        Admin
      </button>
    </div>
  );
};

export default SelectRole;
