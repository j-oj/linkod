import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/navbar";
import Loading from "../components/Loading";
import { FaFilter, FaChevronDown } from "react-icons/fa";

const Homepage = () => {
  const [orgs, setOrgs] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [userRole, setUserRole] = useState("guest");
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const isLoggedIn = !!data.session;

        if (isLoggedIn) {
          const { user } = data.session;
          const { data: userData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          const role = userData?.role || "user";
          localStorage.setItem("userRole", role);
          setUserRole(role);
        } else {
          localStorage.removeItem("userRole");
          setUserRole("guest");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUserRole("guest");
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("organization")
          .select("*, org_tag(tag:tag_id (tag_name))")
          .order("org_name", { ascending: true });

        if (error) throw error;

        setOrgs(data || []);
        setFilteredOrgs(data || []);
        extractTags(data || []);
      } catch (error) {
        console.error("Error fetching orgs:", error);
        setOrgs([]);
        setFilteredOrgs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  const extractTags = (orgsList) => {
    const tagSet = new Set();
    orgsList.forEach((org) => {
      const tags = org.org_tag?.map((t) => t.tag?.tag_name) || [];
      tags.forEach((tag) => tag && tagSet.add(tag.trim()));
    });
    setAllTags([...tagSet].sort());
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterOrgs(term, selectedTags);
  };

  const handleTagFilter = (tag) => {
    let updatedTags;

    if (selectedTags.includes(tag)) {
      updatedTags = selectedTags.filter((t) => t !== tag);
    } else {
      updatedTags = [...selectedTags, tag];
    }

    setSelectedTags(updatedTags);
    filterOrgs(searchTerm, updatedTags);
    setIsDropdownOpen(false);
  };

  const clearFilter = () => {
    setSelectedTags([]);
    filterOrgs(searchTerm, []);
  };

  const filterOrgs = (term, tags) => {
    const filtered = orgs.filter((org) => {
      const matchesSearch = org.org_name
        .toLowerCase()
        .includes(term.toLowerCase());

      const orgTags = org.org_tag?.map((t) => t.tag?.tag_name) || [];
      const matchesAllTags = tags.every((tag) => orgTags.includes(tag));

      return matchesSearch && matchesAllTags;
    });

    setFilteredOrgs(filtered);
  };

  if (loading) {
    return (
      <>
        <Loading />
        <div className="text-center mt-4 text-gray-500 text-sm">
          Loading organizations...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole={userRole} />
      <div className="p-4 max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-maroon"
            />
            <FaFilter className="absolute right-4 top-2.5 text-gray-400" />
          </div>
        </div>

        {/* Tag Dropdown */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-64 flex justify-between items-center px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon"
              >
                <span className="text-gray-700">
                  {selectedTags.length > 0
                    ? "Filter by Tag"
                    : "Select categories to filter"}
                </span>
                <FaChevronDown
                  className={`ml-2 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full sm:w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => handleTagFilter(tag)}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedTags.includes(tag)
                          ? "bg-gray-200 font-semibold"
                          : ""
                      }`}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center bg-maroon text-white text-sm px-3 py-1 rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleTagFilter(tag)}
                  className="ml-2 text-white hover:text-gray-300"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearFilter}
              className="text-sm text-gray-500 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Org Cards */}
        {filteredOrgs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredOrgs.map((org) => (
              <Link
                key={org.org_id}
                to={`/orgs/${org.slug}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center text-center dark:bg-gray-800 dark:text-white dark:hover:shadow-lg"
              >
                <img
                  src={org.org_logo || "https://via.placeholder.com/150"}
                  alt={org.org_name}
                  className="w-24 h-24 object-contain mb-3"
                />
                <h2 className="font-semibold text-sm">{org.org_name}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            No organizations found.{" "}
            {orgs.length > 0 ? "Try adjusting your filters." : ""}
          </div>
        )}
      </div>
    </>
  );
};

export default Homepage;
