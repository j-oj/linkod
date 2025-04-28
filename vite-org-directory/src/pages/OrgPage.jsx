import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const OrgPage = () => {
  const { slug } = useParams();

  const [org, setOrg] = useState(null);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching org:", error);
      } else {
        setOrg(data);
      }
    };

    fetchOrg();
  }, [slug]);

  if (!org) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        {org.org_logo && (
          <img src={org.org_logo} alt="Logo" className="w-20 h-20 rounded" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-maroon">{org.org_name}</h1>
          <p className="text-gray-600">Email: {org.email}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">About the Organization</h2>
        <p className="mt-2">{org.about}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">President</h2>
        <p className="mt-2">{org.president}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Application Dates</h2>
        <p className="mt-2">{org.application_dates}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Social Media Links</h2>
        <ul className="mt-2 space-y-2">
          {org.socmed_links && org.socmed_links.facebook && (
            <li>
              <a
                href={org.socmed_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Facebook
              </a>
            </li>
          )}
          {org.socmed_links && org.socmed_links.twitter && (
            <li>
              <a
                href={org.socmed_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                Twitter
              </a>
            </li>
          )}
          {org.socmed_links && org.socmed_links.instagram && (
            <li>
              <a
                href={org.socmed_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 underline"
              >
                Instagram
              </a>
            </li>
          )}
          {org.socmed_links && org.socmed_links.linkedin && (
            <li>
              <a
                href={org.socmed_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                LinkedIn
              </a>
            </li>
          )}
          {org.socmed_links && org.socmed_links.website && (
            <li>
              <a
                href={org.socmed_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 underline"
              >
                Website
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default OrgPage;