import { useState, useEffect } from "react";
import { FaRegTrashAlt, FaUserTimes, FaSearch, FaEye } from "react-icons/fa";
import Navbar from "../components/navbar.jsx";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";

const TABS = ["Activity Log", "Admins", "Organizations"];

// Modal component for confirmation
const ConfirmAction = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  warning,
  subtitle,
  confirmText,
  cancelText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-red-600 font-medium mb-2">{warning}</p>
        <p className="text-gray-600 mb-4 text-sm">{subtitle}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Action button component for scrolling to top
const ActionButton = ({ type }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 bg-maroon hover:bg-red-800 text-white p-3 rounded-full shadow-lg"
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
};

export default function SAdminDashboard() {
  const [activeTab, setActiveTab] = useState("Activity Log");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orgUsers, setOrgUsers] = useState({});
  const [currentAdminId, setCurrentAdminId] = useState(null);

  useEffect(() => {
    fetchCurrentAdmin();
    fetchData();
  }, [activeTab]);

  // Fetch the current admin ID from session or localStorage
  const fetchCurrentAdmin = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        // Get admin details from the admin table
        const { data, error } = await supabase
          .from("admin")
          .select("admin_id")
          .eq("auth_id", session.user.id)
          .single();

        if (data) {
          setCurrentAdminId(data.admin_id);
        } else {
          console.error("Current admin not found:", error);
          // For local development, you might want to set a default admin ID
          setCurrentAdminId("default-admin-id");
        }
      }
    } catch (error) {
      console.error("Error fetching current admin:", error);
      // Fallback for development
      setCurrentAdminId("default-admin-id");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "Organizations" || activeTab === "Activity Log") {
        // Simplified query to match actual database structure
        const { data: orgsData, error: orgsError } = await supabase
          .from("organization")
          .select("*")
          .order("org_name", { ascending: true });

        if (orgsError) throw orgsError;
        setOrganizations(orgsData || []);

        // Fetch user counts for each organization
        const orgIds = orgsData?.map((org) => org.org_id) || [];
        const counts = {};

        for (const orgId of orgIds) {
          const { data, error } = await supabase
            .from("user_roles")
            .select("*", { count: "exact" })
            .eq("org_id", orgId);

          if (!error) {
            counts[orgId] = data?.length || 0;
          }
        }

        setOrgUsers(counts);
      }

      if (activeTab === "Admins" || activeTab === "Activity Log") {
        // Simplified query to match actual database structure
        const { data: adminsData, error: adminsError } = await supabase.from(
          "admin"
        ).select(`
            admin_id,
            admin_name,
            admin_email,
            org_id,
            organization (org_id, org_name)
          `);

        if (adminsError) throw adminsError;
        setAdmins(adminsData || []);
      }

      if (activeTab === "Activity Log") {
        // Simplified query to match actual database structure
        const { data: logsData, error: logsError } = await supabase
          .from("activity_log")
          .select(
            `
            activity_log_id,
            admin_id,
            org_id,
            activity_content,
            activity_timestamp,
            admin (admin_id, admin_name, admin_email),
            organization (org_id, org_name)
          `
          )
          .order("activity_timestamp", { ascending: false });

        if (logsError) throw logsError;
        setActivityLogs(logsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedItem) {
      toast.error("No item selected");
      setModalOpen(false);
      return;
    }

    try {
      if (actionType === "delete-org") {
        // Check if organization exists
        const { data: orgCheck, error: orgCheckError } = await supabase
          .from("organization")
          .select("org_id")
          .eq("org_id", selectedItem.org_id)
          .single();

        if (orgCheckError) {
          console.error("Organization check error:", orgCheckError);
          throw new Error("Organization not found");
        }

        // First, delete all admins associated with the organization
        const { error: adminDeleteError } = await supabase
          .from("admin")
          .delete()
          .eq("org_id", selectedItem.org_id);

        if (adminDeleteError) {
          console.error("Admin deletion error:", adminDeleteError);
          throw adminDeleteError;
        }

        // Then delete the organization
        const { error } = await supabase
          .from("organization")
          .delete()
          .eq("org_id", selectedItem.org_id);

        if (error) {
          console.error("Organization deletion error:", error);
          throw error;
        }

        // Log the activity
        await logActivity({
          admin_id: currentAdminId,
          org_id: selectedItem.org_id,
          activity_content: `Deleted organization: ${selectedItem.org_name}`,
          activity_type: "delete_organization",
        });

        setOrganizations(
          organizations.filter((org) => org.org_id !== selectedItem.org_id)
        );
        toast.success("Organization deleted successfully");
      } else if (actionType === "remove-admin") {
        // Check if admin exists
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from("admin")
          .select("admin_id")
          .eq("admin_id", selectedItem.admin_id)
          .single();

        if (adminCheckError) {
          console.error("Admin check error:", adminCheckError);
          throw new Error("Admin not found");
        }

        const { error } = await supabase
          .from("admin")
          .delete()
          .eq("admin_id", selectedItem.admin_id);

        if (error) {
          console.error("Admin removal error:", error);
          throw error;
        }

        // Log the activity
        await logActivity({
          admin_id: currentAdminId,
          org_id: selectedItem.org_id,
          activity_content: `Removed admin: ${selectedItem.admin_name}`,
          activity_type: "remove_admin",
        });

        setAdmins(
          admins.filter((admin) => admin.admin_id !== selectedItem.admin_id)
        );
        toast.success("Admin removed successfully");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Operation failed: " + error.message);
    } finally {
      setModalOpen(false);
    }
  };

  // Log activity to supabase
  const logActivity = async (activityData) => {
    try {
      if (!currentAdminId) {
        console.error("No admin ID available for logging activity");
        return;
      }

      const { error } = await supabase.from("activity_log").insert([
        {
          ...activityData,
          admin_id: currentAdminId,
          activity_timestamp: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error logging activity:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error logging activity:", error);
      toast.error("Failed to log activity");
    }
  };

  // Filter data based on search query
  const filteredOrganizations = organizations.filter((org) =>
    org.org_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.admin_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.organization?.org_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(
    (log) =>
      log.admin?.admin_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      log.organization?.org_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      log.activity_content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const tableBaseClasses = "w-full min-w-[500px] text-sm text-left";
  const tableHeaderClasses = "bg-maroon text-white px-4 py-2";

  // Organization details modal
  const OrganizationDetails = ({ org }) => {
    if (!org) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{org.org_name}</h3>
              <p className="text-gray-500 text-sm">ID: {org.org_id}</p>
            </div>
            <button
              onClick={() => setDetailsModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-semibold mb-2">Organization Details</h4>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Logo:</span>{" "}
                  {org.org_logo ? "Available" : "Not available"}
                </p>
                <p>
                  <span className="font-medium">Users:</span>{" "}
                  {orgUsers[org.org_id] || 0}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-semibold mb-2">Additional Information</h4>
              <p className="text-sm text-gray-700">
                {org.about || "No additional information available."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDetailsModal(false);
                setActionType("delete-org");
                setSelectedItem(org);
                setModalOpen(true);
              }}
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md"
            >
              <FaRegTrashAlt /> Delete Organization
            </button>
            <button
              onClick={() => setDetailsModal(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar userRole="superadmin" />
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>

        {/* Tabs */}
        <div className="bg-gray-100 p-2 rounded-md shadow-inner">
          <div className="flex flex-col sm:flex-row gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-md font-medium hover:cursor-pointer hover:bg-gray-200 ${
                  activeTab === tab
                    ? "bg-maroon text-white hover:bg-red-800"
                    : "text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="bg-gray-100 p-4 rounded-md shadow-inner">
          <h2 className="text-lg font-semibold mb-3">
            {activeTab === "Organizations"
              ? "Manage Organizations"
              : activeTab === "Admins"
              ? "Manage Admins"
              : "Admin Activity Log"}
          </h2>
          <div className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm w-full max-w-md">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder={
                activeTab === "Admins"
                  ? "Search organization or admin"
                  : "Search organization"
              }
              className="w-full focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <DotPulse size={43} speed={1.3} color="maroon" />
            </div>
          )}

          {/* Table Content */}
          {!isLoading && (
            <div className="overflow-x-auto bg-white rounded-md shadow-sm mt-4">
              {activeTab === "Organizations" && (
                <table className={`min-w-full ${tableBaseClasses}`}>
                  <thead>
                    <tr>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Organization
                      </th>
                      <th className={`text-center ${tableHeaderClasses}`}>
                        Users
                      </th>
                      <th className={`text-center ${tableHeaderClasses}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.length > 0 ? (
                      filteredOrganizations.map((org) => (
                        <tr
                          key={org.org_id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-left">
                            {org.org_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {orgUsers[org.org_id] || 0}
                          </td>
                          <td className="px-4 py-2 flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setDetailsItem(org);
                                setDetailsModal(true);
                              }}
                              className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 cursor-pointer text-blue-700 text-sm px-3 py-1 rounded-full"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => {
                                setActionType("delete-org");
                                setSelectedItem(org);
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 cursor-pointer text-red-700 text-sm px-3 py-1 rounded-full"
                            >
                              <FaRegTrashAlt /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No organizations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "Admins" && (
                <table className={`min-w-full ${tableBaseClasses}`}>
                  <thead>
                    <tr>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Admin
                      </th>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Organization
                      </th>
                      <th className={`text-center ${tableHeaderClasses}`}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length > 0 ? (
                      filteredAdmins.map((admin) => (
                        <tr
                          key={admin.admin_id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-2">
                            {admin.admin_name}
                            <div className="text-xs text-gray-500">
                              {admin.admin_email}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {admin.organization?.org_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => {
                                setActionType("remove-admin");
                                setSelectedItem(admin);
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 cursor-pointer text-red-700 text-sm px-3 py-1 rounded-full mx-auto"
                            >
                              <FaUserTimes /> Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No admins found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "Activity Log" && (
                <table className={`min-w-full ${tableBaseClasses}`}>
                  <thead>
                    <tr>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Admin
                      </th>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Organization
                      </th>
                      <th className={`text-left ${tableHeaderClasses}`}>
                        Action
                      </th>
                      <th className={`text-center ${tableHeaderClasses}`}>
                        Date and Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <tr
                          key={log.activity_log_id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-left">
                            {log.admin?.admin_name || "Unknown"}
                            <div className="text-xs text-gray-500">
                              {log.admin?.admin_email || ""}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {log.organization?.org_name || "Unknown"}
                          </td>
                          <td className="px-4 py-2">{log.activity_content}</td>
                          <td className="px-4 py-2 text-center">
                            {formatDate(log.activity_timestamp)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-4 text-center text-gray-500"
                        >
                          No activity logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          <ActionButton type="top" />
        </div>

        {/* Confirmation Modal */}
        <ConfirmAction
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
          title="Confirm Action"
          warning={
            actionType === "delete-org"
              ? `Are you sure you want to delete ${selectedItem?.org_name}?`
              : `Are you sure you want to remove ${selectedItem?.admin_name}?`
          }
          subtitle="This action cannot be undone. All data associated with this item will be permanently removed."
          confirmText={actionType === "delete-org" ? "Delete" : "Remove"}
          cancelText="Cancel"
        />

        {/* Organization Details Modal */}
        {detailsModal && <OrganizationDetails org={detailsItem} />}
      </div>
    </>
  );
}
