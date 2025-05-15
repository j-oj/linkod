import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/navbar";
import Loading from "@/components/loading";
import Select from "react-select";
import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
  FaImage,
  FaTrash,
} from "react-icons/fa6";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const AddOrg = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminName, setAdminName] = useState("Super Admin");
  const [org, setOrg] = useState({
    org_name: "",
    org_acronym: "",
    president: "",
    org_email: "",
    about: "",
    application_form: "",
    application_dates: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    website: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  // Featured photos state
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [featuredPhotoPreviews, setFeaturedPhotoPreviews] = useState([]);
  const MAX_FEATURED_PHOTOS = 3;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("category")
          .select("category_id, category_name");

        if (categoryError) throw new Error("Failed to fetch categories");
        setCategories(categoryData);

        // Get current user info (for admin name)
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .single();

          if (roleData?.role) {
            setAdminName(
              roleData.role === "superadmin" ? "Super Admin" : "Admin"
            );
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(logoFile);
    }
  }, [logoFile]);

  // Generate previews for featured photos
  useEffect(() => {
    const generatePreviews = async () => {
      const previews = [];

      for (let i = 0; i < featuredPhotos.length; i++) {
        const file = featuredPhotos[i];
        const reader = new FileReader();

        // Create a promise to wait for each FileReader to complete
        const previewPromise = new Promise((resolve) => {
          reader.onloadend = () => {
            resolve({
              file: file,
              preview: reader.result,
            });
          };
          reader.readAsDataURL(file);
        });

        const preview = await previewPromise;
        previews.push(preview);
      }

      setFeaturedPhotoPreviews(previews);
    };

    if (featuredPhotos.length > 0) {
      generatePreviews();
    } else {
      setFeaturedPhotoPreviews([]);
    }
  }, [featuredPhotos]);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleFeaturedPhotoChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const availableSlots = MAX_FEATURED_PHOTOS - featuredPhotos.length;

      if (selectedFiles.length > availableSlots) {
        // If user selected more files than available slots, take only what fits
        const filesToAdd = selectedFiles.slice(0, availableSlots);
        setFeaturedPhotos((prevPhotos) => [...prevPhotos, ...filesToAdd]);
        alert(
          `Only added ${availableSlots} photos as that's the maximum allowed. (${MAX_FEATURED_PHOTOS} total)`
        );
      } else {
        setFeaturedPhotos((prevPhotos) => [...prevPhotos, ...selectedFiles]);
      }
    }
  };

  const handleRemovePhoto = (index) => {
    setFeaturedPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    setFeaturedPhotoPreviews((prevPreviews) =>
      prevPreviews.filter((_, i) => i !== index)
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrg((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (
        !org.org_name ||
        !org.org_acronym ||
        !org.org_email ||
        !selectedCategory
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Combine start and end date into a single string
      let formattedApplicationDates = "";
      if (org.startDate && org.endDate) {
        const startDateStr = format(org.startDate, "MMMM dd, yyyy");
        const endDateStr = format(org.endDate, "MMMM dd, yyyy");
        formattedApplicationDates = `${startDateStr} to ${endDateStr}`;
      }

      // Generate slug from acronym
      const slug = org.org_acronym.toLowerCase();

      let logo_url = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `logos/${slug}-logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("org-logos")
          .upload(filePath, logoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("org-logos")
          .getPublicUrl(filePath);

        if (urlData && urlData.publicUrl) {
          logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      // Upload featured photos
      const uploadedPhotoURLs = [];

      for (let i = 0; i < featuredPhotos.length; i++) {
        const photo = featuredPhotos[i];
        const fileExt = photo.name.split(".").pop();
        // Create filename with org slug and photo number
        const fileName = `featured/${slug}-featured-${i + 1}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("featured-photos")
          .upload(fileName, photo, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(
            `Featured photo upload failed: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("featured-photos")
          .getPublicUrl(fileName);

        uploadedPhotoURLs.push(publicUrlData.publicUrl);
      }

      // Insert organization
      const { data, error } = await supabase
        .from("organization")
        .insert([
          {
            org_name: org.org_name,
            org_logo: logo_url,
            president: org.president,
            org_email: org.org_email,
            about: org.about,
            socmed_links: socialLinks,
            application_form: org.application_form,
            application_dates: formattedApplicationDates,
            slug: slug,
            category: selectedCategory,
          },
        ])
        .select();

      if (error) {
        throw new Error(`Failed to add organization: ${error.message}`);
      }

      const orgId = data[0].org_id;

      // After inserting the organization, create a separate table entry for each photo
      if (uploadedPhotoURLs.length > 0) {
        const photoEntries = uploadedPhotoURLs.map((url) => ({
          org_id: orgId,
          photo_url: url,
        }));

        const { error: photoError } = await supabase
          .from("featured_photos") // Use your existing featured_photos table
          .insert(photoEntries);

        if (photoError) {
          throw new Error(`Error adding photos: ${photoError.message}`);
        }
      }

      // Process tags
      if (tagInput) {
        // Parse tags
        const inputTagNames = tagInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);

        // Check existing tags
        const { data: existingTags, error: fetchTagsError } = await supabase
          .from("tag")
          .select("*")
          .in("tag_name", inputTagNames);

        if (fetchTagsError) {
          throw new Error(`Error fetching tags: ${fetchTagsError.message}`);
        }

        // Find missing tags
        const existingTagNames = existingTags.map((tag) =>
          tag.tag_name.toLowerCase()
        );
        const missingTagNames = inputTagNames.filter(
          (tagName) => !existingTagNames.includes(tagName)
        );

        // Insert missing tags
        let newTags = [];
        if (missingTagNames.length > 0) {
          const { data: insertedTags, error: insertTagsError } = await supabase
            .from("tag")
            .upsert(
              missingTagNames.map((tagName) => ({ tag_name: tagName })),
              { onConflict: "tag_name" }
            )
            .select();

          if (insertTagsError) {
            throw new Error(
              `Error adding new tags: ${insertTagsError.message}`
            );
          }

          newTags = insertedTags;
        }

        // Combine tags and link to organization
        const allTags = [...existingTags, ...newTags];
        const tagsData = allTags.map((tag) => ({
          org_id: orgId,
          tag_id: tag.tag_id,
        }));

        if (tagsData.length > 0) {
          const { error: tagError } = await supabase
            .from("org_tag")
            .insert(tagsData);

          if (tagError) {
            throw new Error(`Error linking tags: ${tagError.message}`);
          }
        }
      }

      // Success! Navigate to the org page
      navigate(`/orgs/${slug}`);
    } catch (err) {
      console.error("Error during submission:", err);
      alert(`Error: ${err.message || "Unknown error"}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-30 px-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gray-50 px-8 py-6 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold text-gray-800">
                Add New Organization
              </h1>
              <div className="text-sm text-gray-600">Hello, {adminName}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="flex flex-col md:flex-row -mx-4">
              {/* Left Column - Profile Info */}
              <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={logoPreview || "https://placehold.co/150"}
                      alt="Organization Logo"
                      className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-md"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="absolute bottom-0 right-0 bg-maroon hover:bg-red-800 text-white p-2 rounded-full shadow cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-center">
                    {org.org_name || "New Organization"}
                  </h2>
                  <p className="text-gray-500 text-center">
                    {org.president || "President Name"}
                  </p>

                  {/* About section */}
                  <div className="mt-8 w-full">
                    <label className="block font-medium text-gray-700 mb-2">
                      About
                    </label>
                    <textarea
                      name="about"
                      value={org.about || ""}
                      onChange={handleChange}
                      rows={5}
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      placeholder="Tell us about your organization..."
                    />
                  </div>

                  {/* Tags field */}
                  <div className="mt-6 w-full">
                    <label className="block font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Settings */}
              <div className="w-full md:w-2/3 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info Fields */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="org_name"
                      value={org.org_name || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Organization Acronym{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="org_acronym"
                      value={org.org_acronym || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      placeholder="e.g. SPARCS or AMPLI"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      President
                    </label>
                    <input
                      type="text"
                      name="president"
                      value={org.president || ""}
                      onChange={handleChange}
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="org_email"
                      value={org.org_email || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
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
                          .find(
                            (option) => option.value === selectedCategory
                          ) || null
                      }
                      onChange={(selectedOption) =>
                        setSelectedCategory(selectedOption?.value || null)
                      }
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Select category"
                      required
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#e2e8f0",
                          borderRadius: "0.5rem",
                          padding: "2px",
                          boxShadow: "none",
                          transition: "border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#cbd5e0",
                          },
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "maroon"
                            : state.isFocused
                            ? "#ffdbdb"
                            : "white",
                          color: state.isSelected
                            ? "white"
                            : state.isFocused
                            ? "#7f1d1d"
                            : "#374151",
                          cursor: "pointer",
                          transition:
                            "background-color 0.2s ease, color 0.2s ease",
                          "&:active": {
                            backgroundColor: "maroon",
                            color: "white",
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          marginTop: "4px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }),
                        menuList: (base) => ({
                          ...base,
                          padding: "0",
                        }),
                      }}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Application Form URL
                    </label>
                    <input
                      type="text"
                      name="application_form"
                      value={org.application_form || ""}
                      onChange={handleChange}
                      className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      Application Dates
                    </label>
                    <div className="flex gap-2">
                      <DatePicker
                        calendarClassName="my-datepicker"
                        selected={org.startDate}
                        onChange={(date) =>
                          handleChange({
                            target: { name: "startDate", value: date },
                          })
                        }
                        selectsStart
                        startDate={org.startDate}
                        endDate={org.endDate}
                        placeholderText="Start date"
                        className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      />
                      <DatePicker
                        calendarClassName="my-datepicker"
                        selected={org.endDate}
                        onChange={(date) =>
                          handleChange({
                            target: { name: "endDate", value: date },
                          })
                        }
                        selectsEnd
                        startDate={org.startDate}
                        endDate={org.endDate}
                        minDate={org.startDate}
                        placeholderText="End date"
                        className="w-full text-gray-700 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Featured Photos Section */}
                <div className="mt-8">
                  <h3 className="font-medium text-gray-800 mb-4">
                    Featured Photos{" "}
                    <span className="text-sm text-gray-500">
                      ({featuredPhotos.length}/{MAX_FEATURED_PHOTOS} max)
                    </span>
                  </h3>

                  {/* Photo Preview Area */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {featuredPhotoPreviews.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.preview}
                          alt={`Featured photo ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    ))}

                    {featuredPhotos.length < MAX_FEATURED_PHOTOS && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:border-red-300 transition">
                        <FaImage className="text-gray-400 text-2xl mb-2" />
                        <span className="text-sm text-gray-500">
                          Add Photos
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFeaturedPhotoChange}
                          className="hidden"
                          multiple
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="mt-4">
                  <h3 className="font-medium text-gray-800 mb-4">
                    Social Media Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: <FaFacebook className="text-blue-600" />,
                        name: "facebook",
                        placeholder: "Facebook URL",
                      },
                      {
                        icon: <FaXTwitter className="text-grey-700" />,
                        name: "twitter",
                        placeholder: "X URL",
                      },
                      {
                        icon: <FaInstagram className="text-pink-500" />,
                        name: "instagram",
                        placeholder: "Instagram URL",
                      },
                      {
                        icon: <FaLinkedin className="text-blue-800" />,
                        name: "linkedin",
                        placeholder: "LinkedIn URL",
                      },
                      {
                        icon: <FaGlobe className="text-gray-600" />,
                        name: "website",
                        placeholder: "Website URL",
                      },
                    ].map(({ icon, name, placeholder }) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <span className="flex-shrink-0">{icon}</span>
                        <input
                          type="url"
                          placeholder={placeholder}
                          value={socialLinks[name] || ""}
                          onChange={(e) =>
                            setSocialLinks({
                              ...socialLinks,
                              [name]: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/`)}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-2 bg-maroon hover:bg-red-800 text-white font-medium rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Creating..." : "Create Organization"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddOrg;
