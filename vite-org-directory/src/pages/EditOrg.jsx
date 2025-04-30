import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";

const DEFAULT_LOGO_URL = supabase.storage
  .from("org-images")
  .getPublicUrl("org-images/default-logo.png").data.publicUrl;

const EditOrg = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    org_name: "",
    org_logo: "",
    about: "",
    president: "",
    socmed_links: {},
  });

  const [imagePreview, setImagePreview] = useState({ logo: "" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching organization:", error);
        setError("Failed to load organization.");
        return;
      }

      setFormData({
        org_name: data.org_name || "",
        org_logo: data.org_logo || "",
        about: data.about || "",
        president: data.president || "",
        socmed_links: data.socmed_links || {},
      });

      setImagePreview({
        logo: data.org_logo || "",
      });

      const { data: tagData, error: tagError } = await supabase
        .from("organization_tag")
        .select("tag_id")
        .eq("org_id", data.id);

      if (!tagError && tagData) {
        setSelectedTags(tagData.map((t) => t.tag_id));
      }

      setLoading(false);
    };

    fetchOrg();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("socmed_")) {
      const platform = name.replace("socmed_", "");
      setFormData((prev) => ({
        ...prev,
        socmed_links: {
          ...prev.socmed_links,
          [platform]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const fetchAdminName = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError.message);
        return;
      }

      const { data, error } = await supabase
        .from("admin")
        .select("admin_name")
        .eq("admin_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching admin name:", error.message);
      } else {
        setAdminName(data.admin_name);
      }
    };

    fetchAdminName();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const fileName = `org_logo_${Date.now()}_${file.name}`;
    const filePath = `org-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("org-logos")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setError("Failed to upload image.");
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("org-logos")
      .getPublicUrl(filePath);

    const logoUrl = publicData.publicUrl;

    setFormData((prev) => ({ ...prev, org_logo: logoUrl }));
    setImagePreview((prev) => ({ ...prev, logo: logoUrl }));

    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from("organization")
      .update(formData)
      .eq("slug", slug);

    if (error) {
      console.error("Update error:", error);
      setError("Update failed. Please try again.");
    } else {
      navigate(`/orgs/${slug}`);
    }

    // Inside handleSubmit (after updating the org)
    await supabase.from("organization_tag").delete().eq("org_id", data.id); // remove old tags

    const tagInserts = selectedTags.map((tagId) => ({
      org_id: data.id,
      tag_id: tagId,
    }));

    await supabase.from("organization_tag").insert(tagInserts);
  };

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from("tag")
        .select("tag_id, category");
      if (error) {
        console.error("Error fetching tags:", error.message);
        return;
      }

      setTagOptions(data); // Keep raw data for easy access to id and category
    };

    fetchTags();
  }, []);

  // Toggle tag selection
  const toggleTag = (tagId) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId]
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-8 px-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome,{" "}
          <span className="text-maroon">{adminName || "Unnamed Admin"}.</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-100 p-6 rounded-md shadow space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-18 rounded-full overflow-hidden border group">
              <img
                src={imagePreview.logo || DEFAULT_LOGO_URL}
                alt="Org Logo"
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 opacity-0 group-hover:opacity-80 rounded-full cursor-pointer shadow">
                <FiEdit2 size={18} className="text-gray-700" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="relative w-full">
              <input
                type="text"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                className="text-2xl font-bold w-full bg-transparent border-b-2 border-gray-300 focus:outline-none"
              />
              <FiEdit2 className="absolute right-2 top-2 text-gray-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side */}
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-sm">Lead by</label>
                <div className="relative">
                  <input
                    name="president"
                    type="text"
                    value={formData.president}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded pr-8"
                  />
                  <FiEdit2 className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-sm">
                  Application Form
                </label>
                <input
                  type="url"
                  name="socmed_form"
                  placeholder="https://forms.gle/..."
                  value={formData.socmed_links?.form || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="text-gray-500 text-sm">
                  Application Dates
                </label>
                <input
                  type="text"
                  name="socmed_dates"
                  placeholder="March - April"
                  value={formData.socmed_links?.dates || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="text-gray-500 text-sm">
                  Social Media Links
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaFacebook className="text-blue-600" />
                    <input
                      type="url"
                      name="socmed_facebook"
                      value={formData.socmed_links.facebook || ""}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FaInstagram className="text-pink-600" />
                    <input
                      type="url"
                      name="socmed_instagram"
                      value={formData.socmed_links.instagram || ""}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-yellow-600" />
                    <input
                      type="email"
                      name="socmed_email"
                      value={formData.socmed_links.email || ""}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="space-y-4">
              <label className="block text-gray-500 text-sm">Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tagOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag.tag_id);
                  return (
                    <button
                      key={tag.tag_id}
                      type="button"
                      onClick={() => toggleTag(tag.tag_id)}
                      className={`px-4 py-1 rounded font-semibold border ${
                        isSelected
                          ? "bg-yellow-400 text-black border-yellow-500"
                          : "bg-gray-200 text-gray-700 border-gray-300"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}
                      {tag.category}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-gray-500 text-sm mt-4">
                  About
                </label>
                <textarea
                  name="about"
                  rows={5}
                  value={formData.about}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-sm">Org Photo</label>
                <div className="w-full h-32 border border-dashed flex items-center justify-center rounded">
                  <span className="text-gray-400">Upload Placeholder</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="text-right">
            <button
              type="submit"
              disabled={uploading}
              className="bg-maroon text-white px-4 py-2 rounded hover:bg-red-800"
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditOrg;
