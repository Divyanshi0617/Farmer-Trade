import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  // Login nahi hai
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Role check
  if (
    role &&
    user.role &&
    user.role.toLowerCase() !== role.toLowerCase()
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;