// C:\Users\HP\zuca-portal\frontend\src\pages\ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bg from "../assets/background4.webp";
import logo from "../assets/zuca-logo.png";
import BASE_URL from "../api";

function ForgotPassword() {
  const [phone, setPhone] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Format phone number helper (Kenyan format)
  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("07") && cleaned.length === 10) {
      return "+254" + cleaned.slice(1);
    } else if (cleaned.startsWith("7") && cleaned.length === 9) {
      return "+254" + cleaned;
    } else if (cleaned.startsWith("254") && cleaned.length === 12) {
      return "+" + cleaned;
    }
    return phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!phone.trim() || !membershipNumber.trim()) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 12) {
      setError("Please enter a valid phone number (e.g., 0712345678)");
      setLoading(false);
      return;
    }

    let formattedMembership = membershipNumber.trim().toUpperCase();
    if (!formattedMembership.startsWith("Z#") && !formattedMembership.startsWith("Z-")) {
      if (/^\d+$/.test(formattedMembership)) {
        formattedMembership = `Z#${formattedMembership.padStart(3, "0")}`;
      } else {
        formattedMembership = `Z#${formattedMembership.replace(/[^0-9]/g, "").padStart(3, "0")}`;
      }
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: formatPhoneNumber(phone.trim()), 
          membershipNumber: formattedMembership 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem('resetCode', data.code);
        sessionStorage.setItem('resetCodeExpiry', Date.now() + 15 * 60 * 1000);
        sessionStorage.setItem('resetPhone', formatPhoneNumber(phone.trim()));
        sessionStorage.setItem('resetMembership', formattedMembership);
        navigate("/reset-password");
      } else {
        if (res.status === 404) {
          setError("No account found with these credentials");
        } else {
          setError(data.error || "Something went wrong");
        }
      }
    } catch (err) {
      setError("Network error. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Responsive Styles - Matching ResetPassword page
  const styles = {
    page: {
      minHeight: "100vh",
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "10px",
    },
    overlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(135deg, rgba(49,15,221,0.85) 0%, rgba(0,0,0,0.9) 100%)",
      zIndex: 0,
    },
    card: {
      position: "relative",
      zIndex: 1,
      backdropFilter: "blur(10px)",
      background: "rgba(255, 255, 255, 0.1)",
      padding: "25px 20px",
      borderRadius: "24px",
      width: "100%",
      maxWidth: "420px",
      color: "white",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.1)",
      margin: "10px",
      "@media (min-width: 768px)": {
        padding: "30px 35px",
        margin: "20px",
      },
    },
    logoContainer: {
      textAlign: "center",
      marginBottom: "15px",
      "@media (min-width: 768px)": {
        marginBottom: "20px",
      },
    },
    logo: {
      width: "60px",
      marginBottom: "5px",
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      "@media (min-width: 768px)": {
        width: "80px",
        marginBottom: "10px",
      },
    },
    title: {
      fontSize: "18px",
      margin: 0,
      color: "white",
      fontWeight: "600",
      "@media (min-width: 768px)": {
        fontSize: "20px",
      },
    },
    heading: {
      textAlign: "center",
      marginBottom: "10px",
      color: "white",
      fontSize: "22px",
      fontWeight: "700",
      "@media (min-width: 768px)": {
        fontSize: "26px",
        marginBottom: "15px",
      },
    },
    subheading: {
      textAlign: "center",
      fontSize: "13px",
      marginBottom: "20px",
      color: "rgba(255,255,255,0.8)",
      "@media (min-width: 768px)": {
        fontSize: "14px",
        marginBottom: "30px",
      },
    },
    inputGroup: {
      marginBottom: "15px",
      "@media (min-width: 768px)": {
        marginBottom: "20px",
      },
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontSize: "13px",
      fontWeight: "500",
      color: "rgba(255,255,255,0.9)",
      "@media (min-width: 768px)": {
        fontSize: "14px",
        marginBottom: "8px",
      },
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "12px",
      border: "2px solid rgba(255,255,255,0.1)",
      outline: "none",
      background: "rgba(255,255,255,0.08)",
      color: "white",
      fontSize: "14px",
      boxSizing: "border-box",
      "@media (min-width: 768px)": {
        padding: "14px 16px",
        fontSize: "15px",
      },
    },
    helperText: {
      display: "block",
      fontSize: "10px",
      color: "rgba(255,255,255,0.5)",
      marginTop: "4px",
      "@media (min-width: 768px)": {
        fontSize: "11px",
      },
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "12px",
      border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      fontWeight: "bold",
      fontSize: "15px",
      background: loading 
        ? "linear-gradient(135deg, #888 0%, #666 100%)" 
        : "linear-gradient(135deg, #54dd0f 0%, #3fa30c 100%)",
      color: "white",
      marginTop: "10px",
      opacity: loading ? 0.7 : 1,
      "@media (min-width: 768px)": {
        padding: "15px",
        fontSize: "16px",
      },
    },
    buttonContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: {
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s linear infinite",
      marginRight: "8px",
    },
    linksContainer: {
      marginTop: "15px",
      textAlign: "center",
      "@media (min-width: 768px)": {
        marginTop: "20px",
      },
    },
    link: {
      color: "#4da6ff",
      textDecoration: "none",
      fontSize: "13px",
      padding: "5px",
      "@media (min-width: 768px)": {
        fontSize: "14px",
      },
    },
    divider: {
      color: "rgba(255,255,255,0.3)",
      margin: "0 5px",
      "@media (min-width: 768px)": {
        margin: "0 10px",
      },
    },
    error: {
      background: "rgba(255, 68, 68, 0.15)",
      color: "#ff8a8a",
      padding: "10px 12px",
      borderRadius: "12px",
      marginBottom: "15px",
      textAlign: "center",
      fontSize: "13px",
      border: "1px solid rgba(255, 68, 68, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      "@media (min-width: 768px)": {
        padding: "12px 16px",
        marginBottom: "20px",
        fontSize: "14px",
        gap: "8px",
      },
    },
    infoBox: {
      marginTop: "15px",
      padding: "10px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: "12px",
      textAlign: "center",
      border: "1px dashed rgba(255,255,255,0.2)",
      "@media (min-width: 768px)": {
        marginTop: "20px",
        padding: "12px",
      },
    },
    infoText: {
      margin: 0,
      fontSize: "11px",
      color: "rgba(255,255,255,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      "@media (min-width: 768px)": {
        fontSize: "12px",
      },
    },
  };

  // Add keyframes to document
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    input:focus {
      border-color: #54dd0f !important;
      box-shadow: 0 0 0 3px rgba(84, 221, 15, 0.25) !important;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(84, 221, 15, 0.4);
    }
  `;
  document.head.appendChild(styleTag);

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src={logo} alt="ZUCA Logo" style={styles.logo} />
          <h1 style={styles.title}>ZUCA Portal</h1>
        </div>

        <h2 style={styles.heading}>Forgot Password?</h2>
        <p style={styles.subheading}>
          Enter your phone number and membership number
        </p>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g., 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
            />
            <small style={styles.helperText}>
              Enter your registered phone number
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Membership Number</label>
            <input
              type="text"
              placeholder="e.g., Z#001"
              value={membershipNumber}
              onChange={(e) => setMembershipNumber(e.target.value.toUpperCase())}
              style={styles.input}
              required
              disabled={loading}
            />
            <small style={styles.helperText}>
              Enter your membership number (e.g., Z#001)
            </small>
          </div>

          <button 
            style={styles.button} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner}></span>
                Sending...
              </span>
            ) : "Continue"}
          </button>
        </form>

        <div style={styles.linksContainer}>
          <Link to="/login" style={styles.link}>
            ← Back to Login
          </Link>
          <span style={styles.divider}>|</span>
          <Link to="/register" style={styles.link}>
            Create Account
          </Link>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <span>ℹ️</span>
            You'll receive a 6-digit code on the next page
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;