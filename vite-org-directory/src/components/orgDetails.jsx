import React from "react";
import { FaFacebook, FaInstagram, FaEnvelope, FaTimes } from "react-icons/fa";

const DEFAULT_LOGO_URL = "https://placehold.co/600x400";

const OrganizationDetails = ({
  org,
  tags = [],
  category = "",
  setDetailsModal,
  setActionType,
  setSelectedItem,
  setModalOpen,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex shadow-xl items-center justify-center pointer-events-auto">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl relative">
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{org.org_name}</h1>
              <p className="text-gray-600">
                Led by:{" "}
                <span className="font-medium">{org.president || "N/A"}</span>
              </p>
              <p className="text-gray-600">
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
              className="text-gray-500 hover:text-gray-700 p-2 -mt-2 -mr-2"
              aria-label="Close modal"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* About */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line">
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

          {/* Social Media */}
          {org.socmed_links && Object.keys(org.socmed_links).length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Social Media</h2>
              <div className="space-y-2">
                {org.socmed_links.facebook && (
                  <div className="flex items-center gap-2">
                    <FaFacebook className="text-blue-600" />
                    <a
                      href={org.socmed_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      Facebook
                    </a>
                  </div>
                )}
                {org.socmed_links.instagram && (
                  <div className="flex items-center gap-2">
                    <FaInstagram className="text-pink-600" />
                    <a
                      href={org.socmed_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 underline"
                    >
                      Instagram
                    </a>
                  </div>
                )}
                {org.socmed_links.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-yellow-600" />
                    <a
                      href={`mailto:${org.socmed_links.email}`}
                      className="text-yellow-500 underline"
                    >
                      {org.socmed_links.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Featured Photos */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Featured Photos</h2>
            <div className="w-full h-32 border border-dashed flex items-center justify-center rounded bg-white">
              <span className="text-gray-400">Photo Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetails;
