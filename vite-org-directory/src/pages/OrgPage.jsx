import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";

const DEFAULT_LOGO_URL = "https://placehold.co/600x400";

const OrgPage = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [tags, setTags] = useState([]); // For the tags
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organization with category name
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
            category (category_name)
          `
          )
          .eq("slug", slug)
          .single();

        if (orgError || !orgData) {
          throw new Error("Failed to fetch organization data.");
        }

        setOrg(orgData);

        // Fetch featured photos from the "featured-photos" bucket
        try {
          const { data: photoFiles, error: photoError } = await supabase.storage
            .from("featured-photos")
            .list(`${orgData.org_id}/`, { limit: 100 });

          if (photoError) {
            console.error("Failed to fetch photo list:", photoError);
          } else {
            const urls = await Promise.all(
              photoFiles.map(async (file) => {
                const { data: urlData } = await supabase.storage
                  .from("featured-photos")
                  .getPublicUrl(`${orgData.org_id}/${file.name}`);
                return urlData.publicUrl;
              })
            );
            setPhotos(urls);
          }
        } catch (err) {
          console.error("Error loading photos:", err);
        }

        // Fetch tags (from org_tag table, referencing tag table)
        const { data: tagData, error: tagError } = await supabase
          .from("org_tag")
          .select("tag_id, tag:tag_id(tag_name)") // Join with tag table
          .eq("org_id", orgData.org_id);

        if (tagError) {
          console.error("Failed to fetch tags:", tagError);
        } else {
          const tagNames = tagData.map((t) => t.tag?.tag_name).filter(Boolean);
          setTags(tagNames);
        }

        // Fetch current user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (!userError && userData?.user) {
          setUser(userData.user);

          // Fetch user role
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .single();

          if (roleError) {
            console.error("Error fetching user role:", roleError);
          } else {
            console.log("User Role:", roleData?.role);

            if (roleData?.role === "superadmin") {
              // Superadmin can edit all organizations
              setIsAdmin(true);
            } else if (roleData?.role === "admin") {
              // Admin can only edit their own organization
              const { data: adminData, error: adminError } = await supabase
                .from("admin")
                .select("org_id")
                .eq("admin_id", userData.user.id)
                .single();

              if (adminError) {
                console.error("Error fetching admin data:", adminError);
              } else if (adminData?.org_id === orgData.org_id) {
                setIsAdmin(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleEdit = () => navigate(`/edit-org/${slug}`);

  if (loading) return <Loading />;

  if (error)
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      </>
    );

  if (!org)
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64 mt-16">
          <div className="text-xl">Organization not found</div>
        </div>
      </>
    );

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-30 px-6">
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">
              <img
                src={org.org_logo || DEFAULT_LOGO_URL}
                alt="Org Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-800">
                {org.org_name}
              </h1>
              <p className="text-gray-600">
                Led by:{" "}
                <span className="font-medium">{org.president || "N/A"}</span>
              </p>
              <p className="text-gray-600">
                Category:{" "}
                <span className="font-medium">
                  {org.category?.category_name || "Uncategorized"}
                </span>
              </p>
              <p className="text-gray-600">
                Email:{" "}
                <a
                  href={`mailto:${org.org_email}`}
                  className="text-blue-600 underline"
                >
                  {org.org_email || "N/A"}
                </a>
              </p>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {org.about || "No description available."}
            </p>
          </div>

          {/* Social Media */}
          {org.socmed_links && Object.keys(org.socmed_links).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Social Media
              </h2>
              <div className="space-y-2">
                {org.socmed_links.facebook && (
                  <div className="flex items-center gap-3 text-blue-600">
                    <FaFacebook />
                    <a
                      href={org.socmed_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Facebook
                    </a>
                  </div>
                )}
                {org.socmed_links.instagram && (
                  <div className="flex items-center gap-3 text-pink-600">
                    <FaInstagram />
                    <a
                      href={org.socmed_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Instagram
                    </a>
                  </div>
                )}
                {org.socmed_links.email && (
                  <div className="flex items-center gap-3 text-yellow-600">
                    <FaEnvelope />
                    <a
                      href={`mailto:${org.socmed_links.email}`}
                      className="underline"
                    >
                      {org.socmed_links.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications */}
          {(org.socmed_links?.form || org.socmed_links?.dates) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Applications
              </h2>
              {org.socmed_links.form && (
                <p className="mb-1">
                  <span className="font-medium">Form:</span>{" "}
                  <a
                    href={org.socmed_links.form}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {org.socmed_links.form}
                  </a>
                </p>
              )}
              {org.socmed_links.dates && (
                <p>
                  <span className="font-medium">Dates:</span>{" "}
                  {org.socmed_links.dates}
                </p>
              )}
            </div>
          )}

          {/* Optional alternative fields */}
          {(org.application_form || org.application_dates) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Applications
              </h2>
              {org.application_form && (
                <p className="mb-1">
                  <span className="font-medium">Form:</span>{" "}
                  <a
                    href={org.application_form}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {org.application_form}
                  </a>
                </p>
              )}
              {org.application_dates && (
                <p>
                  <span className="font-medium">Dates:</span>{" "}
                  {org.application_dates}
                </p>
              )}
            </div>
          )}

          {/* Org Photo */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Featured Photos
            </h2>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Featured ${index + 1}`}
                    className="w-full h-40 object-cover rounded-md shadow"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-48 border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center rounded-md">
                <span className="text-gray-400">No featured photos yet.</span>
              </div>
            )}
          </div>

          {/* Admin Edit Button */}
          {isAdmin && (
            <div className="text-center pt-4">
              <button
                onClick={handleEdit}
                className="bg-maroon text-white px-6 py-2 rounded-lg hover:bg-red-800 transition"
              >
                Edit Organization
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrgPage;
