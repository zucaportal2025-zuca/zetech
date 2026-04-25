import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import bg from "../assets/background3.webp";
import logo from "../assets/zuca-logo.png";
import BASE_URL from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loginMode, setLoginMode] = useState("normal");
  const [detectedRole, setDetectedRole] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(true);
  const navigate = useNavigate();

  // Track mouse for subtle parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // CRITICAL: Check for saved session and AUTO-LOGIN
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      const rememberMeFlag = localStorage.getItem('rememberMe') === 'true';
      
      // If remember me was checked and we have token, auto-login
      if (rememberMeFlag && token && userJson) {
        try {
          console.log('Auto-login: Found saved session, logging in automatically...');
          
          const userData = JSON.parse(userJson);
          
          // Redirect based on role (don't even show login page)
          if (userData.role === "admin") {
            navigate("/admin");
          } else if (userData.role === "jumuia_leader") {
            navigate(`/jumuia/${userData.jumuiaCode}`);
          } else if (userData.role === "treasurer") {
            navigate("/treasurer");
          } else if (userData.role === "secretary") {
            navigate("/secretary");
          } else if (userData.role === "choir_moderator") {
            navigate("/choir");
          } else if (userData.role === "media_moderator") {
            navigate("/media-moderator");
          } else {
            navigate("/dashboard");
          }
          return; // Exit early - user is redirected
        } catch (error) {
          console.error('Auto-login failed:', error);
          // Clear corrupted data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
        }
      }
      
      // If no auto-login, just show the login form
      setIsCheckingAutoLogin(false);
      
      // Still pre-fill email if saved (for convenience)
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };

    autoLogin();
  }, [navigate]);

  // Auto-detect if this is a role login based on password format
  useEffect(() => {
    if (password) {
      if (password.startsWith("stmichael") || password.startsWith("stbenedict") || 
          password.startsWith("stperegrine") || password.startsWith("christtheking") ||
          password.startsWith("stgregory") || password.startsWith("stpacificus")) {
        setLoginMode("role");
        setDetectedRole("jumuia_leader");
      } else if (password.startsWith("treasurer")) {
        setLoginMode("role");
        setDetectedRole("treasurer");
      } else if (password.startsWith("secretary")) {
        setLoginMode("role");
        setDetectedRole("secretary");
      } else if (password.startsWith("choir")) {
        setLoginMode("role");
        setDetectedRole("choir_moderator");
      } else if (password.startsWith("media")) {
        setLoginMode("role");
        setDetectedRole("media_moderator");
      } else {
        setLoginMode("normal");
        setDetectedRole(null);
      }
    } else {
      setLoginMode("normal");
      setDetectedRole(null);
    }
  }, [password]);

  // Email validation (only for normal login)
  useEffect(() => {
    if (loginMode === "normal" && email && !email.includes("@")) {
      setEmailError("Hmm, that doesn't look like an email");
    } else {
      setEmailError("");
    }
  }, [email, loginMode]);

  // Get welcome message based on detected role
  const getWelcomeMessage = () => {
    if (loginMode === "normal") {
      return {
        greeting: "We've missed you ✨",
        title: "Welcome back to",
        subtitle: "ZUCA Portal",
        color: "#1ce43a" // Blue for normal
      };
    }

    switch(detectedRole) {
      case "jumuia_leader":
        return {
          greeting: "👑 Jumuia Leader",
          title: "Welcome, Shepard!",
          subtitle: "Lead your community with wisdom",
          color: "#8b5cf6" // Purple
        };
      case "treasurer":
        return {
          greeting: "💰 Treasurer",
          title: "Welcome, Steward!",
          subtitle: "Manage the contributions",
          color: "#f59e0b" // Orange
        };
      case "secretary":
        return {
          greeting: "📝 Secretary",
          title: "Welcome, Scribe!",
          subtitle: "Share the good news",
          color: "#10b981" // Green
        };
      case "choir_moderator":
        return {
          greeting: "🎵 Choir Moderator",
          title: "Welcome, Maestro!",
          subtitle: "Lead the songs of praise",
          color: "#ec4899" // Pink
        };
      case "media_moderator":
        return {
          greeting: "📸 Media Moderator",
          title: "Welcome, Photographer!",
          subtitle: "Capture and share memories",
          color: "#3b82f6" // Blue
        };
      default:
        return {
          greeting: "Special access",
          title: "Welcome,",
          subtitle: "continue your service",
          color: "#8b5cf6"
        };
    }
  };

  const welcome = getWelcomeMessage();

  // Get role icon
  const getRoleIcon = () => {
    if (!detectedRole) return null;
    
    switch(detectedRole) {
      case "jumuia_leader": return "👑";
      case "treasurer": return "💰";
      case "secretary": return "📝";
      case "choir_moderator": return "🎵";
      case "media_moderator": return "📸";
      default: return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    // Simulate a moment of anticipation
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Choose endpoint based on detected mode
      const endpoint = loginMode === "normal" ? "/api/login" : "/api/role-login";
      
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // For jumuia leaders, add jumuiaCode if it's missing
        if (data.user.role === 'jumuia_leader' && !data.user.jumuiaCode) {
          // Get the password from the input field
          const passwordInput = document.querySelector('input[type="password"]');
          const password = passwordInput ? passwordInput.value : '';
          
          // Extract jumuiaCode from password (e.g., "stgregory" from "stgregoryZ#002")
          let jumuiaCode = null;
          
          if (password.startsWith('stmichael')) jumuiaCode = 'stmichael';
          else if (password.startsWith('stbenedict')) jumuiaCode = 'stbenedict';
          else if (password.startsWith('stperegrine')) jumuiaCode = 'stperegrine';
          else if (password.startsWith('christtheking')) jumuiaCode = 'christtheking';
          else if (password.startsWith('stgregory')) jumuiaCode = 'stgregory';
          else if (password.startsWith('stpacificus')) jumuiaCode = 'stpacificus';
          
          // If still not found, try from jumuia name
          if (!jumuiaCode && data.user.jumuia) {
            jumuiaCode = data.user.jumuia.toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
          }
          
          // Add the missing fields
          data.user.jumuiaCode = jumuiaCode;
          data.user.specialRole = 'jumuia_leader';
          
          console.log('Added jumuiaCode:', jumuiaCode);
        }
        
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', email);
          
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          localStorage.setItem('rememberExpiry', expiryDate.toISOString());
          
          console.log('✅ Remember me ENABLED - will auto-login for 30 days');
        } else {
          localStorage.setItem('rememberMe', 'false');
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberExpiry');
          
          console.log('❌ Remember me DISABLED - session only');
        }

        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else if (data.user.role === "jumuia_leader") {
            navigate(`/jumuia/${data.user.jumuiaCode}`);
          } else if (data.user.role === "treasurer") {
            navigate("/treasurer");
          } else if (data.user.role === "secretary") {
            navigate("/secretary");
          } else if (data.user.role === "choir_moderator") {
            navigate("/choir");
          } else if (data.user.role === "media_moderator") {
            navigate("/media-moderator");
          } else {
            navigate("/dashboard");
          }
        }, 500);
      } else {
        setLoginError(data.error || "Those credentials don't match our records");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError("Connection issue. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // If checking auto-login, show loading spinner
  if (isCheckingAutoLogin) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1e 0%, #1a0033 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#00c6ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <p>Checking for saved session...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  const glowVariants = {
    initial: { opacity: 0.3, scale: 1 },
    hover: { 
      opacity: 0.6, 
      scale: 1.02,
      transition: { duration: 0.3 }
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={containerStyle(bg)}
    >
      {/* Animated gradient overlay */}
      <motion.div 
        style={{
          ...overlayStyle,
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Atmospheric particles */}
      <div style={particleFieldStyle}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              x: [null, Math.random() * 100 - 50],
              y: [null, Math.random() * 100 - 50],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              ...particleStyle,
              left: `${i * 8}%`,
              top: `${i * 7}%`,
              width: `${4 + i % 5}px`,
              height: `${4 + i % 5}px`,
              background: i % 3 === 0 ? "rgba(0,198,255,0.3)" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <motion.div
        variants={childVariants}
        style={{
          ...cardStyle,
          transform: `perspective(1000px) rotateX(${mousePosition.y * 0.02}deg) rotateY(${mousePosition.x * 0.02}deg)`,
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {/* Inner glow effect */}
        <div style={cardInnerGlowStyle} />

        {/* Logo */}
        <motion.div 
          style={logoContainerStyle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img src={logo} alt="ZUCA Logo" style={logoStyle} />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "60px" }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={logoUnderlineStyle}
          />
        </motion.div>

        {/* Welcome message - changes based on detected role */}
        <motion.div variants={childVariants}>
          <h2 style={welcomeStyle}>
            <span style={welcomeTextStyle}>{welcome.title}</span>
            <br />
            <motion.span 
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: welcome.color,
                letterSpacing: "0.5px",
              }}
              animate={{
                scale: detectedRole ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {detectedRole ? (
                <span>
                  {getRoleIcon()} {welcome.subtitle}
                </span>
              ) : (
                welcome.subtitle
              )}
            </motion.span>
          </h2>
          <motion.p 
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: welcome.color,
              marginTop: "-15px",
              marginBottom: "25px",
              fontStyle: "italic",
              opacity: 0.9,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {welcome.greeting}
          </motion.p>
        </motion.div>

        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <motion.div variants={childVariants}>
            <label style={labelStyle}>
              <motion.span
                animate={{ 
                  x: focusedField === "email" ? 5 : 0,
                  color: focusedField === "email" ? welcome.color : "rgba(255,255,255,0.8)"
                }}
              >
                Email address
              </motion.span>
            </label>
            <div style={inputWrapperStyle}>
              <motion.input
                type="email"
                placeholder="your.name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle}
                whileFocus={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderColor: welcome.color,
                }}
                animate={{
                  borderColor: emailError ? "#ef4444" : focusedField === "email" ? welcome.color : "transparent",
                }}
              />
              <AnimatePresence>
                {focusedField === "email" && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{
                      ...fieldGlowStyle,
                      background: `linear-gradient(135deg, ${welcome.color}, transparent)`,
                    }}
                  >
                    <span style={fieldGlowInnerStyle} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={errorStyle}
                >
                  {emailError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password Field */}
          <motion.div variants={childVariants}>
            <label style={labelStyle}>
              <motion.span
                animate={{ 
                  x: focusedField === "password" ? 5 : 0,
                  color: focusedField === "password" ? welcome.color : "rgba(255,255,255,0.8)"
                }}
              >
                Password
              </motion.span>
            </label>
            <div style={inputWrapperStyle}>
              <motion.input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                style={{
                  ...inputStyle,
                  paddingRight: "45px",
                }}
                whileFocus={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderColor: welcome.color,
                }}
              />
              <motion.span
                onClick={() => setShowPassword(!showPassword)}
                style={eyeStyle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </motion.span>
              <AnimatePresence>
                {focusedField === "password" && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{
                      ...fieldGlowStyle,
                      background: `linear-gradient(135deg, ${welcome.color}, transparent)`,
                    }}
                  >
                    <span style={fieldGlowInnerStyle} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Remember Me Checkbox */}
          <motion.div variants={childVariants} style={rememberMeContainerStyle}>
            <label style={rememberMeLabelStyle}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={checkboxStyle}
              />
              <motion.span
                animate={{ color: rememberMe ? welcome.color : "rgba(255,255,255,0.7)" }}
                style={rememberMeTextStyle}
              >
                Keep me signed in for 30 days
              </motion.span>
            </label>
          </motion.div>

          {/* Forgot Password Link */}
          <motion.div variants={childVariants} style={forgotContainerStyle}>
            <Link to="/forgot-password" style={forgotLinkStyle}>
              <motion.span whileHover={{ x: 3 }}>
                Forgot your password? 
              </motion.span>
              <motion.span whileHover={{ opacity: 1, x: 3 }} initial={{ opacity: 0, x: -5 }}>
                →
              </motion.span>
            </Link>
          </motion.div>

          {/* Login Error Message */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={loginErrorStyle}
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Button */}
          <motion.div variants={childVariants}>
            <motion.button
              type="submit"
              style={{
                ...buttonStyle,
                background: `linear-gradient(135deg, ${welcome.color}, ${adjustColor(welcome.color, -20)})`,
                boxShadow: `0 10px 25px -5px ${welcome.color}80`,
              }}
              disabled={loading}
              variants={glowVariants}
              initial="initial"
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <motion.div style={loadingContainerStyle}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={loadingSpinnerStyle}
                  >
                    ⟳
                  </motion.span>
                  <span style={loadingTextStyle}>
                    {detectedRole ? `Welcoming ${detectedRole.replace('_', ' ')}...` : "Signing in..."}
                  </span>
                </motion.div>
              ) : (
                <motion.span
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {detectedRole ? `Continue as ${detectedRole.replace('_', ' ')} →` : "Sign in →"}
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Register Link */}
        <motion.div variants={childVariants} style={registerContainerStyle}>
          <span style={registerTextStyle}>New to our community?</span>
          <Link to="/register">
            <motion.button
              style={secondaryButton}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(49, 53, 235, 0.9)",
                boxShadow: "0 10px 25px -5px rgba(49, 53, 235, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Create your account
            </motion.button>
          </Link>
        </motion.div>

        {/* Faith-inspired text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={faithTextStyle}
        >
          "Where two or three gather in my name..." ✝
        </motion.div>
      </motion.div>

      <style>
        {`
          @keyframes gradientFlow {
            0% {background-position: 0% 50%;}
            50% {background-position: 100% 50%;}
            100% {background-position: 0% 50%;}
          }
          
          input::placeholder {
            color: rgba(255,255,255,0.3);
            font-size: 13px;
            font-style: italic;
          }
        `}
      </style>
    </motion.div>
  );
}

// Helper function to darken colors for button gradient
const adjustColor = (color, percent) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.max(0, Math.min(255, r + percent));
  const newG = Math.max(0, Math.min(255, g + percent));
  const newB = Math.max(0, Math.min(255, b + percent));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// ==================== Styles ====================

const containerStyle = (bg) => ({
  minHeight: "100vh",
  backgroundImage: `url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  overflow: "hidden",
});

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(-45deg, rgba(49,15,221,0.7), rgba(0,0,0,0.8), rgba(49,15,221,0.7))",
  backgroundSize: "400% 400%",
  animation: "gradientFlow 15s ease infinite",
};

const particleFieldStyle = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 1,
};

const particleStyle = {
  position: "absolute",
  borderRadius: "50%",
  filter: "blur(2px)",
  pointerEvents: "none",
};

const cardStyle = {
  position: "relative",
  zIndex: 10,
  background: "rgba(20, 10, 20, 0.3)",
  backdropFilter: "blur(16px)",
  padding: "50px",
  borderRadius: "32px",
  width: "90%",
  maxWidth: "420px",
  color: "white",
  boxShadow: "0 30px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.05)",
  transition: "all 0.3s ease",
  overflow: "hidden",
};

const cardInnerGlowStyle = {
  position: "absolute",
  top: "-50%",
  left: "-50%",
  width: "200%",
  height: "200%",
  background: "radial-gradient(circle at 50% 50%, rgba(0,198,255,0.1), transparent 70%)",
  zIndex: -1,
};

const logoContainerStyle = {
  textAlign: "center",
  marginBottom: "25px",
  position: "relative",
};

const logoStyle = {
  width: "85px",
  height: "auto",
  filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))",
};

const logoUnderlineStyle = {
  height: "2px",
  background: "linear-gradient(90deg, transparent, #00c6ff, transparent)",
  margin: "10px auto 0",
  borderRadius: "2px",
};

const welcomeStyle = {
  textAlign: "center",
  marginBottom: "30px",
};

const welcomeTextStyle = {
  fontSize: "14px",
  fontWeight: "400",
  color: "rgba(255,255,255,0.6)",
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  fontWeight: "500",
  transition: "all 0.3s",
};

const inputWrapperStyle = {
  position: "relative",
  marginBottom: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "15px 14px",
  borderRadius: "16px",
  border: "1px solid transparent",
  outline: "none",
  background: "rgba(225, 26, 26, 0.12)",
  color: "white",
  fontSize: "15px",
  boxSizing: "border-box",
  backdropFilter: "blur(5px)",
  transition: "all 0.3s ease",
  
};

const fieldGlowStyle = {
  position: "absolute",
  inset: "-2px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #00c6ff, transparent)",
  opacity: 0.3,
  zIndex: -1,
};

const fieldGlowInnerStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.1)",
};

const eyeStyle = {
  position: "absolute",
  right: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "22px",
  opacity: 0.7,
  transition: "all 0.3s",
  zIndex: 2,
};

// Remember Me Styles
const rememberMeContainerStyle = {
  marginBottom: "15px",
  display: "flex",
  alignItems: "center",
};

const rememberMeLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
};

const checkboxStyle = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: "#00c6ff",
};

const rememberMeTextStyle = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.7)",
  transition: "color 0.3s",
};

const forgotContainerStyle = {
  textAlign: "right",
  marginBottom: "20px",
};

const forgotLinkStyle = {
  color: "rgba(255,255,255,0.7)",
  textDecoration: "none",
  fontSize: "13px",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  transition: "color 0.3s",
  borderBottom: "1px solid transparent",
};

const errorStyle = {
  color: "#ef4444",
  fontSize: "12px",
  marginTop: "-8px",
  marginBottom: "15px",
  paddingLeft: "5px",
};

const loginErrorStyle = {
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.3)",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "20px",
  color: "#ef4444",
  fontSize: "13px",
  textAlign: "center",
  backdropFilter: "blur(5px)",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "none",
  color: "white",
  fontWeight: "600",
  fontSize: "16px",
  cursor: "pointer",
  transition: "all 0.3s",
  position: "relative",
  overflow: "hidden",
};

const loadingContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const loadingSpinnerStyle = {
  display: "inline-block",
  fontSize: "20px",
};

const loadingTextStyle = {
  fontSize: "15px",
};

const registerContainerStyle = {
  textAlign: "center",
  marginTop: "25px",
};

const registerTextStyle = {
  display: "block",
  fontSize: "14px",
  color: "rgba(255,255,255,0.6)",
  marginBottom: "10px",
};

const secondaryButton = {
  padding: "12px 30px",
  borderRadius: "40px",
  border: "none",
  background: "rgba(49, 53, 235, 0.6)",
  color: "white",
  fontSize: "15px",
  fontWeight: "500",
  cursor: "pointer",
  backdropFilter: "blur(5px)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.3s",
};

const faithTextStyle = {
  position: "absolute",
  bottom: "15px",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: "10px",
  color: "rgba(255,255,255,0.2)",
  whiteSpace: "nowrap",
  letterSpacing: "0.5px",
};

export default Login;