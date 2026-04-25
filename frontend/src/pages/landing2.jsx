// frontend/src/pages/Landing2.jsx
import { useNavigate } from "react-router-dom";
import { 
  FaInstagram, 
  FaFacebookF, 
  FaYoutube, 
  FaTiktok, 
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaChurch,
  FaMusic,
  FaUsers,
  FaHandsHelping,
  FaHeart,
  FaPray,
  FaClock,
  FaLocationArrow,
  FaDownload,
  FaUserPlus,
  FaSignInAlt,
  FaCalendarAlt,
  FaMobileAlt,
  FaBars,
  FaTimes,
  FaChevronDown
} from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import logo from "../assets/zuca-logo.png";
import bg from "../assets/background2.webp";
import NotificationPrompt from '../components/NotificationPrompt';

function Landing2() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const massRef = useRef(null);
  const connectRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      updateActiveSection();
    };
    
    window.addEventListener("scroll", handleScroll);
    
    // Fade-in on scroll observer
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
          }
        });
      },
      { threshold: 0.2 }
    );
    
    document.querySelectorAll(".fade-section").forEach(section => observer.observe(section));
    
    // Check if already installed
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isPWA) {
      setShowInstallButton(false);
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const updateActiveSection = () => {
    const sections = [
      { id: 'home', ref: heroRef },
      { id: 'about', ref: aboutRef },
      { id: 'mass', ref: massRef },
      { id: 'connect', ref: connectRef },
      { id: 'contact', ref: contactRef }
    ];

    const scrollPosition = window.scrollY + 100;

    for (const section of sections) {
      if (section.ref.current) {
        const { offsetTop, offsetHeight } = section.ref.current;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(section.id);
          break;
        }
      }
    }
  };

  const scrollToSection = (sectionId) => {
    const sectionRef = {
      home: heroRef,
      about: aboutRef,
      mass: massRef,
      connect: connectRef,
      contact: contactRef
    }[sectionId];

    if (sectionRef?.current) {
      const offset = 80;
      const elementPosition = sectionRef.current.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  // PWA Install Prompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Notification prompt
  useEffect(() => {
    const token = localStorage.getItem('token');
    const notificationsPrompted = localStorage.getItem('notificationsPrompted');
    
    if (token && !notificationsPrompted && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      }
    } else {
      alert(
        '📱 To install ZUCA Portal on your device:\n\n' +
        '🔵 Android (Chrome):\n' +
        '• Tap the menu button (⋮) at top right\n' +
        '• Select "Add to Home screen"\n' +
        '• Tap "Add" or "Install"\n\n' +
        '🍎 iPhone/iPad (Safari):\n' +
        '• Tap the Share button (📤) at bottom\n' +
        '• Scroll down and tap "Add to Home Screen"\n' +
        '• Tap "Add" in top right\n\n' +
        '💻 Desktop (Chrome/Edge):\n' +
        '• Click the install icon (➕) in address bar\n' +
        '• Click "Install"'
      );
    }
  };

  return (
    <div style={pageWrapper}>
      {/* Simple Top Bar with Just Basic Info */}
      <div style={topBarStyle}>
        <div style={topBarContentStyle}>
          <div style={topBarLeftStyle}>
            <FaHandsHelping style={topBarHeartStyle} />
            <span>Zetech Catholic Action • Faith & Fellowship</span>
          </div>
          <div style={topBarRightStyle}>
            <span style={topBarMassStyle}>Weekly Mass: Wednesday 4:30 PM</span>
          </div>
        </div>
      </div>

      {/* Simple Navigation - Only nav links */}
      <nav style={{ ...navStyle, background: scrollY > 50 ? "rgba(11, 11, 31, 0.9)" : "transparent", backdropFilter: scrollY > 50 ? "blur(10px)" : "none" }}>
        <div style={navContentStyle}>
          <div style={logoContainerStyle}>
            <img src={logo} alt="ZUCA Logo" style={logoStyle} />
            <span style={logoTextStyle}>ZUCA</span>
          </div>
          <div style={navLinksStyle}>
            <a href="#home" style={navLinkStyle}>Home</a>
            <a href="#about" style={navLinkStyle}>About</a>
            <a href="#connect" style={navLinkStyle}>Connect</a>
            <a href="#mass" style={navLinkStyle}>Mass</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" ref={heroRef} style={heroStyle(bg)}>
        <div style={heroOverlayStyle} />
        <div style={heroContentStyle}>
          {/* FLOATING OVAL CARD - Properly centered on all devices */}
          <div style={floatingCardWrapperStyle}>
            <div style={floatingCardStyle}>
              <div style={floatingCardContentStyle}>
                {/* Logo on left */}
                <img src={logo} alt="ZUCA Logo" style={floatingCardLogoStyle} />
                
                {/* Buttons on right */}
                <div style={floatingCardButtonsStyle}>
                  {showInstallButton && (
                    <button onClick={handleInstallClick} style={floatingCardInstallStyle}>
                      <FaDownload style={{ marginRight: "5px" }} />
                      Install
                    </button>
                  )}
                  <button onClick={() => navigate("/login")} style={floatingCardLoginStyle}>
                    Login
                  </button>
                  <button onClick={() => navigate("/liturgical-calendar")} style={floatingCardRegisterStyle}>
  📅 Liturgical Calendar
</button>
                  <button onClick={() => navigate("/register")} style={floatingCardRegisterStyle}>
                    Join Us
                  </button>
                </div>
              </div>
            </div>
          </div>

         {/* Welcome Card - With ZUCA Logo, Title, Welcome Message, and Register/Login */}
<div style={welcomeCardStyle}>
  <div style={welcomeCardHeaderStyle}>
    <img src={logo} alt="ZUCA Logo" style={welcomeCardLogoStyle} />
    <h2 style={welcomeCardTitleStyle}>Zetech University</h2>
  </div>
  
  <div style={welcomeCardSubtitleStyle}>
    CATHOLIC ACTION 
    </div>
    <div style={ZucaNameStyle}>
      (Z.U.C.A)
    </div>
  
  <p style={welcomeCardTextStyle}>
    Welcome to the Zetech University Catholic Action Portal. Here you can view announcements, explore mass schedules and other relevant programs, and connect with members — all in one powerful platform.
  </p>

  <div style={welcomeCardButtonsStyle}>
    <button onClick={() => navigate("/register")} style={welcomeButtonPrimaryStyle}>
      <FaUserPlus style={buttonIconStyle} />
      REGISTER
    </button>
    <button onClick={() => navigate("/login")} style={welcomeButtonSecondaryStyle}>
      <FaSignInAlt style={buttonIconStyle} />
      MEMBER LOGIN
    </button>
  </div>
</div>



{/* Mass Info Card */}
<div style={massInfoCardStyle}>
  <FaChurch style={massInfoIconStyle} />
  <div style={massInfoTextStyle}>
    <strong>Wednesday Mass:</strong> 4:30 PM
    <span style={massInfoLocationStyle}>Annex Building 002</span>
  </div>
</div>
          
          {/* Simple Mass Info Card */}
          
        </div>
      </section>

      {/* Rest of your sections exactly as they were - keeping everything intact */}
      {/* Mass Schedule Section */}
      <section id="mass" ref={massRef} className="fade-section" style={massSectionStyle}>
        <div style={sectionContainerStyle}>
          <div style={massHeaderStyle}>
            <FaPray style={massIconStyle} />
            <h2 style={massTitleStyle}>Weekly Mass & Choir Practice</h2>
            <p style={massSubtitleStyle}>Join us in prayer and Jumuia</p>
          </div>

          <div style={massCardsStyle}>
            <div style={massCardStyle}>
              <FaChurch style={massCardIconStyle} />
              <h3 style={massCardTitleStyle}>Wednesday Mass</h3>
              <div style={massTimeStyle}>
                <FaClock style={massTimeIconStyle} />
                <span>4:30 PM</span>
              </div>
              <div style={massLocationStyle}>
                <FaLocationArrow style={massLocationIconStyle} />
                <span>Annex Building 002</span>
              </div>
              <p style={massNoteStyle}>come join us!</p>
            </div>

            <div style={massCardStyle}>
              <FaPray style={massCardIconStyle} />
              <h3 style={massCardTitleStyle}>Daily Choir Practice</h3>
              <div style={massTimeStyle}>
                <FaClock style={massTimeIconStyle} />
                <span>4:00 PM - 6:00 PM</span>
              </div>
              <div style={massLocationStyle}>
                <FaLocationArrow style={massLocationIconStyle} />
                <span>ZETECH ANNEX 002</span>
              </div>
              <p style={massNoteStyle}>All are welcome to attend</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section id="connect" ref={connectRef} className="fade-section" style={socialSectionStyle}>
        <div style={sectionContainerStyle}>
          <div style={sectionHeaderStyle}>
            <FaHeart style={sectionIconStyle} />
            <h2 style={sectionTitleLightStyle}>Connect With Us</h2>
            <p style={sectionSubtitleStyle}>Follow our community on social media</p>
          </div>

          <div style={socialGridStyle}>
            <a 
              href="https://www.instagram.com/zetechcatholicaction?igsh=d211Y2htZW9qbGU3" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={socialCardStyle}
            >
              <div style={{ ...socialIconCircleStyle, background: "radial-gradient(circle at 30% 30%, #f09433, #d62976, #962fbf)" }}>
                <FaInstagram style={socialIconStyle} />
              </div>
              <span style={socialPlatformStyle}>Instagram</span>
              <span style={socialHandleStyle}>@zetechcatholicaction</span>
            </a>

            <a 
              href="https://www.facebook.com/share/1ELDK56qEJ" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={socialCardStyle}
            >
              <div style={{ ...socialIconCircleStyle, background: "#1877F2" }}>
                <FaFacebookF style={socialIconStyle} />
              </div>
              <span style={socialPlatformStyle}>Facebook</span>
              <span style={socialHandleStyle}>Zetech Catholic Action</span>
            </a>

            <a 
              href="https://www.youtube.com/@zetechUniversityCatholic" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={socialCardStyle}
            >
              <div style={{ ...socialIconCircleStyle, background: "#FF0000" }}>
                <FaYoutube style={socialIconStyle} />
              </div>
              <span style={socialPlatformStyle}>YouTube</span>
              <span style={socialHandleStyle}>Subscribe for New Releases</span>
            </a>

            <a 
              href="https://www.tiktok.com/@zetechcatholicaction?_t=ZM-8yeypKK8YpM&_r=1" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={socialCardStyle}
            >
              <div style={{ ...socialIconCircleStyle, background: "#000000" }}>
                <FaTiktok style={socialIconStyle} />
              </div>
              <span style={socialPlatformStyle}>TikTok</span>
              <span style={socialHandleStyle}>@zetechcatholicaction</span>
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="fade-section" style={aboutSectionStyle}>
        <div style={sectionContainerStyle}>
          <div style={sectionHeaderStyle}>
            <img src={logo} alt="ZUCA Logo" style={logoStyle} />
            <h2 style={sectionTitleDarkStyle}>Our Community</h2>
          </div>

          <div style={aboutContentStyle}>
            <p style={aboutTextStyle}>
              Zetech Catholic Action is a vibrant student group committed to evangelism, faith, and fellowship through music and action. Our mission is to spread the message of hope, love, and faith within our campus community and beyond. Our songs will be an expression of our devotion and a call to all to embrace God's grace.
            </p>

            <div style={activitiesGridStyle}>
              <div style={activityItemStyle}>
                <FaChurch style={activityIconStyle} />
                <span>Weekly Mass</span>
              </div>
              <div style={activityItemStyle}>
                <FaMusic style={activityIconStyle} />
                <span>St Kizito Choir</span>
              </div>
              <div style={activityItemStyle}>
                <FaUsers style={activityIconStyle} />
                <span>Jumuiyas</span>
              </div>
              <div style={activityItemStyle}>
                <FaHandsHelping style={activityIconStyle} />
                <span>Outdoor functions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="fade-section" ref={contactRef} style={contactSectionStyle}>
        <div style={sectionContainerStyle}>
          <div style={sectionHeaderStyle}>
            <FaEnvelope style={sectionIconLightStyle} />
            <h2 style={sectionTitleLightStyle}>Get In Touch</h2>
          </div>

          <div style={contactSimpleGridStyle}>
            <div style={contactSimpleItemStyle}>
              <FaMapMarkerAlt style={contactSimpleIconStyle} />
              <span>Zetech C/A, Ruiru</span>
            </div>
            <div style={contactSimpleItemStyle}>
              <FaEnvelope style={contactSimpleIconStyle} />
              <a href="mailto:zucaportal2025@gmail.com" style={contactSimpleLinkStyle}>zucaportal2025@gmail.com</a>
            </div>
            <div style={contactSimpleItemStyle}>
              <FaPhone style={contactSimpleIconStyle} />
              <span>zuca406@gmail.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <div style={footerSocialMinStyle}>
            <a href="https://www.instagram.com/zetechcatholicaction" target="_blank" rel="noopener noreferrer" style={footerSocialMinIconStyle}>
              <FaInstagram />
            </a>
            <a href="https://www.facebook.com/share/1ELDK56qEJ" target="_blank" rel="noopener noreferrer" style={footerSocialMinIconStyle}>
              <FaFacebookF />
            </a>
            <a href="https://www.youtube.com/@zetechUniversityCatholic" target="_blank" rel="noopener noreferrer" style={footerSocialMinIconStyle}>
              <FaYoutube />
            </a>
            <a href="https://www.tiktok.com/@zetechcatholicaction" target="_blank" rel="noopener noreferrer" style={footerSocialMinIconStyle}>
              <FaTiktok />
            </a>
          </div>

          {/* Footer Download Button */}
          {showInstallButton && (
            <div style={{ marginBottom: "20px" }}>
              <button onClick={handleInstallClick} style={footerInstallButtonStyle}>
                <FaDownload style={{ marginRight: "8px" }} />
                Install ZUCA App
              </button>
            </div>
          )}

          <div style={creditStyle}>
            <span>Built with</span>
            <FaHeart style={creditHeartStyle} />
            <span>by</span>
            <span style={creditNameStyle}> @CHRISTECH WEBSYS;</span>
          </div>

          <div style={copyrightStyle}>
            <p>© {new Date().getFullYear()} Zetech Catholic Action Portal</p>
          </div>
        </div>
      </footer>

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <NotificationPrompt onClose={() => {
          setShowNotificationPrompt(false);
          localStorage.setItem('notificationsPrompted', 'true');
        }} />
      )}

      <style>
        {`
          html, body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            overflow-y: auto !important;
            height: auto !important;
          }
          
          body {
            min-height: 100vh;
            overflow-y: auto !important;
          }
          
          #root {
            min-height: 100vh;
            overflow-y: auto !important;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-section {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease;
          }
          
          .fade-section.fade-in {
            opacity: 1;
            transform: translateY(0);
          }
          
          @media (max-width: 768px) {
            nav {
              padding: 10px 0;
            }
            
            .social-card {
              margin: 10px;
            }
          }
        `}
      </style>
    </div>
  );
}

