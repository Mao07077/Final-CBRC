import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";

const SignupForm = () => {
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data for backend (lowercase role to match backend expectations)
    const signupData = {
      ...formData,
      role: formData.role.toLowerCase()
    };
    
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
        <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-bold text-center text-primary-dark mb-6">
        Create Your Account
      </h2>
      {error && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {error}
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
            className="btn btn-primary w-full max-w-xs py-3"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
