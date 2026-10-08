import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      // Save login information
      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Farmer dashboard
      if (
        data.user &&
        data.user.role &&
        data.user.role.toLowerCase() === "farmer"
      ) {
        navigate("/farmer/dashboard", {
          replace: true,
        });
      }

      // Buyer
      else if (
        data.user &&
        data.user.role &&
        data.user.role.toLowerCase() === "buyer"
      ) {
        navigate("/buyer/dashboard", {
          replace: true,
        });
      }

      else {
        navigate("/", {
          replace: true,
        });
      }

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        error.message || "Something went wrong"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-box">

        <button
          className="auth-logo"
          onClick={() => navigate("/")}
        >
          🌾 Farmer<span>Trade</span>
        </button>


        <div className="auth-title">

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to your Farmer Trade account.
          </p>

        </div>


        {error && (
          <div className="error-box">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin}>

          <label>
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login →"}
          </button>

        </form>


        <div className="auth-bottom">

          <p>
            Don't have an account?
          </p>

          <button
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>

        </div>


        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Login;