// ========== STYLES ==========

const pageWrapper = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'TimesNewRoman', Roboto, sans-serif",
  color: "#ffffff",
  overflowX: "hidden",
  overflowY: "auto",
  minHeight: "100vh",
  position: "relative"
};

// Top Bar
const topBarStyle = {
  background: "#141c6000",
  padding: "1px",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  borderBottom: "4px solid rgba(13, 123, 197, 0)"
};

const topBarContentStyle = {
  maxWidth: "1px",
  margin: "0 auto",
  padding: "0 px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "1px",
  flexWrap: "wrap",
  gap: "0px"
};

const heroContentStyle = {
  position: "relative",
  zIndex: 2,
  textAlign: "center",
  maxWidth: "900px",
  width: "100%"
};

const topBarLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#ffffff"
};

const topBarHeartStyle = {
  color: "#efeff3",
  fontSize: "12px"
};

const topBarRightStyle = {
  color: "#ffffff",
  fontWeight: "900"
};

const topBarMassStyle = {
  fontSize: "13px"
};

// Navigation
const navStyle = {
  position: "fixed",
  top: "1px",
  left: 0,
  right: 0,
  zIndex: 1000,
  transition: "all 0.3s ease",
  padding: "10px 0"
};

const navContentStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px"
};

const logoContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "13px"
};

