import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#222" }}>
      <Link to="/" style={{ color: "white", marginRight: "15px" }}>
        Dashboard
      </Link>
      <Link to="/login" style={{ color: "white", marginRight: "15px" }}>
        Login
      </Link>
      <Link to="/register" style={{ color: "white", marginRight: "15px" }}>
        Register
      </Link>
      <Link to="/lyrics" style={{ color: "white", marginRight: "15px" }}>
        Lyrics
      </Link>
    </nav>
  );
}

export default Navbar;