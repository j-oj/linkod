import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
//import { useNavigate } from "react-router-dom";
//import Navbar from "../components/navbar.jsx";
import Select from "react-select";

const CreateAdmin = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  useEffect(() => {
    async function fetchOrgs() {
      const { data, error } = await supabase
        .from("organization")
        .select("org_id, org_name");
      if (error) {
        console.error("Failed to fetch organizations:", error);
      } else {
        setOrgs(data);
      }
    }
    fetchOrgs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !name || !selectedOrg) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Invite the user by email
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
        data: {
          full_name: name.trim(),
        },
      });

      
      if (inviteError) {
        console.error("Failed to send invite:", inviteError);
        alert("Failed to send invite. Please try again.");
        return;
      }

      alert("Invite sent successfully! The user will receive an email to sign up.");

      // Clear the form
      setEmail("");
      setName("");
      setSelectedOrg("");
    } catch (error) {
      console.error("Error inviting user:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (

    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Invite New Admin</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Full Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Gmail Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@up.edu.ph"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="org" className="block font-medium mb-1">
            Organization
          </label>
        <Select
            options={orgs.map((org) => ({
                value: org.org_id,
                label: org.org_name,
            }))}
            value={
                orgs
                    .map((org) => ({
                        value: org.org_id,
                        label: org.org_name,
                }))
                .find((option) => option.value === selectedOrg) || null
            }
            onChange={(selectedOption) => setSelectedOrg(selectedOption?.value || null)}
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder="Select an organization"
            isClearable
        />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Invite
        </button>
      </form>
    </div>
  );
};

export default CreateAdmin;