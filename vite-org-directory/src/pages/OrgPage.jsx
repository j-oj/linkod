import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/navbar.jsx";
import Loading from "@/components/loading.jsx";
import ActionButton from "@/components/ui/actionbutton";
import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

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
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY <= 10);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch organization
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

        if (orgError || !orgData)
          throw new Error("Failed to fetch organization data.");

        // ✅ Ensure socmed_links is parsed properly (in case it's returned as a string)
        if (orgData.socmed_links && typeof orgData.socmed_links === "string") {
          try {
            orgData.socmed_links = JSON.parse(orgData.socmed_links);
          } catch {
            orgData.socmed_links = {};
          }
        }

        setOrg(orgData);
        console.log("SOCMED LINKS:", orgData.socmed_links);

        // Fetch featured photos
        const { data: photoData } = await supabase
          .from("featured_photos")
          .select("photo_url")
          .eq("org_id", orgData.org_id);

        if (photoData) {
          setFeaturedPhotos(photoData.map((p) => p.photo_url));
        }

        // Fetch tags
        const { data: tagData } = await supabase
          .from("org_tag")
          .select("tag_id, tag:tag_id(tag_name)")
          .eq("org_id", orgData.org_id);

        if (tagData) {
          const tagNames = tagData.map((t) => t.tag?.tag_name).filter(Boolean);
          setTags(tagNames);
        }

        // Fetch current user
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user) {
          setUser(userData.user);

          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .single();

          if (roleData?.role === "superadmin") {
            setIsAdmin(true);
          } else if (roleData?.role === "admin") {
            const { data: adminData } = await supabase
              .from("admin")
              .select("org_id")
              .eq("admin_id", userData.user.id)
              .single();

            if (adminData?.org_id === orgData.org_id) {
              setIsAdmin(true);
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
    const deltaX = e.changedTouches[0].clientX - touchStartX;
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
      <div className="max-w-5xl mx-auto mt-30 px-4 sm:px-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6 sm:space-y-8">
          {/* Header - Responsive layout with flex-col on small screens */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-32 h-32 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-gray-300">
              <img
                src={org.org_logo || DEFAULT_LOGO_URL}
                alt="Org Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
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
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium"
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
                  <div className="flex items-center gap-3 text-[#1877F2]">
                    <FaFacebook />
                    <a
                      href={org.socmed_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:opacity-80 transition truncate"
                    >
                      {org.socmed_links.facebook}
                    </a>
                  </div>
                )}
                {org.socmed_links.twitter && (
                  <div className="flex items-center gap-3 text-black">
                    <FaXTwitter />
                    <a
                      href={org.socmed_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:opacity-80 transition truncate"
                    >
                      {org.socmed_links.twitter}
                    </a>
                  </div>
                )}
                {org.socmed_links.instagram && (
                  <div className="flex items-center gap-3 text-[#E1306C]">
                    <FaInstagram />
                    <a
                      href={org.socmed_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:opacity-80 transition truncate"
                    >
                      {org.socmed_links.instagram}
                    </a>
                  </div>
                )}
                {org.socmed_links.linkedin && (
                  <div className="flex items-center gap-3 text-[#0A66C2]">
                    <FaLinkedin />
                    <a
                      href={org.socmed_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:opacity-80 transition truncate"
                    >
                      {org.socmed_links.linkedin}
                    </a>
                  </div>
                )}
                {org.socmed_links.website && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaGlobe />
                    <a
                      href={org.socmed_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:opacity-80 transition truncate"
                    >
                      {org.socmed_links.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Application Info */}
          {(org.application_form || org.application_dates) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Applications
              </h2>
              {org.application_form && (
                <p className="break-words">
                  <span className="font-medium">Form:</span>{" "}
                  <a
                    href={org.application_form}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    className="w-full h-40 sm:h-52 object-cover rounded-md shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setSelectedPhotoIndex(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-36 sm:h-48 border-2 border-dashed border-gray-300 flex justify-center items-center rounded-md">
                <span className="text-gray-400">No featured photos yet.</span>
              </div>
            )}
          </div>

          {/* Admin Edit */}
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

      {/* Lightbox for photos */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-black/10 flex items-center justify-center z-50"
          onClick={() => setSelectedPhotoIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] mx-4 flex items-center justify-center px-4 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handlePrev}
              className="absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-2 sm:p-3 rounded-full hover:bg-red-700 z-10"
            >
              <FaChevronLeft />
            </button>

            <img
              src={featuredPhotos[selectedPhotoIndex]}
              alt={`Featured ${selectedPhotoIndex + 1}`}
              className="rounded-lg object-contain max-h-[90vh] w-full"
            />

            <button
              onClick={handleNext}
              className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-2 sm:p-3 rounded-full hover:bg-red-700 z-10"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {atTop ? <ActionButton type="home" /> : <ActionButton type="top" />}
    </>
  );
};

export default OrgPage;
