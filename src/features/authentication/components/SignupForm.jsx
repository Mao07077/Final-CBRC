import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import authService from "../../../services/authService";

const SignupForm = ({ asAdmin = false, onSuccess, onCancel }) => {
  const { signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    suffix: "",
    birthdate: "",
    gender: "",
    email: "",
    password: "",
    id_number: "",
    role: "",
    program: ""
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prepare data for backend (lowercase role to match backend expectations)
    const signupData = {
      ...formData,
      role: formData.role.toLowerCase()
    };

    if (asAdmin) {
      try {
        setLocalError(null);
        setLocalLoading(true);
        const resp = await authService.signup(signupData);
        const data = resp.data || {};
        if (data.success) {
          window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Account created successfully.' } }));
          onSuccess && onSuccess();
        } else {
          const msg = data.message || 'Signup failed';
          setLocalError(msg);
          window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: msg } }));
        }
      } catch (err) {
        const msg = err?.response?.data?.detail || 'Signup failed';
        setLocalError(msg);
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: msg } }));
      } finally {
        setLocalLoading(false);
      }
      return;
    }

    const result = await signup(signupData);
    if (result.success) {
      // After successful signup and auto-login, redirect appropriately
      const userData = useAuthStore.getState().userData;
      const isNewUser = useAuthStore.getState().isNewUser;
      if (isNewUser && userData.role === 'student') {
        navigate('/survey');
      } else {
        // Redirect to appropriate dashboard
        switch (userData.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'instructor':
            navigate('/instructor/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/student/dashboard');
        }
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6">
        <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-auto max-w-[200px] object-contain" />
      </div>
      {!asAdmin && error && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      {asAdmin && localError && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {localError}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
      >
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          onChange={handleChange}
          required
          className="form-input"
        />
        <input
          type="text"
          name="lastname"
          placeholder="Last Name"
          onChange={handleChange}
          required
          className="form-input"
        />
        <input
          type="text"
          name="middlename"
          placeholder="Middle Name"
          onChange={handleChange}
          className="form-input"
        />
        <input
          type="text"
          name="suffix"
          placeholder="Suffix"
          onChange={handleChange}
          className="form-input"
        />
        <input
          type="date"
          name="birthdate"
          onChange={handleChange}
          required
          className="form-input"
        />
        <select
          name="gender"
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>
        <input
          type="email"
          name="email"
          placeholder="E-Mail"
          onChange={handleChange}
          required
          className="form-input md:col-span-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="form-input"
        />
        <input
          type="number"
          name="id_number"
          placeholder="ID Number"
          onChange={handleChange}
          required
          className="form-input"
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        {formData.role === "student" && (
          <select
            name="program"
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Program</option>
            <option>LET</option>
            <option>Nursing</option>
          </select>
        )}
        <div className="md:col-span-2 flex flex-col items-center mt-4">
          <button
            type="submit"
            className="btn btn-primary w-full max-w-xs py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={asAdmin ? localLoading : isLoading}
          >
            {(asAdmin ? localLoading : isLoading) ? "Creating Account..." : "Create Account"}
          </button>
          {!asAdmin && (
            <p className="mt-4 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          )}
          {asAdmin && onCancel && (
            <button type="button" className="mt-3 text-sm text-gray-600 hover:underline" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
