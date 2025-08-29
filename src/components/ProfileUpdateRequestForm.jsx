import React, { useState, useEffect } from "react";
import axios from "../api/adminApi";
import useAuthStore from "../store/authStore";


const ProfileUpdateRequestForm = () => {
  const [fields, setFields] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    suffix: "",
    birthdate: "",
    gender: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  const { userData } = useAuthStore();
  useEffect(() => {
    // Fetch student profile data to prefill the form
    const fetchProfile = async () => {
      if (!userData || !userData.id_number) {
        setFetching(false);
        return;
      }
      try {
        const res = await axios.get(`/profile/${userData.id_number}`);
        if (res.data) {
          setFields({
            firstname: res.data.firstname || "",
            middlename: res.data.middlename || "",
            lastname: res.data.lastname || "",
            suffix: res.data.suffix || "",
            birthdate: res.data.birthdate || "",
            gender: res.data.gender || "",
            email: res.data.email || "",
            // reason removed
          });
        }
      } catch (err) {
        // Optionally handle error
      }
      setFetching(false);
    };
    fetchProfile();
  }, [userData]);

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
      if (!userData || !userData.id_number) {
        setError("User ID not found.");
        setIsLoading(false);
        return;
      }
      const update_data = { ...fields };
      const res = await axios.post(
        "/admin/account-requests",
        {
          id_number: userData.id_number,
          update_data
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
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
          <input name="firstname" type="text" value={fields.firstname} onChange={handleChange} placeholder="First Name (optional)" className="w-full px-3 py-2 border rounded" />
          <input name="middlename" type="text" value={fields.middlename} onChange={handleChange} placeholder="Middle Name (optional)" className="w-full px-3 py-2 border rounded" />
          <input name="lastname" type="text" value={fields.lastname} onChange={handleChange} placeholder="Last Name (optional)" className="w-full px-3 py-2 border rounded" />
          <input name="suffix" type="text" value={fields.suffix} onChange={handleChange} placeholder="Suffix (optional)" className="w-full px-3 py-2 border rounded" />
          <input name="birthdate" type="date" value={fields.birthdate} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
          <select name="gender" value={fields.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded">
            <option value="">Select Gender (optional)</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input name="email" type="email" value={fields.email} onChange={handleChange} placeholder="Email (optional)" className="w-full px-3 py-2 border rounded" />
          <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </button>
        </>
      )}
    </form>
  );
};

export default ProfileUpdateRequestForm;
