import { useNavigate } from "react-router-dom";
import logo from "../assets/zuca-logo.png";
import bg from "../assets/background2.webp";

function Landing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Dark Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(10,10,30,0.8), rgba(30,0,80,0.7))",
        }}
      />

      {/* GLASS CARD */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "500px",
          padding: "40px 30px",
          borderRadius: "50px",
          background: "rgba(255, 255, 255, 0)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.13)",
          boxShadow: "0 25px 60px rgba(189, 178, 230, 0.58)",
          textAlign: "center",
          color: "white",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "25px" }}>
          <img
            src={logo}
            alt="ZUCA Logo"
            style={{
              width: "150px",
              marginBottom: "10px",
              filter: "drop-shadow(0 0 12px rgba(31, 202, 232, 0.82))",
            }}
          />
          
          <h4 style={{ letterSpacing: "3px", opacity: 0.9 }}>
            ZETECH UNIVERSITY
          </h4>
          <p style={{ marginTop: "9px", opacity: 0.9 }}>
            CATHOLIC ACTION
          </p>
        </div>

        {/* TITLE WITH UNDERLINE */}
        <h1
          style={{
            fontSize: "21px",
            marginBottom: "5px",
            fontWeight: "700",
            display: "inline-block",
            paddingBottom: "15px",
            paddingLeft: "10px",
            paddingRight: "10px",
            paddingTop: "10px",
            borderRadius: "30px",
            borderBottom: "1px solid #00c6ff",
            boxShadow: "0 4px 15px rgba(0, 198, 255, 0.7)",
          }}
        >
          Welcome to (ZUCA) Portal🤗
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.6",
            opacity: 0.9,
            marginBottom: "35px",
          }}
        >
          Hello 👋 and welcome to the Zetech University Catholic Action Portal.
          Here you can view announcements, explore mass schedules and other
          relevant programs, and connect with members — all in one powerful
          platform.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "14px 40px",
            borderRadius: "30px",
            border: "none",
            background: "linear-gradient(90deg,#007bff,#00c6ff)",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 8px 25px rgba(108, 86, 249, 0.6)",
            transition: "0.3s",
          }}
          onMouseOver={(e) =>
            (e.target.style.transform = "scale(1.05)")
          }
          onMouseOut={(e) =>
            (e.target.style.transform = "scale(1)")
          }
        >
          Enter Portal →
        </button>

        {/* Footer */}
        <div style={{ marginTop: "40px", fontSize: "12px", opacity: 0.6 }}>
          © {new Date().getFullYear()} ZUCA Portal | Built for Unity & Faith
          <p>Portal Built By | CHRISTECH WEBSYS</p>
        </div>
      </div>
    </div>
  );
}

export default Landing;