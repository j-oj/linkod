import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import Navbar from "@/components/navbar";
import Loading from "@/components/loading";
import ActionButton from "@/components/ui/actionbutton";
import {
  FaCrown,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

const Homepage = () => {
  const [orgs, setOrgs] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("guest");
  const [adminOrgSlug, setAdminOrgSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [user, setUser] = useState(null);
  const [showCount, setShowCount] = useState(true);
  const observerRef = useRef(null);

  // Authenticate user and set roles
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const isLoggedIn = !!data.session;

        if (isLoggedIn) {
          const { user } = data.session;
          setUser(user);

          const { data: userData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          const role = userData?.role || "user";
          localStorage.setItem("userRole", role);
          setUserRole(role);

          if (role === "admin") {
            const { data: byIdData } = await supabase
              .from("admin")
              .select("org_id")
              .eq("admin_id", user.id)
              .maybeSingle();

            let adminData = byIdData;

            if (!adminData) {
              const { data: byEmailData } = await supabase
                .from("admin")
                .select("org_id")
                .eq("admin_email", user.email)
                .maybeSingle();

              adminData = byEmailData;
            }

            if (adminData?.org_id) {
              const { data: orgData } = await supabase
                .from("organization")
                .select("slug")
                .eq("org_id", adminData.org_id)
                .maybeSingle();

              if (orgData?.slug) {
                setAdminOrgSlug(orgData.slug);
              }
            }
          }
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

  // Fetch orgs and categories
  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const [{ data: orgData }, { data: catData }] = await Promise.all([
          supabase
            .from("organization")
            .select(
              "*, category(category_name), org_tag(tag:tag_id (tag_name))"
            )
            .order("org_name", { ascending: true }),
          supabase
            .from("category")
            .select("*")
            .order("category_name", { ascending: true }),
        ]);

        setOrgs(orgData || []);
        setFilteredOrgs(orgData || []);
        setCategories(catData || []);
      } catch (error) {
        console.error("Error fetching orgs or categories:", error);
        setOrgs([]);
        setFilteredOrgs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  // IntersectionObserver: animate once
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.classList.contains("card-visible")
          ) {
            entry.target.classList.add("card-visible");
            entry.target.classList.remove("card-hidden");
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  // Apply animation to org cards
  useEffect(() => {
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll(".org-card");
      cards.forEach((card, index) => {
        if (!card.classList.contains("card-visible")) {
          card.classList.add("card-hidden");
          card.style.transitionDelay = `${index * 25}ms`;
          observerRef.current?.observe(card);
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [filteredOrgs]);

  // Search/filter logic
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterOrgs(term, selectedCategory);
  };

  const filterOrgs = (term = searchTerm, category = selectedCategory) => {
    const filtered = orgs.filter((org) => {
      const nameMatch = org.org_name.toLowerCase().includes(term.toLowerCase());
      const tags = org.org_tag?.map((t) => t.tag?.tag_name.toLowerCase()) || [];
      const tagMatch = tags.some((tag) => tag.includes(term.toLowerCase()));
      const categoryMatch =
        !category || org.category?.category_name === category;
      return (nameMatch || tagMatch) && categoryMatch;
    });

    setFilteredOrgs(filtered);
  };

  const isAdminOrg = (orgSlug) => {
    return userRole === "admin" && adminOrgSlug === orgSlug;
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />

      <style jsx="true">{`
        .card-hidden {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.25s ease-out, transform 0.25s ease-out;
        }
        .card-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .org-card {
          transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
        }
      `}</style>

      <section className="py-15">
        <div
          style={{
            backgroundImage: "url('/upmin-hero-image.jpg')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top",
            height: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="relative z-0"
        >
          <div className="text-center text-white mt-5 lg:mt-20 px-5 py-5 custom-text-shadow">
            <h1 className="text-2xl font-bold md:text-4xl lg:text-5xl">
              <span className="text-mustard">Connect</span> with your UP
              Mindanao Community now!
            </h1>
            <h2 className="text-l italic md:text-2xl">
              An online directory for student-led campus organizations.
            </h2>
          </div>
          <span className="absolute bottom-10 lg:bottom-3 left-5 text-xs md:text-sm z-10 text-white">
            &copy; UP Mindanao Public Relations Office
          </span>
        </div>
      </section>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto px-4 mb-12 -mt-24 flex justify-center z-10 relative">
        <div className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 transition-colors duration-200">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg py-2.5 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-maroon dark:focus:ring-red-600 text-gray-800 dark:text-white transition-colors duration-200"
            />
            <div className="absolute left-3 top-4 text-gray-400 cursor-pointer">
              <FaSearch />
            </div>
            {searchTerm && (
              <div
                className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 cursor-pointer "
                onClick={() => {
                  setSearchTerm("");
                  filterOrgs("", selectedCategory);
                }}
              >
                <FaTimes />
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-60">
            <Listbox
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                filterOrgs(searchTerm, val);
              }}
            >
              <div className="relative">
                <ListboxButton className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg py-2.5 px-4 pr-10 text-left transition-colors duration-200">
                  {selectedCategory || "All Categories"}
                  <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <FaChevronDown className="text-gray-400" />
                  </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto text-sm">
                  <ListboxOption value="">
                    {({ active }) => (
                      <div
                        className={`cursor-pointer px-4 py-2 ${
                          active
                            ? "bg-red-700 text-white"
                            : "text-gray-800 dark:text-white"
                        }`}
                      >
                        All Categories
                      </div>
                    )}
                  </ListboxOption>
                  {categories.map((cat) => (
                    <ListboxOption
                      key={cat.category_id}
                      value={cat.category_name}
                    >
                      {({ active }) => (
                        <div
                          className={`cursor-pointer px-4 py-2 ${
                            active
                              ? "bg-red-700 text-white"
                              : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {cat.category_name}
                        </div>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </div>

          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                filterOrgs("", "");
              }}
              className="px-4 py-2 bg-maroon/10 hover:bg-maroon/20 text-maroon rounded-lg dark:text-white dark:bg-maroon dark:hover:bg-red-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Organization Cards */}
      <div className="px-4 max-w-6xl mx-auto mb-16">
        {filteredOrgs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 transition-colors duration-200">
                <button
                  onClick={() => setShowCount(!showCount)}
                  className="text-maroon hover:text-red-800 dark:text-gray-400 dark:hover:text-gray-300 text-lg"
                  title={showCount ? "Hide count" : "Show count"}
                >
                  {showCount ? <FaEyeSlash /> : <FaEye />}
                </button>
                {showCount && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Showing {filteredOrgs.length} organization
                    {filteredOrgs.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org) => {
                const isAdmin = isAdminOrg(org.slug);
                return (
                  <Link
                    key={org.id || org.org_id}
                    to={`/orgs/${org.slug}`}
                    className={`org-card relative bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-400 group ${
                      isAdmin ? "ring-4 ring-yellow-400" : ""
                    }`}
                  >
                    <div className="h-1.5 bg-maroon"></div>
                    <div className="p-8">
                      {isAdmin && (
                        <div
                          className="absolute top-2 right-2 bg-yellow-400 text-maroon rounded-full p-1.5"
                          title="You are an admin of this organization"
                        >
                          <FaCrown size={14} />
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 transition-colors duration-200">
                          <img
                            src={
                              org.org_logo ||
                              "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"
                            }
                            alt={org.org_name}
                            className="w-16 h-16 object-cover"
                          />
                        </div>
                        <h2 className="font-bold text-base text-center text-gray-800 dark:text-white truncate max-w-full transition-colors duration-200">
                          {org.org_name}
                        </h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300 transition-colors duration-200">
                          {org.category?.category_name}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              No organizations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {orgs.length > 0
                ? "Try adjusting your filters."
                : "No organizations are available at the moment."}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  filterOrgs("", "");
                }}
                className="mt-4 px-4 py-2 bg-maroon hover:bg-maroon/90 text-white rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        <ActionButton type="top" />
      </div>

      <footer className="bg-maroon dark:bg-maroon-900 text-white dark:text-gray-200 py-6 ">
        <div className="max-w-6xl mx-auto px-4 text-center">
          &copy; {new Date().getFullYear()}. All rights reserved.
        </div>
      </footer>
    </>
  );
};

export default Homepage;
