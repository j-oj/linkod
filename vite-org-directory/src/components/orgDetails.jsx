import React, { useState, useEffect } from "react";
import {
  FaFacebook,
  FaXTwitter,
  FaInstagram,
  FaLinkedin,
  FaGlobe,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
} from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import { supabase } from "@/supabaseClient";

const DEFAULT_LOGO_URL =
  "https://www.svgrepo.com/show/508699/landscape-placeholder.svg";

const OrganizationDetails = ({
  org,
  tags = [],
  category = "",
  setDetailsModal,
  setActionType,
  setSelectedItem,
  setModalOpen,
}) => {
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch featured photos from Supabase
  useEffect(() => {
    const fetchFeaturedPhotos = async () => {
      if (!org || !org.org_id) return;

      setLoading(true);
      try {
        // Fetch photos for this organization
        const { data: photoData, error } = await supabase
          .from("featured_photos")
          .select("photo_url")
          .eq("org_id", org.org_id);

        if (error) {
          console.error("Error fetching photos:", error);
          return;
        }

        if (photoData && photoData.length > 0) {
          setFeaturedPhotos(photoData.map((p) => p.photo_url));
        }
      } catch (error) {
        console.error("Failed to fetch photos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPhotos();
  }, [org]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedPhotoIndex((prev) =>
      prev === 0 ? featuredPhotos.length - 1 : prev - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedPhotoIndex((prev) =>
      prev === featuredPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 50) handlePrev(e);
    else if (deltaX < -50) handleNext(e);
    setTouchStartX(null);
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "ArrowRight") handleNext(e);
      if (e.key === "ArrowLeft") handlePrev(e);
      if (e.key === "Escape") setSelectedPhotoIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex]);

  return (
    <div className="fixed inset-0 z-50 flex shadow-xl items-center justify-center pointer-events-auto">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl relative dark:bg-gray-800 dark:text-white transition-all duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border mr-4">
              <img
                src={org.org_logo || DEFAULT_LOGO_URL}
                alt="Org Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 ">
              <h1 className="text-2xl font-bold">{org.org_name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Led by:{" "}
                <span className="font-medium">{org.president || "N/A"}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Email:{" "}
                <a
                  href={`mailto:${org.org_email}`}
                  className="text-blue-500 underline"
                >
                  {org.org_email || "N/A"}
                </a>
              </p>
            </div>
            <button
              onClick={() => setDetailsModal(false)}
              className="text-gray-400 hover:text-gray-300 hover:scale-120 p-2 -mt-2 -mr-2"
              aria-label="Close modal"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* About */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line dark:text-gray-300">
              {org.about || "No description available."}
            </p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Tags</h2>
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

          {/* Social Media - Stack vertically on all screen sizes */}
          {org.socmed_links && Object.keys(org.socmed_links).length > 0 && (
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Social Media
              </h2>
              <div className="space-y-2">
                {org.socmed_links.facebook && (
                  <div className="flex items-center gap-3 text-[#1877F2] justify-center sm:justify-start">
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
                  <div className="flex items-center gap-3 text-black dark:text-white justify-center sm:justify-start">
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
                  <div className="flex items-center gap-3 text-[#E1306C] justify-center sm:justify-start">
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
                  <div className="flex items-center gap-3 text-[#0A66C2] justify-center sm:justify-start">
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
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 justify-center sm:justify-start">
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

          {/* Featured Photos */}
          <div>
            <h2 className="text-xl font-semibold mb-2 mt-2">Featured Photos</h2>
            {loading ? (
              <div className="w-full h-40 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">
                  Loading photos...
                </div>
              </div>
            ) : featuredPhotos && featuredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredPhotos.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Featured ${index + 1}`}
                    className="w-full h-40 object-cover rounded-md shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setSelectedPhotoIndex(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="w-full h-40 border border-dashed flex items-center justify-center rounded bg-gray-50"
                  >
                    <FaImage className="text-gray-300 w-10 h-10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for photos - improved responsiveness */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-black/80 flex items-center justify-center z-[60] px-2 sm:px-0"
          onClick={() => setSelectedPhotoIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative w-full max-w-4xl mx-auto px-6 sm:px-10 md:px-12 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous button - positioned with enough spacing from image */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 md:left-6 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-red-700 z-10"
              aria-label="Previous photo"
            >
              <FaChevronLeft className="text-xs sm:text-sm md:text-base" />
            </button>

            {/* Image container with close button positioned on the image */}
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 px-8 sm:px-12 md:px-16 lg:px-20">
              <div className="relative">
                <img
                  src={featuredPhotos[selectedPhotoIndex]}
                  alt={`Featured ${selectedPhotoIndex + 1}`}
                  className="rounded-lg object-contain max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] lg:max-h-[80vh] w-auto max-w-[85%] sm:max-w-[90%] md:max-w-full"
                />

                {/* Close button positioned on the image */}
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="absolute top-2 right-2 bg-maroon text-white p-1.5 sm:p-2 rounded-full hover:bg-red-700 z-10"
                  aria-label="Close lightbox"
                >
                  <FaTimes className="text-xs sm:text-sm md:text-base" />
                </button>
              </div>
            </div>

            {/* Next button - positioned with enough spacing from image */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 bg-maroon text-white p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-red-700 z-10"
              aria-label="Next photo"
            >
              <FaChevronRight className="text-xs sm:text-sm md:text-base" />
            </button>

            {/* Remove the original close button that was outside the content */}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetails;
