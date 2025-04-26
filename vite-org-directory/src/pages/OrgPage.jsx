import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const OrgPage = () => {
  const { slug } = useParams(); // Use slug from the URL
  const [org, setOrg] = useState(null);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data, error } = await supabase
        .from("organization") // Ensure the table name matches your database
        .select("*")
        .eq("slug", slug) // Use slug instead of id
        .single();

      if (error) {
        console.error("Error fetching org:", error);
      } else {
        setOrg(data);
      }
    };

    fetchOrg();
  }, [slug]);

  if (!org) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        {org.logo_url && (
          <img src={org.logo_url} alt="Logo" className="w-20 h-20 rounded" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-maroon">{org.name}</h1>
          <p className="text-gray-600">{org.email}</p>
        </div>
      </div>
      <p className="mt-4">{org.description}</p>
    </div>
  );
};

export default OrgPage;