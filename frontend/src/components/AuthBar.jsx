// frontend/src/components/AuthBar.jsx
import { useEffect, useState } from "react";
import BASE_URL from "../api";

function AuthBar() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("zuca_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setMode("login");
    }
  }, []);

  const register = async () => {
    if (!fullName.trim() || !phone.trim()) return alert("Name and phone required");

    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("zuca_user", JSON.stringify(data.user));
        localStorage.setItem("zuca_token", data.token);
        setUser(data.user);
        alert("Registered successfully!");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const login = async () => {
    if (!phone.trim()) return alert("Phone number required");

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("zuca_user", JSON.stringify(data.user));
        localStorage.setItem("zuca_token", data.token);
        setUser(data.user);
        alert("Logged in!");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  if (user) return null; // hide if already logged in

  return (
    <div style={barStyle}>
      {mode === "register" ? (
        <>
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={register}>Register</button>
          <span onClick={() => setMode("login")} style={switchStyle}>
            Already registered?
          </span>
        </>
      ) : (
        <>
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={login}>Login</button>
          <span onClick={() => setMode("register")} style={switchStyle}>
            Not registered?
          </span>
        </>
      )}
    </div>
  );
}

const barStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  width: "100%",
  background: "rgba(0,0,0,0.85)",
  padding: "15px",
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  zIndex: 999,
};

const switchStyle = {
  color: "#FFD700",
  cursor: "pointer",
  marginLeft: "5px",
};

export default AuthBar;