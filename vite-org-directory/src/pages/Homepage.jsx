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
  const [observedElements, setObservedElements] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const { data } = await supabase.auth.getSession();
        const isLoggedIn = !!data.session;
        console.log("Is user logged in:", isLoggedIn);

        if (isLoggedIn) {
          const { user } = data.session;
          setUser(user);
          console.log("Logged in user:", user.id, user.email);

          const { data: userData, error: userError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          if (userError) console.error("Error fetching user role:", userError);
          console.log("User role data:", userData);

          const role = userData?.role || "user";
          localStorage.setItem("userRole", role);
          setUserRole(role);
          console.log("Set user role to:", role);

          // If user is an admin, find their organization
          if (role === "admin") {
            console.log("User is admin, finding their organization...");

            // Try to find by admin_id first
            console.log("Looking up admin by ID:", user.id);
            const { data: byIdData, error: byIdError } = await supabase
              .from("admin")
              .select("org_id")
              .eq("admin_id", user.id)
              .maybeSingle();

            console.log("Admin lookup by ID result:", byIdData, byIdError);

            let adminData = null;
            if (!byIdData) {
              console.log("Admin not found by ID, trying email:", user.email);
              const { data: byEmailData, error: byEmailError } = await supabase
                .from("admin")
                .select("org_id")
                .eq("admin_email", user.email)
                .maybeSingle();

              console.log(
                "Admin lookup by email result:",
                byEmailData,
                byEmailError
              );
              adminData = byEmailData;
            } else {
              adminData = byIdData;
            }

            console.log("Final admin data:", adminData);

            // If admin data found, get the organization slug
            if (adminData && adminData.org_id) {
              console.log("Found admin org_id:", adminData.org_id);
              const { data: orgData, error: orgError } = await supabase
                .from("organization")
                .select("slug, org_name")
                .eq("org_id", adminData.org_id)
                .maybeSingle();

              console.log("Organization data:", orgData, orgError);

              if (orgData?.slug) {
                console.log("Setting admin org slug to:", orgData.slug);
                setAdminOrgSlug(orgData.slug);
              } else {
                console.log("No organization slug found");
              }
            } else {
              console.log("No valid admin data found");
            }
          }
        } else {
          localStorage.removeItem("userRole");
          setUserRole("guest");
          console.log("User is not logged in, set as guest");
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
        console.log("Fetching organizations...");
        const [
          { data: orgData, error: orgError },
          { data: catData, error: catError },
        ] = await Promise.all([
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

        if (orgError) throw orgError;
        if (catError) throw catError;

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

  // Set up Intersection Observer for scroll effects
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("card-visible");
            entry.target.classList.remove("card-hidden");
          } else {
            // Reset the animation when the card leaves the viewport
            entry.target.classList.remove("card-visible");
            entry.target.classList.add("card-hidden");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.15,
      }
    );

    return () => {
      // Clean up observer on component unmount
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Observe organization cards when they're added or changed
  useEffect(() => {
    // Wait a bit to ensure DOM is updated before observing
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll(".org-card");
      cards.forEach((card, index) => {
        // Add initial hidden class with staggered delay
        card.classList.add("card-hidden");
        card.style.transitionDelay = `${index * 50}ms`;

        // Start observing this card if we have an observer
        if (observerRef.current) {
          observerRef.current.observe(card);
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredOrgs]);

  // Debug useEffect to log state changes
  useEffect(() => {
    console.log("Current adminOrgSlug:", adminOrgSlug);
    console.log("Current userRole:", userRole);
    console.log("Organization count:", orgs.length);
  }, [adminOrgSlug, userRole, orgs]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterOrgs(term, selectedCategory);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    filterOrgs(searchTerm, category);
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

  // Check if the org is the admin's org
  const isAdminOrg = (orgSlug) => {
    const isAdmin = userRole === "admin" && adminOrgSlug === orgSlug;

    return isAdmin;
  };

  if (loading) {
    return (
      <>
        <Loading />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Add CSS for scroll animations */}
      <style jsx="true">{`
        /* CSS for card scroll animations */
        .card-hidden {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .card-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Hero Section */}
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
            zIndex: -1,
          }}
          className="relative"
        >
          <div className="text-center left-0 text-white mt-20 px-5 py-5 custom-text-shadow">
            <h1 className="text-4xl font-bold text-white mb-2.5 lg:text-5xl">
              {" "}
              <span className="text-mustard">Connect</span> with your UP Mindanao Community now!{" "}
            </h1>
            <h2 className="text-2xl italic">
              {" "}
              An online directory for student-led campus organizations.{" "}
            </h2>
          </div>
          <span className="absolute bottom-3 left-5 text-sm z-10 text-white">&copy; University of the Philippines Mindanao </span>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <div className="max-w-6xl mx-auto px-4 mb-12 z-15 -mt-24 flex justify-center">
        <div className="bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg py-2.5 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-maroon text-gray-800 dark:text-white"
            />
            <div
              className="absolute flex left-3 top-4 text-gray-400 cursor-pointer"
              onClick={() =>
                document.querySelector('input[type="text"]').focus()
              }
            >
              <FaSearch />
            </div>
            {searchTerm && (
              <div
                className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => {
                  setSearchTerm("");
                  filterOrgs("", selectedCategory);
                }}
              >
                <FaTimes />
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-60">
            <Listbox
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                filterOrgs(searchTerm, val);
              }}
            >
              <div className="relative w-full sm:w-60">
                <ListboxButton className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg py-2.5 px-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-maroon">
                  {selectedCategory || "All Categories"}
                  <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <FaChevronDown className="text-gray-400" />
                  </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto text-sm">
                  <ListboxOption
                    value=""
                    className={({ active }) =>
                      `cursor-pointer select-none relative px-4 py-2 ${
                        active
                          ? "bg-red-700 text-white"
                          : "text-gray-800 dark:text-white"
                      }`
                    }
                  >
                    All Categories
                  </ListboxOption>
                  {categories.map((cat) => (
                    <ListboxOption
                      key={cat.category_id}
                      value={cat.category_name}
                      className={({ active }) =>
                        `cursor-pointer select-none relative px-4 py-2 ${
                          active
                            ? "bg-red-700 text-white"
                            : "text-gray-800 dark:text-white"
                        }`
                      }
                    >
                      {cat.category_name}
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
              className="px-4 py-2 bg-maroon/10 hover:bg-maroon/20 text-maroon rounded-lg transition-colors dark:text-white dark:bg-maroon dark:hover:bg-red-700"
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
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-white">
                <button
                  onClick={() => setShowCount(!showCount)}
                  className="text-maroon hover:text-red-800 focus:outline-none text-lg dark:text-gray-400 dark:hover:text-gray-300 transition-colors hover:cursor-pointer"
                  title={showCount ? "Hide count" : "Show count"}
                >
                  {showCount ? <FaEyeSlash /> : <FaEye />}
                </button>
                {showCount && (
                  <div
                    className="text-gray-500 dark:text-gray-400 hover:cursor-pointer"
                    onClick={() => setShowCount(!showCount)}
                  >
                    Showing {filteredOrgs.length} organization
                    {filteredOrgs.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org, index) => {
                const isAdmin = isAdminOrg(org.slug);
                return (
                  <Link
                    key={org.id || org.org_id}
                    to={`/orgs/${org.slug}`}
                    className={`org-card relative bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 group hover:scale-103 dark:hover:border-white ${
                      isAdmin ? "ring-4 ring-yellow-400 " : ""
                    }`}
                  >
                    <div className="h-1.5 bg-maroon"></div>
                    <div className="p-8"> {/*added padding to make the cards look bigger*/}
                      {isAdmin && (
                        <div
                          className="absolute top-2 right-2 bg-yellow-400 text-maroon rounded-full p-1.5"
                          title="You are an admin of this organization"
                        >
                          <FaCrown size={14} />
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                          <img
                            src={
                              org.org_logo ||
                              "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"
                            }
                            alt={org.org_name}
                            className="w-16 h-16 object-cover"
                          />
                        </div>
                        <h2 className="font-bold text-base text-center text-gray-800 dark:text-white truncate max-w-full">
                          {org.org_name}
                        </h2>
                        <span className="mt-2 inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300">
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
                className="mt-4 px-4 py-2 bg-maroon hover:bg-maroon/90 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        <ActionButton type="top" />
      </div>

      {/* Footer */}
      <footer className="bg-maroon dark:bg-maroon-900 text-white dark:text-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center">
            &copy; {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Homepage;
