import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Select from "react-select";
import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa6";

const AddOrg = () => {
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [president, setPresident] = useState("");
  const [tags, setTags] = useState([""]);
  const [applicationForm, setApplicationForm] = useState("");
  const [applicationDates, setApplicationDates] = useState("");

  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  });

  const navigate = useNavigate();

  const TAG_OPTIONS = [
    { value: "Academic", label: "Academic" },
    { value: "Cultural", label: "Cultural" },
    { value: "Sports", label: "Sports" },
    { value: "Technical", label: "Technical" },
    { value: "Community Service", label: "Community Service" },
    { value: "Leadership", label: "Leadership" },
    { value: "Performing Arts", label: "Performing Arts" },
    { value: "Environmental", label: "Environmental" },
  ];

  const handleAddOrg = async (e) => {
    e.preventDefault();

    let logo_url = null;

    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `logos/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, logoFile);

      if (uploadError) {
        alert("Failed to upload logo.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      logo_url = publicUrlData?.publicUrl;
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert([
        {
          name: orgName,
          description,
          email,
          logo_url,
          lead_by: president,
          tags,
          application_form: applicationForm,
          application_dates: applicationDates,
          facebook_link: facebook,
        },
      ])
      .select();

    if (error) {
      alert("Error adding organization: " + error.message);
    } else {
      alert("Organization added successfully!");
      navigate(`/orgs/${data[0].id}`);
    }
  };

  return (
    <>
      <Navbar userRole="superadmin" />
      <div className="m-10 p-6 max-w-2xl mx-auto bg-gray-50 rounded-md shadow-md">
        <h2 className="flex justify-center text-2xl font-semibold mb-4 text-maroon">
          Add Organization
        </h2>
        <form onSubmit={handleAddOrg} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Lead by (President)
            </label>
            <input
              type="text"
              value={president}
              onChange={(e) => setPresident(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Social Media Links</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaFacebook className="text-blue-600 text-xl" />
                <input
                  type="url"
                  placeholder="Facebook URL"
                  value={socialLinks.facebook}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, facebook: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaXTwitter className="text-gray-900 text-xl" />
                <input
                  type="url"
                  placeholder="Twitter URL"
                  value={socialLinks.twitter}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, twitter: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaInstagram className="text-pink-500 text-xl" />
                <input
                  type="url"
                  placeholder="Instagram URL"
                  value={socialLinks.instagram}
                  onChange={(e) =>
                    setSocialLinks({
                      ...socialLinks,
                      instagram: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaLinkedin className="text-blue-700 text-xl" />
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={socialLinks.linkedin}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Application Form URL
            </label>
            <input
              type="url"
              value={applicationForm}
              onChange={(e) => setApplicationForm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Application Dates</label>
            <input
              type="text"
              value={applicationDates}
              onChange={(e) => setApplicationDates(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Tags</label>
            <Select
              options={TAG_OPTIONS}
              isMulti
              onChange={(selected) => setTags(selected.map((opt) => opt.value))}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select tags"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              About the Organization
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Logo</label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="logo-upload"
                className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md inline-block"
              >
                {logoFile ? "Change Logo" : "Upload Logo"}
              </label>
              <span className="text-sm text-gray-600">
                {logoFile ? logoFile.name : "No file selected"}
              </span>
            </div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
              className="hidden"
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full bg-maroon text-white px-6 py-2 rounded-md hover:bg-red-800 cursor-pointer"
            >
              Add Organization
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddOrg;
