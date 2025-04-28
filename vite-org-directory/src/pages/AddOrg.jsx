import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Select from "react-select";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa6";


const AddOrg = () => {
  const [orgName, setOrgName] = useState("");
  const [orgAcronym, setOrgAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [president, setPresident] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [applicationForm, setApplicationForm] = useState("");
  const [applicationDates, setApplicationDates] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(""); // Added website URL field
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    website: "", // Added website URL to social inks
  });
  

  const [tagOptions, setTagOptions] = useState([]);
  const navigate = useNavigate();

  // Fetch tags from the 'tag' table
  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("tag")
        .select("tag_id, category");

      if (error) {
        console.error("Error fetching tags:", error.message);
        return;
      }

      // Map the data to the required format for react-select
      const formattedTags = data.map((tag) => ({
        value: tag.tag_id,
        label: tag.category,
      }));

      setTagOptions(formattedTags);
    };

    fetchTags();
  }, []);

  const handleAddOrg = async (e) => {
    e.preventDefault();

    // Generate slug from acronym
    const slug = orgAcronym;

    let logo_url = null;

    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `logos/${slug}-logo.${fileExt}`;
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

    // Update socialLinks to include the website URL
    const updatedSocialLinks = {
      ...socialLinks,
      website: websiteUrl
    };

    const { data, error } = await supabase
      .from("organization")
      .insert([
        {
          org_name: orgName,
          org_logo: logo_url,
          president,
          about: description,
          socmed_links: updatedSocialLinks, // Store social media links as JSON
          application_dates: applicationDates,
          slug: orgAcronym,
        },
      ])
      .select();

    if (error) {
      alert("Error adding organization: " + error.message);
    } else {
      // Store selected tags (many-to-many relationship with organizations)
      const orgId = data[0].org_id;
      const tagsData = selectedTags.map((tag) => ({
        org_id: orgId,
        tag_id: tag.value,
      }));

      if (tagsData.length > 0) {
        const { error: tagError } = await supabase
          .from("organization_tags")
          .insert(tagsData);

        if (tagError) {
          alert("Error linking tags: " + tagError.message);
        }
      }

      alert("Organization added successfully!");
      navigate(`/orgs/${slug}`); // Navigate using the slug
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
            <label className="block mb-1 font-medium">Organization Acronym</label>
            <input
              type="text"
              value={orgAcronym}
              onChange={(e) => setOrgAcronym(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md bg-white"
              placeholder="e.g. SPARCS or AMPLI"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Led by (President)</label>
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
                <FaGlobe className="text-gray-700 text-xl" />
                <input
                  type="url"
                  placeholder="Other URL"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-white"
                />
              </div>

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
                <FaTwitter className="text-gray-900 text-xl" />
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
              placeholder="e.g., Jan 15 - Feb 28, 2025"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Tags</label>
            <Select
              options={tagOptions}
              isMulti
              onChange={(selected) => setSelectedTags(selected)}
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
              className="w-full px-4 py-2 border rounded-md bg-white h-32"
              placeholder="Write a description of the organization..."
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