import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/navbar";
import Loading from "@/components/loading";
import ActionButton from "@/components/ui/actionbutton";
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
import { format } from "date-fns";

const EditOrg = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    website: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [orgTags, setOrgTags] = useState([]);
  const navigate = useNavigate();
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [featuredPhotoPreviews, setFeaturedPhotoPreviews] = useState([]);
  const MAX_FEATURED_PHOTOS = 3;
  const [userEmails, setUserEmails] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null); 
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});

  // Component for displaying field-specific error messages
  const ErrorMessage = ({ message }) => {
    return message ? (
      <div className="text-red-500 text-xs mt-1 animate-pulse">{message}</div>
    ) : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        const { data: orgData, error: orgError } = await supabase
          .from("organization")
          .select(
            `
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
          `
          )
          .eq("slug", slug)
          .single();

        if (orgError || !orgData) throw new Error("Failed to fetch org");

        setOrg(orgData);
        setLogoPreview(orgData.org_logo);
        setSocialLinks(orgData.socmed_links || {});
        setSelectedCategory(orgData.category);

        if (orgData.application_dates) {
          const dates = orgData.application_dates.split(" to ");
          if (dates.length === 2) {
            setOrg((prev) => ({
              ...prev,
              startDate: new Date(dates[0]),
              endDate: new Date(dates[1]),
            }));
          }
        }

        // Fetch tags associated with this organization
        const { data: tagData, error: tagError } = await supabase
          .from("org_tag")
          .select(
            `
            tag:tag_id(
              tag_id,
              tag_name
            )
          `
          )
          .eq("org_id", orgData.org_id);

        if (!tagError && tagData) {
          const tags = tagData.map((item) => item.tag.tag_name);
          setOrgTags(tags);
          setTagInput(tags.join(", "));
        }

        const { data: photoData, error: photoError } = await supabase
          .from("featured_photos")
          .select("photo_url")
          .eq("org_id", orgData.org_id);

        if (!photoError && photoData) {
          setExistingPhotos(photoData.map((p) => p.photo_url));
        }

        const { data: categoryData, error: categoryError } = await supabase
          .from("category")
          .select("category_id, category_name");

        if (categoryError) throw new Error("Failed to fetch categories");

        setCategories(categoryData);

        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (!userError && userData?.user) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .single();

          if (!roleError) {
            if (roleData?.role === "superadmin") {
              setIsAdmin(true);
              setAdminName("Super Admin");
            } else if (roleData?.role === "admin") {
              const { data: adminData } = await supabase
                .from("admin")
                .select("org_id, admin_name")
                .eq("admin_id", userId)
                .maybeSingle();

              if (adminData?.org_id === orgData.org_id) {
                setIsAdmin(true);
                setAdminName(adminData.admin_name || "Admin");
              }
            }
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("admin_name, admin_email")
          .eq("org_id", org?.org_id)
          .single();
  
        if (adminError) {
          console.error("Error fetching current admin:", adminError.message);
          return;
        }
  
        setCurrentAdmin(adminData); // Save the current admin's details
      } catch (err) {
        console.error("Error fetching current admin:", err);
      }
    };
  
    if (org?.org_id) {
      fetchCurrentAdmin();
    }
  }, [org?.org_id]);

  useEffect(() => {
    const fetchUserEmails = async () => {
      try {
        // Fetch emails from auth_user_view
        const { data, error } = await supabase
          .from("auth_user_view")
          .select("email");
  
        if (error) {
          console.error("Error fetching user emails:", error.message);
          return;
        }
  
        // Map data to react-select format
        const formattedEmails = data.map((user) => ({
          value: user.email,
          label: user.email,
        }));
  
        setUserEmails(formattedEmails);
      } catch (err) {
        console.error("Error fetching user emails:", err);
      }
    };
  
    fetchUserEmails();
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

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrg((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeaturedPhotosChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    // Calculate how many more photos we can add based on the maximum allowed
    const remainingSlots =
      MAX_FEATURED_PHOTOS - existingPhotos.length - photoPreviews.length;

    // Take only as many files as we have remaining slots
    const files = Array.from(e.target.files).slice(0, remainingSlots);

    // If we already have some selected files, combine them
    setNewPhotos((prev) => [...prev, ...files]);

    // Create previews for the newly selected files
    const previews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...previews]);

    // Alert user if some files were ignored due to the limit
    if (e.target.files.length > remainingSlots) {
      alert(
        `Only ${remainingSlots} more photo${
          remainingSlots !== 1 ? "s" : ""
        } can be added. The first ${remainingSlots} photo${
          remainingSlots !== 1 ? "s were" : " was"
        } selected.`
      );
    }
  };

  // Also update the photo removal functionality to properly handle the arrays:

  const removeNewPhoto = (index) => {
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(photoPreviews[index]);

    // Remove the photo from both arrays
    const newPreviews = [...photoPreviews];
    const newPhotosArray = [...newPhotos];

    newPreviews.splice(index, 1);
    newPhotosArray.splice(index, 1);

    setPhotoPreviews(newPreviews);
    setNewPhotos(newPhotosArray);
  };

  const handleDeletePhoto = async (url) => {
    try {
      // Remove from storage
      const filePath = url.split(
        "/storage/v1/object/public/featured-photos/"
      )[1];
      await supabase.storage.from("featured-photos").remove([filePath]);

      // Remove from DB
      await supabase
        .from("featured_photos")
        .delete()
        .eq("org_id", org.org_id)
        .eq("photo_url", url);

      setExistingPhotos(existingPhotos.filter((p) => p !== url));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete image");
    }
  };

  // Update the handleSubmit function to fix the file uploading issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("Submitting org update...");
      let logo_url = org.org_logo; // Keep the existing logo URL by default

      // Only attempt image upload if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `logos/${slug}-logo.${fileExt}`;

        // Delete existing file (if any)
        await supabase.storage.from("org-logos").remove([filePath]);

        // Upload new logo
        const { data, error } = await supabase.storage
          .from("org-logos")
          .upload(filePath, logoFile, {
            cacheControl: "3600",
            upsert: false, // no need to upsert since we delete first
          });

        if (error) {
          console.error("Upload error details:", error);
          throw new Error(`Image upload failed: ${error.message}`);
        }

        // Get public URL with cache-busting query
        const { data: urlData } = supabase.storage
          .from("org-logos")
          .getPublicUrl(filePath);

        if (urlData && urlData.publicUrl) {
          logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
        } else {
          throw new Error("Failed to get public URL for uploaded image");
        }
      }

      // Combine start and end date into a single string
      let formattedApplicationDates = "";
      if (org.startDate && org.endDate) {
        const startDateStr = format(org.startDate, "MMMM dd, yyyy");
        const endDateStr = format(org.endDate, "MMMM dd, yyyy");
        formattedApplicationDates = `${startDateStr} to ${endDateStr}`;
      }

      // Upload new featured photos with sequential numbering
      if (newPhotos.length > 0) {
        // Get current count of existing photos to determine starting index
        const startingPhotoIndex = existingPhotos.length + 1;

        // Process each new photo
        for (let i = 0; i < newPhotos.length; i++) {
          const photo = newPhotos[i];
          const ext = photo.name.split(".").pop();
          // Simple sequential numbering (1, 2, 3, etc.)
          const photoNumber = startingPhotoIndex + i;
          const filename = `${slug}-featured-${photoNumber}.${ext}`;
          const path = `featured/${filename}`;

          // Use upsert: true to allow replacing existing files if they have the same name
          const { error: uploadError } = await supabase.storage
            .from("featured-photos")
            .upload(path, photo, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            throw new Error(
              `Featured photo upload failed: ${uploadError.message}`
            );
          }

          const { data: publicData } = supabase.storage
            .from("featured-photos")
            .getPublicUrl(path);

          const publicUrl = publicData?.publicUrl;
          if (publicUrl) {
            // Insert into DB
            const { error: insertError } = await supabase
              .from("featured_photos")
              .insert({ org_id: org.org_id, photo_url: publicUrl });

            if (insertError) {
              throw new Error(
                `Failed to save photo URL: ${insertError.message}`
              );
            }
          }
        }
      }

      // Update organization details in the database
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
          application_dates: formattedApplicationDates,
          category: selectedCategory,
        })
        .eq("org_id", org.org_id);

      if (updateError) {
        console.error("Database update failed:", updateError);
        throw new Error(
          `Failed to update organization details: ${updateError.message}`
        );
      }
      // Process tags more efficiently
      const newTagNames = tagInput
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      // Find tags to add and remove
      const tagsToAdd = newTagNames.filter((tag) => !orgTags.includes(tag));
      const tagsToRemove = orgTags.filter((tag) => !newTagNames.includes(tag));

      if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
        console.log("Tag changes detected, processing updates...");

        if (tagsToRemove.length > 0) {
          // Find tag IDs to remove
          const { data: tagsToRemoveData, error: findRemoveError } =
            await supabase
              .from("tag")
              .select("tag_id")
              .in("tag_name", tagsToRemove);

          if (findRemoveError) {
            throw new Error(
              `Error finding tags to remove: ${findRemoveError.message}`
            );
          }

          const tagIdsToRemove = tagsToRemoveData.map((tag) => tag.tag_id);

          if (tagIdsToRemove.length > 0) {
            console.log("Removing tag IDs:", tagIdsToRemove);

            const { error: deleteTagsError } = await supabase
              .from("org_tag")
              .delete()
              .eq("org_id", org.org_id)
              .in("tag_id", tagIdsToRemove);

            if (deleteTagsError) {
              throw new Error(
                `Error removing tags: ${deleteTagsError.message}`
              );
            }
          }

          console.log("Org ID:", org.org_id);
          console.log("Tags to remove:", tagsToRemove);
          console.log("Tag IDs to remove:", tagIdsToRemove);
        }

        if (tagsToAdd.length > 0) {
          // Check which tags already exist
          const { data: existingTags, error: fetchTagsError } = await supabase
            .from("tag")
            .select("tag_id, tag_name")
            .in("tag_name", tagsToAdd);

          if (fetchTagsError) {
            throw new Error(
              `Error fetching existing tags: ${fetchTagsError.message}`
            );
          }

          // Find which tags need to be created
          const existingTagNames = existingTags.map((tag) =>
            tag.tag_name.toLowerCase()
          );
          const tagsToCreate = tagsToAdd.filter(
            (tag) => !existingTagNames.includes(tag)
          );

          // Create new tags if needed
          let newlyCreatedTags = [];
          if (tagsToCreate.length > 0) {
            const { data: insertedTags, error: insertTagsError } =
              await supabase
                .from("tag")
                .upsert(
                  tagsToCreate.map((tagName) => ({ tag_name: tagName })),
                  { onConflict: "tag_name" }
                )
                .select();

            if (insertTagsError) {
              throw new Error(
                `Error creating new tags: ${insertTagsError.message}`
              );
            }

            newlyCreatedTags = insertedTags || [];
          }

          // Combine existing and newly created tags that need to be linked
          const allTagsToLink = [...existingTags, ...newlyCreatedTags];

          // Create links between org and tags
          const orgTagLinks = allTagsToLink.map((tag) => ({
            org_id: org.org_id,
            tag_id: tag.tag_id,
          }));

          if (orgTagLinks.length > 0) {
            const { error: linkTagsError } = await supabase
              .from("org_tag")
              .upsert(orgTagLinks, { onConflict: "org_id,tag_id" });

            if (linkTagsError) {
              throw new Error(
                `Error linking tags to organization: ${linkTagsError.message}`
              );
            }
          }
        }

        // Update local state to reflect new tags
        setOrgTags(newTagNames);
      }

      // Success! Navigate back to the org page
      navigate(`/orgs/${slug}`);
    } catch (err) {
      console.error("Error during update:", err);
      alert(`Error: ${err.message || "Unknown error"}. Please try again.`);
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
      <div className="max-w-6xl mx-auto mt-30 mb-10 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 border-b dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Organization Profile
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Hello, {adminName}
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              // Track form validity
              let isValid = true;

              // Track error messages
              const errors = {};

              // Check required fields
              const form = e.target;
              const inputs = form.querySelectorAll(
                "input[required],textarea[required]"
              );
              inputs.forEach((input) => {
                if (!input.value.trim()) {
                  input.classList.add("border-red-500");
                  isValid = false;
                  errors[input.name] = `${input.name.replace(
                    /_/g,
                    " "
                  )} is required`;
                } else {
                  input.classList.remove("border-red-500");
                }
              });

              // Check category selection separately
              if (!selectedCategory) {
                const categoryElement =
                  document.querySelector(".select__control");
                if (categoryElement) {
                  categoryElement.classList.add("border-red-500");
                  setTimeout(() => {
                    categoryElement.classList.remove("border-red-500");
                  }, 1000);
                }
                isValid = false;
                errors.category = "Category is required";
              }

              // Set field errors
              setFieldErrors(errors);

              // Scroll to first error if any
              if (!isValid) {
                // Find first error element
                const firstErrorName = Object.keys(errors)[0];
                const firstErrorElement =
                  document.querySelector(`[name="${firstErrorName}"]`) ||
                  (firstErrorName === "category"
                    ? document.querySelector(".select__control")
                    : null);

                if (firstErrorElement) {
                  // Scroll to the element with offset for header
                  firstErrorElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  // Focus the element
                  setTimeout(() => {
                    firstErrorElement.focus();
                  }, 500);
                }

                // Show toast with error message
                toast.error("Please fill in all required fields");
              }

              // Only submit if all validations pass
              if (isValid) {
                handleSubmit(e);
              }
            }}
            className="p-8"
            noValidate
          >
            <div className="flex flex-col md:flex-row -mx-4">
              {/* Left Column - Profile Logo (only show on mobile and larger screens) */}
              <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={logoPreview || "https://placehold.co/150"}
                      alt="Organization Logo"
                      className="w-32 h-32 object-cover rounded-full border-4 border-white dark:border-gray-700 shadow-md"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="absolute bottom-0 right-0 bg-maroon hover:bg-red-800 text-white p-2 rounded-full shadow cursor-pointer hover:scale-105 transition-transform duration-200"
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

                  <h2 className="mt-4 text-xl font-semibold text-center dark:text-white">
                    {org.org_name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {org.president}
                  </p>
                </div>

                {/* Dropdown for User Emails */}
                {adminName === "Super Admin" && (
                  <div className="mt-6 w-full">
                  {currentAdmin ? (
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Current Admin</label>
                      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{currentAdmin.admin_name}</p>
                          <p className="text-sm text-gray-500">{currentAdmin.admin_email}</p>
                        </div>
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to remove this admin?")) {
                              try {
                                const { error } = await supabase
                                  .from("admin")
                                  .delete()
                                  .eq("org_id", org.org_id);
                
                                if (error) {
                                  throw new Error(error.message);
                                }
                
                                alert("Admin removed successfully!");
                                setCurrentAdmin(null); // Clear the current admin display
                              } catch (err) {
                                console.error("Error removing admin:", err);
                                alert("Failed to remove admin. Please try again.");
                              }
                            }
                          }}
                        >
                          Remove Admin
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">No admin assigned to this organization.</p>
                  )}
                
                  <label className="block font-medium text-gray-700 mt-6 mb-2">Add Admin</label>
                  <Select
                    options={userEmails}
                    value={
                      userEmails.find((option) => option.value === selectedUserEmail) || null
                    }
                    onChange={(selectedOption) =>
                      setSelectedUserEmail(selectedOption?.value || null)
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select a user email"
                    isClearable
                  />
                  <div className="mt-4">
                    <button
                      className="px-4 py-2 bg-maroon text-white rounded hover:bg-red-700"
                      onClick={async () => {
                        if (!selectedUserEmail) {
                          alert("Please select a user to add as admin.");
                          return;
                        }
                
                        try {
                          // Fetch user details from the view
                          const { data: userData, error: userError } = await supabase
                            .from("auth_user_view")
                            .select("id, display_name, created_at")
                            .eq("email", selectedUserEmail)
                            .single();
                
                          if (userError || !userData) {
                            throw new Error(
                              userError?.message || "Failed to retrieve user details."
                            );
                          }
                
                          const {
                            id: admin_id,
                            display_name: admin_name,
                            created_at: admin_created_at,
                          } = userData;
                
                          // Insert admin details into the admin table
                          const { error: insertError } = await supabase.from("admin").insert([
                            {
                              admin_id, // User ID from auth_user_view
                              admin_email: selectedUserEmail, // Selected email
                              admin_name, // Display name from auth_user_view
                              org_id: org.org_id, // Organization ID from the current page
                              admin_created_at, // Created at from auth_user_view
                            },
                          ]);
                
                          if (insertError) {
                            throw new Error(insertError.message || "Failed to add admin.");
                          }
                
                          alert("Admin added successfully!");
                          setSelectedUserEmail(null); // Clear the dropdown selection
                        } catch (error) {
                          console.error("Error adding admin:", error);
                          alert(`Error: ${error.message}`);
                        }
                      }}
                    >
                      Add Admin
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
                      onClick={async () => {
                        if (!selectedUserEmail) {
                          alert("Please select a user to replace the current admin.");
                          return;
                        }

                        if (
                          !window.confirm(
                            "This will replace the current admin with the selected user. Are you sure?"
                          )
                        ) {
                          return;
                        }

                        try {
                          // Fetch user details from the view
                          const { data: userData, error: userError } = await supabase
                            .from("auth_user_view")
                            .select("id, display_name, created_at")
                            .eq("email", selectedUserEmail)
                            .single();
                
                          if (userError || !userData) {
                            throw new Error(
                              userError?.message || "Failed to retrieve user details."
                            );
                          }

                          const {
                            id: admin_id,
                            display_name: admin_name,
                            created_at: admin_created_at,
                          } = userData;

                          // Replace the admin in the admin table
                          const { error: replaceError } = await supabase
                          .from("admin")
                          .upsert([
                            {
                              admin_id, // New admin ID
                              admin_email: selectedUserEmail, // New admin email
                              admin_name, // New admin name
                              org_id: org.org_id, // Organization ID
                              admin_created_at, // New admin created_at
                            },
                          ]);

                          if (replaceError) {
                            throw new Error(replaceError.message || "Failed to replace admin.");
                          }
                
                          alert("Admin replaced successfully!");
                          setCurrentAdmin({
                            admin_name,
                            admin_email: selectedUserEmail,
                          }); // Update the current admin display
                          setSelectedUserEmail(null); // Clear the dropdown selection
                        } catch (error) {
                          console.error("Error replacing admin:", error);
                          alert(`Error: ${error.message}`);
                        }
                      }}
                    >
                      Replace Admin
                    </button>

                  </div>
                </div>
                )}
              </div>

              {/* Right Column - Settings */}
              <div className="w-full md:w-2/3 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info Fields */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="org_name"
                      value={org.org_name || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-700 focus:border-red-500 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <ErrorMessage message={fieldErrors.org_name} />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      President <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="president"
                      value={org.president || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-700 focus:border-red-500 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <ErrorMessage message={fieldErrors.president} />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="org_email"
                      value={org.org_email || ""}
                      onChange={handleChange}
                      required
                      className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-700 focus:border-red-500 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <ErrorMessage message={fieldErrors.org_email} />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      classNamePrefix="select"
                      placeholder="Select category"
                      isClearable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          backgroundColor: "var(--input-bg)",
                          borderColor: state.isFocused
                            ? "#ef4444"
                            : "var(--border-color)",
                          color: "var(--text-color)",
                          borderRadius: "0.6rem",
                          boxShadow: "none",
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.875rem",
                          transition: "all 0.2s ease-in-out",
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "var(--text-color)",
                        }),
                        input: (base) => ({
                          ...base,
                          color: "var(--text-color)",
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: "var(--dropdown-bg)",
                          color: "var(--text-color)",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "#7f1d1d"
                            : state.isFocused
                            ? "#b91c1c"
                            : "var(--dropdown-bg)",
                          color:
                            state.isSelected || state.isFocused
                              ? "white"
                              : "var(--text-color)",
                          cursor: "pointer",
                          padding: "0.5rem 1rem",
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: "var(--placeholder-color)",
                        }),
                      }}
                    />
                    <ErrorMessage message={fieldErrors.category} />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Application Form URL
                    </label>
                    <input
                      type="text"
                      name="application_form"
                      value={org.application_form || ""}
                      onChange={handleChange}
                      className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Application Date Range
                    </label>
                    <div className="flex gap-2">
                      <DatePicker
                        calendarClassName="my-datepicker dark:bg-gray-800 dark:text-white"
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
                        className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      />
                      <DatePicker
                        calendarClassName="my-datepicker dark:bg-gray-800 dark:text-white"
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
                        className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* About and Tags Section - Moved from left column to right column for smaller screens */}
                <div className="mt-6 w-full">
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                    About
                  </label>
                  <textarea
                    name="about"
                    value={org.about || ""}
                    onChange={handleChange}
                    rows={5}
                    className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-700 focus:border-red-500 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Tell us about your organization..."
                  />
                </div>

                {/* Tags field */}
                <div className="mt-6 w-full">
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-700 focus:border-red-500 transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Enter tags separated by commas"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Each tag is separated by a comma
                  </p>
                </div>

                {/* Social Media Section */}
                <div className="mt-8">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
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
                        icon: (
                          <FaXTwitter className="text-grey-700 dark:text-gray-400" />
                        ),
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
                        icon: (
                          <FaGlobe className="text-gray-600 dark:text-gray-400" />
                        ),
                        name: "website",
                        placeholder: "Website URL",
                      },
                    ].map(({ icon, name, placeholder }) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
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
                          className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Featured Photos Section */}
                  <div className="mt-8">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
                      Featured Photos{" "}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({existingPhotos.length + photoPreviews.length}/
                        {MAX_FEATURED_PHOTOS} max)
                      </span>
                    </h3>

                    {/* Photo Preview Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Existing Photos */}
                      {existingPhotos.map((url, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`Featured photo ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(url)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}

                      {/* New Photo Previews */}
                      {photoPreviews.map((url, index) => (
                        <div key={`preview-${index}`} className="relative">
                          <img
                            src={url}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPreviews = [...photoPreviews];
                              newPreviews.splice(index, 1);
                              setPhotoPreviews(newPreviews);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}

                      {/* Add Photo Placeholder */}
                      {existingPhotos.length + photoPreviews.length <
                        MAX_FEATURED_PHOTOS && (
                        <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:border-red-300 dark:hover:border-red-700 transition">
                          <FaImage className="text-gray-400 dark:text-gray-500 text-2xl mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Add Photos
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFeaturedPhotosChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/orgs/${slug}`)}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-2 bg-maroon hover:bg-red-800 text-white font-medium rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <ActionButton type="top" />
      </div>
    </>
  );
};

export default EditOrg;
