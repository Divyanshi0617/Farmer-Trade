import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "farmer",
    state: "",
    district: "",
    village: "",
    businessName: "",
    businessType: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      console.log("REGISTER RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      // Save authentication
      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Farmer
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
      console.error(
        "REGISTER ERROR:",
        error
      );

      setError(
        error.message ||
        "Something went wrong"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="register-box">

        <button
          className="auth-logo"
          onClick={() => navigate("/")}
        >
          🌾 Farmer<span>Trade</span>
        </button>


        <div className="auth-title">

          <h1>
            Create Your Account
          </h1>

          <p>
            It only takes a few simple steps.
          </p>

        </div>


        {error && (
          <div className="error-box">
            {error}
          </div>
        )}


        <form onSubmit={handleRegister}>

          <label>
            I want to use Farmer Trade as
          </label>


          <div className="role-buttons">

            <button
              type="button"
              className={
                form.role === "farmer"
                  ? "role-button selected"
                  : "role-button"
              }
              onClick={() =>
                updateField(
                  "role",
                  "farmer"
                )
              }
            >
              <span>🌾</span>

              <strong>
                Farmer
              </strong>

              <small>
                I want to sell crops
              </small>
            </button>


            <button
              type="button"
              className={
                form.role === "buyer"
                  ? "role-button selected"
                  : "role-button"
              }
              onClick={() =>
                updateField(
                  "role",
                  "buyer"
                )
              }
            >
              <span>🏪</span>

              <strong>
                Buyer
              </strong>

              <small>
                I want to buy crops
              </small>
            </button>

          </div>


          <label>
            Your Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) =>
              updateField(
                "name",
                e.target.value
              )
            }
            required
          />


          <label>
            Mobile Number
          </label>

          <input
            type="tel"
            placeholder="Enter your 10-digit mobile number"
            value={form.phone}
            onChange={(e) =>
              updateField(
                "phone",
                e.target.value
              )
            }
            required
          />


          <label>
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) =>
              updateField(
                "email",
                e.target.value
              )
            }
            required
          />


          <label>
            Create Password
          </label>

          <input
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) =>
              updateField(
                "password",
                e.target.value
              )
            }
            minLength={6}
            required
          />


          <div className="two-inputs">

            <div>

              <label>
                State
              </label>

              <input
                type="text"
                placeholder="Punjab"
                value={form.state}
                onChange={(e) =>
                  updateField(
                    "state",
                    e.target.value
                  )
                }
              />

            </div>


            <div>

              <label>
                District
              </label>

              <input
                type="text"
                placeholder="Ludhiana"
                value={form.district}
                onChange={(e) =>
                  updateField(
                    "district",
                    e.target.value
                  )
                }
              />

            </div>

          </div>


          <label>
            Village / Area
          </label>

          <input
            type="text"
            placeholder="Enter your village or area"
            value={form.village}
            onChange={(e) =>
              updateField(
                "village",
                e.target.value
              )
            }
          />

          {form.role === "buyer" && (
            <>
              <label>Business Name (Optional)</label>
              <input
                type="text"
                placeholder="Enter your business name"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
              />

              <label>Business Type (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Retailer, Wholesaler, Processor"
                value={form.businessType}
                onChange={(e) => updateField("businessType", e.target.value)}
              />

              <label>Full Address (Optional)</label>
              <input
                type="text"
                placeholder="Enter your full business address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </>
          )}


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

        </form>


        <div className="auth-bottom">

          <p>
            Already have an account?
          </p>

          <button
            onClick={() => navigate("/login")}
          >
            Login
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

export default Register;