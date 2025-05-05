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
  const [tagInput, setTagInput] = useState("");
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
        .select("tag_id, tag_name");

      if (error) {
        console.error("Error fetching tags:", error.message);
        return;
      }

      // Map the data to the required format for react-select
      const formattedTags = data.map((tag) => ({
        value: tag.tag_id,
        label: tag.tag_name,
      }));

      setTagOptions(formattedTags);
    };

    fetchTags();
  }, []);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("category").select("*");
      if (error) {
        console.error("Error fetching categories:", error.message);
        return;
      }
      setCategories(data);
    };
  
    fetchCategories();
  }, []);
  

  const handleAddOrg = async (e) => {
    e.preventDefault();
  
    // Generate slug from acronym
    const slug = orgAcronym;
  
    let logo_url = null;
  
    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const filePath = `logos/${slug}-logo.${fileExt}`;
      console.log("Uploading file to:", filePath);
  
      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, logoFile);
  
      if (uploadError) {
        console.error("Upload Error:", uploadError);
        alert("Failed to upload logo.");
        return;
      }
  
      const { data: publicUrlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);
  
      console.log("Public URL Data:", publicUrlData);
      logo_url = publicUrlData?.publicUrl;
    }
  
    // Update socialLinks to include the website URL
    const updatedSocialLinks = {
      ...socialLinks,
      website: websiteUrl,
    };
  
    const { data, error } = await supabase
      .from("organization")
      .insert([
        {
          org_name: orgName,
          org_logo: logo_url,
          president,
          org_email: email,
          about: description,
          socmed_links: updatedSocialLinks, // Store social media links as JSON
          application_form: applicationForm,
          application_dates: applicationDates,
          slug: orgAcronym,
          category: selectedCategory,
        },
      ])
      .select();
  
    if (error) {
      alert("Error adding organization: " + error.message);
      return;
    }
  
    const orgId = data[0].org_id;
  
    // Step 1: Normalize input tags
    const inputTagNames = tagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0); // Remove empty tags
    console.log("Input Tag Names:", inputTagNames);
  
    // Step 2: Check existing tags in the `tag` table
    const { data: existingTags, error: fetchTagsError } = await supabase
      .from("tag")
      .select("*")
      .in("tag_name", inputTagNames);
  
    if (fetchTagsError) {
      console.error("Error fetching existing tags:", fetchTagsError);
      alert("Error fetching tags.");
      return;
    }
  
    console.log("Existing Tags:", existingTags);
  
    // Step 3: Find missing tags
    const existingTagNames = existingTags.map((tag) => tag.tag_name.toLowerCase());
    const missingTagNames = inputTagNames.filter(
      (tagName) => !existingTagNames.includes(tagName)
    );
    console.log("Missing Tag Names:", missingTagNames);
  
    // Step 4: Insert missing tags into the `tag` table
    let newTags = [];
    if (missingTagNames.length > 0) {
      console.log("Missing Tag Names:", missingTagNames);

      const { data: insertedTags, error: insertTagsError } = await supabase
        .from("tag")
        .upsert(
          missingTagNames.map((tagName) => ({ tag_name: tagName })), // Only insert tag_name
          { onConflict: "tag_name" } // Prevent duplicate tag_name errors
        )
        .select();

      if (insertTagsError) {
        console.error("Error inserting new tags:", insertTagsError);
        alert("Error adding new tags.");
        return;
      }

      console.log("Inserted or Upserted Tags:", insertedTags);
      newTags = insertedTags;
    }
      
    // Combine existing and newly inserted tags
    const allTags = [...existingTags, ...newTags];
    console.log("All Tags:", allTags);
  
    // Step 5: Map tags to the organization in the `org_tag` table
    const tagsData = allTags.map((tag) => ({
      org_id: orgId,
      tag_id: tag.tag_id,
    }));
    console.log("Tags Data for org_tag:", tagsData);
  
    if (tagsData.length > 0) {
      const { error: tagError } = await supabase.from("org_tag").insert(tagsData);
      if (tagError) {
        console.error("Error inserting tags into org_tag:", tagError);
        alert("Error linking tags: " + tagError.message);
        return;
      }
  
      console.log("Tags successfully linked to organization.");
    }
  
    alert("Organization added successfully!");
    navigate(`/orgs/${slug}`); // Navigate using the slug
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
            <label className="block mb-1 font-medium">Organization Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white"
                required
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
            <label className="block mb-1 font-medium">Category</label>
            <Select
              options={categories.map((cat) => ({
                value: cat.category_id,
                label: cat.category_name,
              }))}
              value={
                categories
                  .map((cat) => ({
                    value: cat.category_id,
                    label: cat.category_name,
                  }))
                  .find((option) => option.value === selectedCategory) || null
              }
              onChange={(selectedOption) => setSelectedCategory(selectedOption?.value || null)}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select category"
              isClearable
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white"
              placeholder="Enter tags separated by commas"
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