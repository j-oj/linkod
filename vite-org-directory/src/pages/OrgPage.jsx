import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const DEFAULT_LOGO_URL = "https://placehold.co/600x400";

const OrgPage = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [tags, setTags] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

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

        // Fetch featured photos from featured_photos table
        const { data: photoData, error: photoError } = await supabase
          .from("featured_photos")
          .select("photo_url")
          .eq("org_id", orgData.org_id);

        if (!photoError && photoData) {
          setFeaturedPhotos(photoData.map((p) => p.photo_url));
        } else {
          console.error("Failed to fetch featured photos:", photoError);
        }

        // Fetch tags (from org_tag table, referencing tag table)
        const { data: tagData, error: tagError } = await supabase
          .from("org_tag")
          .select("tag_id, tag:tag_id(tag_name)")
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

  const handlePrev = () => {
    setSelectedPhotoIndex((prev) =>
      prev === 0 ? featuredPhotos.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) =>
      prev === featuredPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const handleEdit = () => navigate(`/edit-org/${slug}`);

  {
    selectedPhotoIndex && (
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        onClick={() => setSelectedPhotoIndex(index)}
      >
        <div className="relative max-w-3xl max-h-[90vh]">
          <img
            src={selectedPhotoIndex}
            alt="Enlarged"
            className="rounded-lg object-contain max-h-[90vh] w-full"
          />
          <button
            onClick={() => setSelectedPhotoIndex(index)}
            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-80 transition"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setSelectedPhotoIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex]);

  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (deltaX > 50) handlePrev();
    else if (deltaX < -50) handleNext();

    setTouchStartX(null);
  };

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
                {org.socmed_links.twitter && (
                  <div className="flex items-center gap-3 text-blue-400">
                    <FaTwitter />
                    <a
                      href={org.socmed_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Twitter
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
                {org.socmed_links.linkedin && (
                  <div className="flex items-center gap-3 text-blue-800">
                    <FaLinkedin />
                    <a
                      href={org.socmed_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {org.socmed_links.website && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaGlobe />
                    <a
                      href={org.socmed_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications */}
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

          {/* Featured Photos */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Featured Photos
            </h2>
            {featuredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {featuredPhotos.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Featured ${index + 1}`}
                    className="w-full h-52 object-cover rounded-md shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setSelectedPhotoIndex(index)}
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
      {/* Image Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-black/10 flex items-center justify-center z-50"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] mx-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-3 rounded-full hover:bg-red-700 transition"
            >
              <FaChevronLeft />
            </button>

            {/* Image */}
            <img
              src={featuredPhotos[selectedPhotoIndex]}
              alt={`Featured ${selectedPhotoIndex + 1}`}
              className="rounded-lg object-contain max-h-[90vh] w-full"
            />

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-3 rounded-full hover:bg-red-700 transition"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrgPage;