const logoStyle = {
  width: "40px",
  height: "auto"
};

const logoTextStyle = {
  fontSize: "30px",
  fontWeight: "1000",
  background: "linear-gradient(135deg, #fff, #00c6ff)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

const navLinksStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap"
};

const navLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: "700",
  borderRadius: "50px",
  padding: "5px 5px 4px 4px",
  transition: "color 0.3s"
};

// FLOATING CARD - NEW WRAPPER FOR PROPER CENTERING
const floatingCardWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginBottom: "30px"
};

const floatingCardStyle = {
  background: "rgba(32, 32, 41, 0.78)",
  backdropFilter: "blur(10px)",
  borderRadius: "60px",
  padding: "6px",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  zIndex: 1002,
  display: "inline-block",
  maxWidth: "100%"
};

const floatingCardContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  background: "rgba(16, 75, 238, 0.17)",
  borderRadius: "60px",
  padding: "7px 10px 7px 7px",
  flexWrap: "wrap",
  justifyContent: "center"
};

const floatingCardLogoStyle = {
  width: "65px",
  height: "65px",
  borderRadius: "50%",
  border: "2px solid #00c6ff"
};

const floatingCardButtonsStyle = {
  display: "flex",
  gap: "9px",
  marginRight: "9px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center"
};

