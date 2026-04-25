// frontend/src/components/RoleRoute.jsx
import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, allowedRoles }) {
  // Get user from localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If user's role is not in allowedRoles, redirect to dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user has the correct role, render the children
  return children;
}