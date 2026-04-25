// C:\Users\HP\zuca-portal\frontend\src\pages\ResetPassword.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bg from "../assets/background4.webp";
import logo from "../assets/zuca-logo.png";
import BASE_URL from "../api";

function ResetPassword() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCodeNotification, setShowCodeNotification] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCode = sessionStorage.getItem('resetCode');
    const storedExpiry = sessionStorage.getItem('resetCodeExpiry');
    const storedPhone = sessionStorage.getItem('resetPhone');
    const storedMembership = sessionStorage.getItem('resetMembership');
    
    if (!storedPhone || !storedMembership) {
      navigate("/forgot-password");
      return;
    }

    setPhone(storedPhone);
    setMembershipNumber(storedMembership);
    
    if (storedCode && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      const now = Date.now();
      
      if (now < expiryTime) {
        setGeneratedCode(storedCode);
        setShowCodeNotification(true);
        const remainingSeconds = Math.floor((expiryTime - now) / 1000);
        setTimer(remainingSeconds);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showCodeNotification) {
      const timer = setTimeout(() => {
        setShowCodeNotification(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showCodeNotification]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCodeChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);
    if (element.value !== "" && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        document.getElementById(`code-${index - 1}`)?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setCode(pastedData.split(''));
      document.getElementById('code-5')?.focus();
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, membershipNumber }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem('resetCode', data.code);
        sessionStorage.setItem('resetCodeExpiry', Date.now() + 15 * 60 * 1000);
        setGeneratedCode(data.code);
        setShowCodeNotification(true);
        setTimer(300);
        setCode(["", "", "", "", "", ""]);
        document.getElementById('code-0')?.focus();
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone, 
          membershipNumber,
          code: fullCode,
          newPassword: newPassword.trim()
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.clear();
        setSuccess("Password reset successful! Redirecting...");
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Password reset successful! Please login." } 
          });
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopySuccess(true);
  };

  // Responsive Styles - Optimized for both mobile and desktop
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
      padding: "10px", // Added padding for mobile
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
      padding: "25px 20px", // Responsive padding
      borderRadius: "24px",
      width: "100%",
      maxWidth: "450px",
      color: "white",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.1)",
      margin: "10px",
      maxHeight: "auto", // Changed from 70% to auto
      overflowY: "visible", // Changed from auto to visible
      "@media (min-width: 768px)": {
        padding: "30px 35px",
        margin: "20px",
      },
    },
    logoContainer: {
      textAlign: "center",
      marginBottom: "15px", // Reduced for mobile
      "@media (min-width: 768px)": {
        marginBottom: "20px",
      },
    },
    logo: {
      width: "60px", // Smaller on mobile
      marginBottom: "5px",
      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      "@media (min-width: 768px)": {
        width: "80px",
      },
    },
    title: {
      fontSize: "18px", // Smaller on mobile
      margin: 0,
      color: "white",
      fontWeight: "600",
      "@media (min-width: 768px)": {
        fontSize: "20px",
      },
    },
    heading: {
      textAlign: "center",
      marginBottom: "10px", // Reduced for mobile
      color: "white",
      fontSize: "22px", // Smaller on mobile
      fontWeight: "700",
      "@media (min-width: 768px)": {
        fontSize: "26px",
        marginBottom: "15px",
      },
    },
    subheading: {
      textAlign: "center",
      fontSize: "13px", // Smaller on mobile
      marginBottom: "15px", // Reduced for mobile
      color: "rgba(255,255,255,0.8)",
      "@media (min-width: 768px)": {
        fontSize: "14px",
        marginBottom: "25px",
      },
    },
    codeNotification: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      borderRadius: "16px",
      padding: "15px", // Reduced for mobile
      marginBottom: "15px", // Reduced for mobile
      boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
      border: "1px solid rgba(255,255,255,0.2)",
      "@media (min-width: 768px)": {
        padding: "20px",
        marginBottom: "25px",
      },
    },
    codeHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "10px", // Reduced for mobile
      "@media (min-width: 768px)": {
        marginBottom: "15px",
      },
    },
    codeTitle: {
      display: "flex",
      alignItems: "center",
      gap: "5px", // Reduced for mobile
      fontSize: "14px", // Smaller on mobile
      fontWeight: "600",
      color: "white",
      "@media (min-width: 768px)": {
        gap: "8px",
        fontSize: "16px",
      },
    },
    closeButton: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      fontSize: "14px", // Smaller on mobile
      cursor: "pointer",
      padding: "4px 8px", // Smaller on mobile
      borderRadius: "20px",
      "@media (min-width: 768px)": {
        fontSize: "16px",
        padding: "5px 10px",
      },
    },
    codeDisplay: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px", // Reduced for mobile
      marginBottom: "10px", // Reduced for mobile
      background: "rgba(255,255,255,0.15)",
      padding: "10px", // Reduced for mobile
      borderRadius: "12px",
      border: "1px dashed rgba(255,255,255,0.3)",
      "@media (min-width: 768px)": {
        gap: "15px",
        marginBottom: "15px",
        padding: "15px",
      },
    },
    codeText: {
      fontSize: "28px", // Smaller on mobile
      fontWeight: "bold",
      letterSpacing: "5px", // Reduced for mobile
      color: "white",
      textShadow: "0 2px 10px rgba(0,0,0,0.3)",
      fontFamily: "monospace",
      "@media (min-width: 768px)": {
        fontSize: "36px",
        letterSpacing: "8px",
      },
    },
    copyButton: {
      background: "rgba(255,255,255,0.25)",
      border: "none",
      borderRadius: "8px",
      padding: "6px 10px", // Smaller on mobile
      cursor: "pointer",
      fontSize: "16px", // Smaller on mobile
      color: "white",
      "@media (min-width: 768px)": {
        fontSize: "20px",
        padding: "8px 12px",
      },
    },
    codeExpiry: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      fontSize: "12px", // Smaller on mobile
      color: "rgba(255,255,255,0.9)",
      marginBottom: "5px", // Reduced for mobile
      "@media (min-width: 768px)": {
        fontSize: "14px",
        marginBottom: "10px",
      },
    },
    codeInstruction: {
      textAlign: "center",
      fontSize: "12px", // Smaller on mobile
      color: "rgba(255,255,255,0.8)",
      margin: 0,
      "@media (min-width: 768px)": {
        fontSize: "13px",
      },
    },
    inputGroup: {
      marginBottom: "15px", // Reduced for mobile
      "@media (min-width: 768px)": {
        marginBottom: "20px",
      },
    },
    label: {
      display: "block",
      marginBottom: "5px", // Reduced for mobile
      fontSize: "13px", // Smaller on mobile
      fontWeight: "500",
      color: "rgba(255,255,255,0.9)",
      "@media (min-width: 768px)": {
        fontSize: "14px",
        marginBottom: "8px",
      },
    },
    input: {
      width: "100%",
      padding: "12px 14px", // Smaller on mobile
      borderRadius: "12px",
      border: "2px solid rgba(255,255,255,0.1)",
      outline: "none",
      background: "rgba(255,255,255,0.08)",
      color: "white",
      fontSize: "14px", // Smaller on mobile
      boxSizing: "border-box",
      "@media (min-width: 768px)": {
        padding: "14px 16px",
        fontSize: "15px",
      },
    },
    codeContainer: {
      display: "flex",
      gap: "5px", // Smaller gap on mobile
      justifyContent: "center",
      marginBottom: "10px", // Reduced for mobile
      flexWrap: "wrap", // Allow wrapping on very small screens
      "@media (min-width: 768px)": {
        gap: "10px",
        marginBottom: "15px",
      },
    },
    codeInput: {
      width: "40px", // Smaller on mobile
      height: "50px", // Smaller on mobile
      textAlign: "center",
      fontSize: "20px", // Smaller on mobile
      fontWeight: "bold",
      borderRadius: "12px",
      border: "2px solid rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.15)",
      color: "white",
      outline: "none",
      "@media (min-width: 768px)": {
        width: "50px",
        height: "60px",
        fontSize: "24px",
      },
    },
    timerDisplay: {
      textAlign: "center",
      fontSize: "12px", // Smaller on mobile
      marginBottom: "15px", // Reduced for mobile
      color: "rgba(255,255,255,0.7)",
      "@media (min-width: 768px)": {
        fontSize: "13px",
        marginBottom: "20px",
      },
    },
    timerHighlight: {
      color: "#ffd700",
      fontWeight: "600",
    },
    button: {
      width: "100%",
      padding: "12px", // Smaller on mobile
      borderRadius: "12px",
      border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      fontWeight: "bold",
      fontSize: "15px", // Smaller on mobile
      background: loading 
        ? "linear-gradient(135deg, #888 0%, #666 100%)" 
        : "linear-gradient(135deg, #54dd0f 0%, #3fa30c 100%)",
      color: "white",
      marginTop: "5px", // Reduced for mobile
      opacity: loading ? 0.7 : 1,
      "@media (min-width: 768px)": {
        padding: "15px",
        fontSize: "16px",
        marginTop: "10px",
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
    resendSection: {
      textAlign: "center",
      marginTop: "15px", // Reduced for mobile
      "@media (min-width: 768px)": {
        marginTop: "20px",
      },
    },
    resendButton: {
      background: "none",
      border: "none",
      color: "#4da6ff",
      cursor: "pointer",
      fontSize: "13px", // Smaller on mobile
      textDecoration: "underline",
      padding: "5px",
      "@media (min-width: 768px)": {
        fontSize: "14px",
      },
    },
    resendText: {
      fontSize: "12px", // Smaller on mobile
      color: "rgba(255,255,255,0.6)",
      margin: 0,
      "@media (min-width: 768px)": {
        fontSize: "13px",
      },
    },
    info: {
      marginTop: "15px", // Reduced for mobile
      padding: "10px", // Reduced for mobile
      background: "rgba(0,0,0,0.3)",
      borderRadius: "10px",
      textAlign: "center",
      "@media (min-width: 768px)": {
        marginTop: "25px",
        padding: "12px",
      },
    },
    infoText: {
      margin: 0,
      fontSize: "12px", // Smaller on mobile
      color: "rgba(255,255,255,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px", // Reduced for mobile
      flexWrap: "wrap",
      "@media (min-width: 768px)": {
        fontSize: "13px",
        gap: "8px",
      },
    },
    linksContainer: {
      marginTop: "15px", // Reduced for mobile
      textAlign: "center",
      "@media (min-width: 768px)": {
        marginTop: "20px",
      },
    },
    link: {
      color: "#4da6ff",
      textDecoration: "none",
      fontSize: "13px", // Smaller on mobile
      padding: "5px",
      "@media (min-width: 768px)": {
        fontSize: "14px",
      },
    },
    divider: {
      color: "rgba(255,255,255,0.3)",
      margin: "0 5px", // Reduced for mobile
      "@media (min-width: 768px)": {
        margin: "0 10px",
      },
    },
    error: {
      background: "rgba(255, 68, 68, 0.15)",
      color: "#ff8a8a",
      padding: "10px 12px", // Smaller on mobile
      borderRadius: "12px",
      marginBottom: "15px", // Reduced for mobile
      textAlign: "center",
      fontSize: "13px", // Smaller on mobile
      border: "1px solid rgba(255, 68, 68, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "5px", // Reduced for mobile
      "@media (min-width: 768px)": {
        padding: "12px 16px",
        marginBottom: "20px",
        fontSize: "14px",
        gap: "8px",
      },
    },
    success: {
      background: "rgba(84, 221, 15, 0.15)",
      color: "#a5d6a5",
      padding: "10px 12px", // Smaller on mobile
      borderRadius: "12px",
      marginBottom: "15px", // Reduced for mobile
      textAlign: "center",
      fontSize: "13px", // Smaller on mobile
      border: "1px solid rgba(84, 221, 15, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "5px", // Reduced for mobile
      "@media (min-width: 768px)": {
        padding: "12px 16px",
        marginBottom: "20px",
        fontSize: "14px",
        gap: "8px",
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
      box-shadow: 0 8px 20px rgba(84, 221, 15, 0.4) !important;
    }
    .copy-btn:hover {
      background: rgba(255,255,255,0.35) !important;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.3) !important;
    }
    @media (max-width: 380px) {
      .code-input {
        width: 35px !important;
        height: 45px !important;
        font-size: 18px !important;
      }
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

        <h2 style={styles.heading}>Reset Password</h2>
        
        {showCodeNotification && (
          <div style={styles.codeNotification}>
            <div style={styles.codeHeader}>
              <div style={styles.codeTitle}>
                <span style={{ fontSize: "20px" }}>🔐</span>
                <span>Your Reset Code</span>
              </div>
              <button 
                onClick={() => setShowCodeNotification(false)}
                style={styles.closeButton}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div style={styles.codeDisplay}>
              <span style={styles.codeText}>{generatedCode}</span>
              <button 
                onClick={copyCodeToClipboard}
                style={styles.copyButton}
                className="copy-btn"
              >
                {copySuccess ? "✓" : "📋"}
              </button>
            </div>
            
            <div style={styles.codeExpiry}>
              <span>⏱️</span>
              Code expires in: <span style={{ color: "#ffd700", fontWeight: "600" }}>{formatTime(timer)}</span>
            </div>
            
            <p style={styles.codeInstruction}>
              Enter this 6-digit code below to reset your password
            </p>
          </div>
        )}

        <p style={styles.subheading}>
          Enter the 6-digit code below
        </p>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            <span>✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.codeContainer}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                style={styles.codeInput}
                className="code-input"
                autoFocus={index === 0}
                required
                disabled={loading}
              />
            ))}
          </div>

          {timer > 0 && (
            <p style={styles.timerDisplay}>
              ⏱️ Code expires in: <span style={styles.timerHighlight}>{formatTime(timer)}</span>
            </p>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <button 
            style={styles.button} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner}></span>
                Resetting...
              </span>
            ) : "Reset Password"}
          </button>

          <div style={styles.resendSection}>
            {timer === 0 ? (
              <button 
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                style={styles.resendButton}
              >
                Resend Code
              </button>
            ) : (
              <p style={styles.resendText}>
                Didn't receive code? Wait {formatTime(timer)} to resend
              </p>
            )}
          </div>

          <div style={styles.info}>
            <p style={styles.infoText}>
              <span>📱</span> {phone}
              <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
              <span>🆔</span> {membershipNumber}
            </p>
          </div>
        </form>

        <div style={styles.linksContainer}>
          <Link to="/forgot-password" style={styles.link}>
            ← Back
          </Link>
          <span style={styles.divider}>|</span>
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;