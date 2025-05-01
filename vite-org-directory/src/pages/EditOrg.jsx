import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";

const EditOrg = () => {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch org
        const { data: orgData, error: orgError } = await supabase
          .from("organization")
          .select("*")
          .eq("slug", slug)
          .single();

        if (orgError) throw orgError;
        setOrg(orgData);

        // Fetch all tags
        const { data: tagList, error: tagError } = await supabase
          .from("tag")
          .select("tag_id, category");

        if (tagError) throw tagError;
        setAllTags(tagList || []);

        // Fetch current org's tags
        const { data: orgTagsData, error: orgTagsError } = await supabase
          .from("organization_tags")
          .select("tag_id")
          .eq("org_id", orgData.org_id);

        if (orgTagsError) throw orgTagsError;
        const currentTagIds = orgTagsData.map((t) => t.tag_id);
        setSelectedTags(currentTagIds);
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

  const handleTagChange = (e) => {
    const tagId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedTags([...selectedTags, tagId]);
    } else {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update organization table
      const { error: updateError } = await supabase
        .from("organization")
        .update({
          org_name: org.org_name,
          about: org.about,
          president: org.president,
          socmed_links: org.socmed_links,
        })
        .eq("org_id", org.org_id);

      if (updateError) throw updateError;

      // Remove old tags
      const { error: deleteError } = await supabase
        .from("organization_tags")
        .delete()
        .eq("org_id", org.org_id);

      if (deleteError) throw deleteError;

      // Insert new tags
      const newTags = selectedTags.map((tagId) => ({
        org_id: org.org_id,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from("organization_tags")
        .insert(newTags);

      if (insertError) throw insertError;

      navigate(`/orgs/${slug}`);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to update organization.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-8 px-6">
        <h1 className="text-2xl font-bold mb-4">Edit Organization</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-gray-100 p-6 rounded shadow"
        >
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
            <label className="block font-medium">About</label>
            <textarea
              name="about"
              value={org.about || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded mt-1"
              rows={5}
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-4">
              {allTags.map((tag) => (
                <label key={tag.tag_id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={tag.tag_id}
                    checked={selectedTags.includes(tag.tag_id)}
                    onChange={handleTagChange}
                  />
                  {tag.category}
                </label>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block font-medium">Facebook</label>
            <input
              type="text"
              value={org.socmed_links?.facebook || ""}
              onChange={(e) =>
                setOrg((prev) => ({
                  ...prev,
                  socmed_links: {
                    ...prev.socmed_links,
                    facebook: e.target.value,
                  },
                }))
              }
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Instagram</label>
            <input
              type="text"
              value={org.socmed_links?.instagram || ""}
              onChange={(e) =>
                setOrg((prev) => ({
                  ...prev,
                  socmed_links: {
                    ...prev.socmed_links,
                    instagram: e.target.value,
                  },
                }))
              }
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              value={org.socmed_links?.email || ""}
              onChange={(e) =>
                setOrg((prev) => ({
                  ...prev,
                  socmed_links: { ...prev.socmed_links, email: e.target.value },
                }))
              }
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
