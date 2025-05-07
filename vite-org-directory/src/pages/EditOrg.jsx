import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import Select from "react-select";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa6";

const EditOrg = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [categories, setCategories] = useState([]); // List of categories
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    website: "",
  });
  const [logoFile, setLogoFile] = useState(null); // State for the logo file
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organization data
        const { data: orgData, error: orgError } = await supabase
          .from("organization")
          .select(`
            org_id,
            org_name,
            org_logo,
            president,
            org_email,
            about,
            socmed_links,
            application_form,
            application_dates,
            slug,
            category
          `)
          .eq("slug", slug)
          .single();

        if (orgError || !orgData) {
          throw new Error("Failed to fetch organization data.");
        }
        setOrg(orgData);
        setSocialLinks(orgData.socmed_links || {});
        setSelectedCategory(orgData.category);

        // Fetch categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("category")
          .select("category_id, category_name");

        if (categoryError) {
          throw new Error("Failed to fetch categories.");
        }
        setCategories(categoryData);

        // Fetch current user and role
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (!userError && userData?.user) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .single();

          if (roleError) {
            console.error("Error fetching user role:", roleError);
          } else {
            if (roleData?.role === "superadmin") {
              setIsAdmin(true); // Superadmin can edit all organizations
            } else if (roleData?.role === "admin") {
              const { data: adminData, error: adminError } = await supabase
                .from("admin")
                .select("org_id")
                .eq("admin_id", userData.user.id)
                .single();

              if (adminError) {
                console.error("Error fetching admin data:", adminError);
              } else if (adminData?.org_id === orgData.org_id) {
                setIsAdmin(true); // Admin can edit their own organization
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading org:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrg((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let logo_url = org.org_logo;

      // Upload new logo if a file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `logos/${slug}-logo.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("org-logos")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error("Upload Error:", uploadError);
          alert("Failed to upload logo.");
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("org-logos")
          .getPublicUrl(filePath);

        logo_url = publicUrlData?.publicUrl;
      }

      // Update organization table
      const { error: updateError } = await supabase
        .from("organization")
        .update({
          org_name: org.org_name,
          org_logo: logo_url,
          president: org.president,
          org_email: org.org_email,
          about: org.about,
          socmed_links: socialLinks,
          application_form: org.application_form,
          application_dates: org.application_dates,
          category: selectedCategory,
        })
        .eq("org_id", org.org_id);

      if (updateError) throw updateError;

      navigate(`/orgs/${slug}`);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to update organization.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to edit this organization.</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-8 px-6">
        <h1 className="text-2xl font-bold mb-4">Edit Organization</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-gray-100 p-6 rounded shadow"
        >
          {/* Logo Display */}
          <div className="flex items-center gap-4">
            <img
              src={org.org_logo || "https://via.placeholder.com/150"}
              alt="Organization Logo"
              className="w-32 h-32 object-cover rounded-full border"
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md inline-block"
            >
              {logoFile ? "Change Logo" : "Edit Logo"}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div>
            <label className="block font-medium">Organization Name</label>
            <input
              type="text"
              name="org_name"
              value={org.org_name}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">President</label>
            <input
              type="text"
              name="president"
              value={org.president || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="org_email"
              value={org.org_email || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">About</label>
            <textarea
              name="about"
              value={org.about || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              rows={5}
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block font-medium">Category</label>
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
              onChange={(selectedOption) =>
                setSelectedCategory(selectedOption?.value || null)
              }
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select category"
              isClearable
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block font-medium">Social Media Links</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaGlobe className="text-gray-700 text-xl" />
                <input
                  type="url"
                  placeholder="Website URL"
                  value={socialLinks.website || ""}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, website: e.target.value })
                  }
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaFacebook className="text-blue-600 text-xl" />
                <input
                  type="url"
                  placeholder="Facebook URL"
                  value={socialLinks.facebook || ""}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, facebook: e.target.value })
                  }
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaTwitter className="text-gray-900 text-xl" />
                <input
                  type="url"
                  placeholder="Twitter URL"
                  value={socialLinks.twitter || ""}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, twitter: e.target.value })
                  }
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaInstagram className="text-pink-500 text-xl" />
                <input
                  type="url"
                  placeholder="Instagram URL"
                  value={socialLinks.instagram || ""}
                  onChange={(e) =>
                    setSocialLinks({
                      ...socialLinks,
                      instagram: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <FaLinkedin className="text-blue-700 text-xl" />
                <input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={socialLinks.linkedin || ""}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                  }
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium">Application Form</label>
            <input
              type="text"
              name="application_form"
              value={org.application_form || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Application Dates</label>
            <input
              type="text"
              name="application_dates"
              value={org.application_dates || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditOrg;