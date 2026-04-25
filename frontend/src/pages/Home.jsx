import logo from "../assets/zuca-logo.png";
import bg from "../assets/background.webp";

function Dashboard() {
  return (
    <div
      style={{
        height: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "50px",
          borderRadius: "15px",
          textAlign: "center",
          color: "white",
          width: "420px",
          boxShadow: "0 0 25px rgba(0,0,0,0.5)",
        }}
      >
        <img src={logo} alt="ZUCA Logo" width="130" />

        <h1 style={{ marginTop: "20px", fontSize: "28px" }}>
          ZUCA Portal Dashboard
        </h1>

        <p style={{ marginTop: "10px", opacity: 0.9 }}>
          Welcome to the official ZUCA web platform
        </p>

        <button
          onClick={() => window.location.href = "/dashboard"}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#FFD700",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Enter Portal
        </button>

      </div>
    </div>
  );
}

export default Dashboard;
