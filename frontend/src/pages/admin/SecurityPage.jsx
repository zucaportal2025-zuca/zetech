import backgroundImg from "../../assets/background.png";

function SecurityPage() {
  return (
    <div style={pageStyle}>
      <h1>Security / Reset</h1>
      <p>Manage security alerts, detect breaches, and reset user passwords.</p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: `url(${backgroundImg}) no-repeat center center`,
  backgroundSize: "cover",
  color: "white",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

export default SecurityPage;