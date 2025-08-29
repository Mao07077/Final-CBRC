import React, { useState, useEffect } from "react";
import axios from "../api/adminApi";


const ProfileUpdateRequestForm = () => {
  const [fields, setFields] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    suffix: "",
    birthdate: "",
    gender: "",
    email: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Fetch student profile data to prefill the form
    const fetchProfile = async () => {
      try {
        // You may need to adjust the endpoint to match your backend
        const res = await axios.get("/student/profile");
        if (res.data && res.data.profile) {
          setFields({
            firstname: res.data.profile.firstname || "",
            middlename: res.data.profile.middlename || "",
            lastname: res.data.profile.lastname || "",
            suffix: res.data.profile.suffix || "",
            birthdate: res.data.profile.birthdate || "",
            gender: res.data.profile.gender || "",
            email: res.data.profile.email || "",
            reason: "",
          });
        }
      } catch (err) {
        // Optionally handle error
      }
      setFetching(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess("");
    setError("");
    try {
      // Send request to backend
      const res = await axios.post("/account-requests", fields);
      if (res.data.success) {
        setSuccess("Request submitted successfully!");
        setFields({
          ...fields,
          reason: "",
        });
      } else {
        setError(res.data.error || "Failed to submit request.");
      }
    } catch (err) {
      setError("Failed to submit request.");
    }
    setIsLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg w-full mx-auto p-6 bg-white rounded-lg shadow space-y-4 overflow-y-auto"
      style={{ maxHeight: "80vh" }}
    >
      <h2 className="text-xl font-bold mb-2">Profile Update Request</h2>
      {success && <div className="text-green-600 bg-green-100 p-2 rounded">{success}</div>}
      {error && <div className="text-red-600 bg-red-100 p-2 rounded">{error}</div>}
      {fetching ? (
        <div className="text-center text-gray-500">Loading profile...</div>
      ) : (
        <>
          <input name="firstname" type="text" value={fields.firstname} onChange={handleChange} placeholder="First Name" className="w-full px-3 py-2 border rounded" required />
          <input name="middlename" type="text" value={fields.middlename} onChange={handleChange} placeholder="Middle Name" className="w-full px-3 py-2 border rounded" />
          <input name="lastname" type="text" value={fields.lastname} onChange={handleChange} placeholder="Last Name" className="w-full px-3 py-2 border rounded" required />
          <input name="suffix" type="text" value={fields.suffix} onChange={handleChange} placeholder="Suffix" className="w-full px-3 py-2 border rounded" />
          <input name="birthdate" type="date" value={fields.birthdate} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          <select name="gender" value={fields.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded" required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input name="email" type="email" value={fields.email} onChange={handleChange} placeholder="Email" className="w-full px-3 py-2 border rounded" required />
          <textarea name="reason" value={fields.reason} onChange={handleChange} placeholder="Reason for update" className="w-full px-3 py-2 border rounded" required />
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
        </>
      )}
    </form>
  );
};

export default ProfileUpdateRequestForm;
