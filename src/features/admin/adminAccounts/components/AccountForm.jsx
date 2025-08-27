import { useState, useEffect } from "react";
import useAccountStore from "../../../../store/admin/accountStore";

const AccountForm = () => {
  const { saveAccount, editingAccount, closeModal, isLoading } =
    useAccountStore();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "student",
    id_number: "",
  });

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        firstname: editingAccount.firstname || "",
        lastname: editingAccount.lastname || "",
        email: editingAccount.email || "",
        role: editingAccount.role || "student",
        id_number: editingAccount.id_number || "",
        password: "", // Don't pre-fill password
      });
    } else {
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        role: "student",
        id_number: "",
      });
    }
  }, [editingAccount]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.password) {
      delete dataToSubmit.password; // Don't send empty password on update
    }
    saveAccount(dataToSubmit);
  };

  return (
    <div className="card max-w-lg w-full">
      <h2 className="text-2xl font-bold mb-6">
        {editingAccount ? "Edit Account" : "Create New Account"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="firstname"
          value={formData.firstname}
          onChange={handleChange}
          placeholder="First Name"
          className="form-input"
          required
        />
        <input
          type="text"
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          placeholder="Last Name"
          className="form-input"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="form-input"
          required
        />
        <input
          type="text"
          name="id_number"
          value={formData.id_number}
          onChange={handleChange}
          placeholder="ID Number"
          className="form-input"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={editingAccount ? "New Password (optional)" : "Password"}
          className="form-input"
          required={!editingAccount}
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Saving..." : "Save Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountForm;