const floatingCardInstallStyle = {
  padding: "8px 16px",
  borderRadius: "30px",
  border: "none",
  background: "linear-gradient(135deg, #ffd700, #ffaa00)",
  color: "#000",
  fontSize: "14px",
  
 
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center"
};

const floatingCardLoginStyle = {
  padding: "8px 16px",
  borderRadius: "30px",
  border: "1px solid rgba(193, 22, 22, 0.2)",
  background: "linear-gradient(135deg, #0c992d)",
  color: "#eaedeb",
 
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer"
};

const floatingCardRegisterStyle = {
  padding: "8px 16px",
  borderRadius: "30px",
  border: "none",
  background: "linear-gradient(135deg, #2896b5, #007bff)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer"
};

const footerInstallButtonStyle = {
  padding: "10px 24px",
  borderRadius: "30px",
  border: "none",
  background: "linear-gradient(135deg, #ffd700, #ffaa00)",
  color: "#000",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};

// Welcome Card Styles
const welcomeCardStyle = {
  background: "rgba(31, 97, 196, 0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "24px",
  padding: "40px 30px",
  margin: "0 auto 25px",
  maxWidth: "600px",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const heroOverlayStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(135deg, rgba(10,10,30,0.95), rgba(10, 177, 29, 0.22))"
};

const welcomeCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "10px"
};




const welcomeCardLogoStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "2px solid #00c6ff"
};

const welcomeCardTitleStyle = {
  fontSize: "clamp(20px, 4vw, 24px)",
  fontWeight: "900",
  color: "#fff",
  margin: 0
};


const ZucaNameStyle = {
  fontSize: "clamp(20px, 20vw, 24px)",
  fontWeight: "900",
  color: "#fff",
  margin: 0,
  background: "linear-gradient(135deg, #ebeeef, #e9ecef)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  letterSpacing: "2px",
    display: "text",

    marginBottom: "10px",

  borderBottom: "5px solid",
  borderImage: "linear-gradient(135deg, #e1ecee, #ebeff4) 1"
};

const welcomeCardSubtitleStyle = {
  fontSize: "clamp(24px, 5vw, 32px)",
  fontWeight: "900",
  background: "linear-gradient(135deg, #00c6ff, #007bff)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: "10px",
  letterSpacing: "2px",
  display: "inline-block",
  borderBottom: "3px solid",
  borderImage: "linear-gradient(135deg, #00c6ff, #007bff) 1"

};

const welcomeCardTextStyle = {
  fontSize: "clamp(14px, 3vw, 16px)",
  color: "#cbd5e1",
  lineHeight: "1.6",
  marginBottom: "30px",
  maxWidth: "500px",
  margin: "0 auto 30px"
};

const heroStyle = (bg) => ({
  minHeight: "100vh",
  backgroundImage: `url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 20px"
});

const welcomeCardButtonsStyle = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  flexWrap: "wrap"
};

const buttonIconStyle = {
  marginRight: "8px"
};

const welcomeButtonPrimaryStyle = {
  padding: "12px 30px",
  borderRadius: "30px",
  border: "none",
  background: "linear-gradient(135deg, #00c6ff, #007bff)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center"
};

const welcomeButtonSecondaryStyle = {
  padding: "12px 30px",
  borderRadius: "30px",
  border: "2px solid #00c6ff",
  background: "transparent",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center"
};

// Floating Action Buttons Styles
const floatingActionsStyle = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  marginBottom: "25px",
  flexWrap: "wrap"
};

const floatingActionButtonStyle = {
  padding: "10px 20px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(5px)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.3s ease"
};

const floatingActionIconStyle = {
  fontSize: "14px",
  color: "#00c6ff"
};

// Mass Info Card Styles
const massInfoCardStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(5px)",
  padding: "12px 24px",
  borderRadius: "50px",
  border: "1px solid rgba(255,255,255,0.2)",
  margin: "0 auto"
};

const massInfoIconStyle = {
  fontSize: "20px",
  color: "#00c6ff"
};

const massInfoTextStyle = {
  fontSize: "16px",
  color: "#fff"
};

const massInfoLocationStyle = {
  display: "block",
  fontSize: "14px",
  color: "#94a3b8",
  marginTop: "2px"
};

const heroMassCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  background: "rgba(222, 219, 236, 0.19)",
  padding: "12px 20px",
  borderRadius: "40px",
  width: "fit-content",
  margin: "0 auto 30px",
  border: "1px solid rgb(126, 148, 250)"
};

const heroMassIconStyle = {
  fontSize: "20px",
  color: "#00c6ff"
};

const heroMassTextStyle = {
  fontSize: "19px",
  textAlign: "left"
};

const heroButtonsStyle = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  flexWrap: "wrap"
};

const heroButtonPrimaryStyle = {
  padding: "12px 30px",
  borderRadius: "30px",
  border: "none",
  background: "linear-gradient(135deg, #00c6ff, #007bff)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer"
};

const heroButtonSecondaryStyle = {
  padding: "12px 30px",
  borderRadius: "30px",
  border: "2px solid #00c6ff",
  background: "transparent",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer"
};

// Mass Section
const massSectionStyle = {
  padding: "60px 15px",
  background: "linear-gradient(135deg, #375bd1c5, #0a0a0cfe)"
};

const sectionContainerStyle = {
  maxWidth: "1200px",
  margin: "0 auto"
};

const massHeaderStyle = {
  textAlign: "center",
  marginBottom: "40px"
};

const massIconStyle = {
  fontSize: "60px",
  color: "#f5f9f6",
  marginBottom: "25px"
};

const massTitleStyle = {
  fontSize: "clamp(24px, 5vw, 32px)",
  fontWeight: "1000",
  marginBottom: "10px",
  color: "#ffffff"
};

const massSubtitleStyle = {
  fontSize: "15px",
  color: "#94a3b8"
};

const massCardsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "25px",
  maxWidth: "600px",
  margin: "0 auto"
};

const massCardStyle = {
  background: "rgba(75, 71, 71, 0.7)",
  padding: "30px 20px",
  borderRadius: "20px",
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.1)"
};

const massCardIconStyle = {
  fontSize: "30px",
  color: "#00c6ff",
  marginBottom: "15px"
};

const massCardTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "15px",
  color: "#fff"
};

const massTimeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  marginBottom: "10px",
  color: "#cbd5e1",
  fontSize: "15px"
};

const massTimeIconStyle = {
  fontSize: "14px",
  color: "#00c6ff"
};

const massLocationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  marginBottom: "15px",
  color: "#cbd5e1",
  fontSize: "14px"
};

const massLocationIconStyle = {
  fontSize: "14px",
  color: "#00c6ff"
};

const massNoteStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  fontStyle: "italic"
};

// Social Section
const socialSectionStyle = {
  padding: "60px 15px",
  background: "#0a0a25"
};

const sectionHeaderStyle = {
  textAlign: "center",
  marginBottom: "40px"
};

const sectionIconStyle = {
  fontSize: "30px",
  color: "#f9f3f3",
  marginBottom: "15px"
};

const sectionTitleLightStyle = {
  fontSize: "clamp(22px, 5vw, 30px)",
  fontWeight: "700",
  marginBottom: "10px",
  color: "#fff"
};

const sectionSubtitleStyle = {
  fontSize: "17px",
  color: "#94a3b8",
  maxWidth: "500px",
  margin: "0 auto"
};

const socialGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "20px",
  maxWidth: "800px",
  margin: "0 auto"
};

const socialCardStyle = {
  padding: "25px 15px",
  borderRadius: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  textDecoration: "none",
  color: "#fff",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.3s",
  cursor: "pointer"
};

const socialIconCircleStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "5px"
};

const socialIconStyle = {
  fontSize: "24px",
  color: "#fff"
};

const socialPlatformStyle = {
  fontSize: "16px",
  fontWeight: "600"
};

const socialHandleStyle = {
  fontSize: "12px",
  opacity: 0.8
};

// About Section
const aboutSectionStyle = {
  padding: "60px 15px",
  background: "#a5c3be8f"
};

const sectionTitleDarkStyle = {
  fontSize: "clamp(22px, 5vw, 30px)",
  fontWeight: "700",
  marginBottom: "20px",
  color: "#0a0a25"
};

const aboutContentStyle = {
  maxWidth: "700px",
  margin: "0 auto"
};

const aboutTextStyle = {
  fontSize: "18px",
  lineHeight: "1.5",
  color: "#1742d1",
  marginBottom: "50px",
  textAlign: "center"
};

const activitiesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "15px",
  maxWidth: "400px",
  margin: "0 auto"
};

const activityItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px",
  background: "#47474c4e",
  borderRadius: "10px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  fontSize: "14px",
  color: "#1e293b"
};

const activityIconStyle = {
  fontSize: "16px",
  color: "#00c6ff"
};

// Contact Section
const contactSectionStyle = {
  padding: "50px 15px",
  background: "linear-gradient(135deg, #0f172aa0, #1e293b)"
};

const sectionIconLightStyle = {
  fontSize: "30px",
  color: "#00c6ff",
  marginBottom: "15px"
};

const contactSimpleGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
  maxWidth: "700px",
  margin: "0 auto"
};

const contactSimpleItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#fff"
};

const contactSimpleIconStyle = {
  fontSize: "16px",
  color: "#00c6ff"
};

const contactSimpleLinkStyle = {
  color: "#fff",
  textDecoration: "none"
};

// Footer
const footerStyle = {
  background: "#131315d6",
  padding: "40px 15px 20px",
  borderTop: "1px solid rgba(255,255,255,0.1)"
};

const footerContentStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  textAlign: "center"
};

const footerSocialMinStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "20px"
};

const footerSocialMinIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "rgba(7, 7, 7, 0.69)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontSize: "16px",
  transition: "all 0.3s",
  cursor: "pointer"
};

const creditStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  marginBottom: "15px",
  fontSize: "14px",
  color: "#94a3b8"
};

const creditHeartStyle = {
  fontSize: "14px",
  color: "#f8f8f8"
};

const creditNameStyle = {
  color: "#00c6ff",
  fontWeight: "600"
};

const copyrightStyle = {
  fontSize: "13px",
  color: "#64748b"
};

export default Landing2;