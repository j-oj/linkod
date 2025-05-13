import { useState, useEffect } from "react";
import { FaRegTrashAlt, FaUserTimes, FaEdit, FaEye } from "react-icons/fa";
import Navbar from "@/components/navbar.jsx";
import { supabase } from "@/supabaseClient";
import { toast } from "react-hot-toast";
import SuccessToast from "@/components/successToast";
import ErrorToast from "@/components/errorToast";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import ConfirmAction from "../components/ui/confirmAction";
import SearchBar from "../components/searchBar";
import TabNavigation from "../components/tabNavigation";
import OrganizationDetails from "../components/orgDetails";
import ActionButton from "../components/ui/actionbutton";

const TABS = ["Admin Login Record", "Admins", "Organizations"];

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
      if (activeTab === "Organizations" || activeTab === "Admin Login Record") {
        // Simplified query to match actual database structure
        const { data: orgsData, error: orgsError } = await supabase
          .from("organization")
          .select("*")
          .order("org_name", { ascending: true });

        if (orgsError) throw orgsError;
        setOrganizations(orgsData || []);
      }

      if (activeTab === "Admins" || activeTab === "Admin Login Record") {
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

      if (activeTab === "Admin Login Record") {
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
      toast.custom(
        <ErrorToast message={`Failed to load data: ${error.message}`} />
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedItem) {
      toast.custom(<ErrorToast message="No item selected." />);
      setModalOpen(false);
      return;
    }

    console.log("Deleting org:", selectedItem);

    try {
      if (actionType === "delete-org") {
        // 1. Check if organization exists
        const { data: orgCheck, error: orgCheckError } = await supabase
          .from("organization")
          .select("org_id")
          .eq("org_id", selectedItem.org_id)
          .single();

        if (orgCheckError) {
          console.error("Organization check error:", orgCheckError);
          throw new Error("Organization not found.");
        }

        // 2. Delete related org_tag entries
        const { error: tagDeleteError } = await supabase
          .from("org_tag")
          .delete()
          .eq("org_id", selectedItem.org_id);

        if (tagDeleteError) {
          console.error(
            "Failed to delete related org_tag entries:",
            tagDeleteError
          );
          throw new Error("Failed to delete related tags. Deletion aborted.");
        }

        // 3. Delete organization
        const { error: orgDeleteError } = await supabase
          .from("organization")
          .delete()
          .eq("org_id", selectedItem.org_id);

        if (orgDeleteError) {
          console.error("Failed to delete organization:", orgDeleteError);
          throw new Error("Failed to delete organization.");
        }

        // 5. Update local state
        setOrganizations(
          organizations.filter((org) => org.org_id !== selectedItem.org_id)
        );
        toast.custom(
          <SuccessToast message="Organization deleted successfully." />
        );
      } else if (actionType === "remove-admin") {
        // 1. Check if admin exists
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from("admin")
          .select("admin_id")
          .eq("admin_id", selectedItem.admin_id)
          .single();

        if (adminCheckError) {
          console.error("Admin check error:", adminCheckError);
          throw new Error("Admin not found.");
        }

        // 2. Delete the admin
        const { error } = await supabase
          .from("admin")
          .delete()
          .eq("admin_id", selectedItem.admin_id);

        if (error) {
          console.error("Admin removal error:", error);
          throw new Error("Failed to remove admin.");
        }

        // 3. Log the activity
        await logActivity({
          admin_id: currentAdminId,
          org_id: selectedItem.org_id,
          activity_content: `Removed admin: ${selectedItem.admin_name}`,
          activity_type: "remove_admin",
        });

        // 4. Update local state
        setAdmins(
          admins.filter((admin) => admin.admin_id !== selectedItem.admin_id)
        );

        toast.custom(<SuccessToast message="Admin removed successfully!" />);
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.custom(
        <ErrorToast message={`Operation failed: ${error.message}`} />
      );
    } finally {
      setModalOpen(false);
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

  return (
    <>
      <Navbar userRole="superadmin" />
      <div className="p-4 space-y-6 mt-21">
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        {/* Tabs */}
        <div className="bg-gray-100 p-2 rounded-md shadow-inner">
          <TabNavigation
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "Admins"
                ? "Search organization or admin"
                : "Search organization"
            }
          />

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
                      <th className={`text-left ${tableHeaderClasses} w-2/3`}>
                        Organization
                      </th>
                      <th className={`text-center ${tableHeaderClasses} w-1/3`}>
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
                          <td className="px-4 py-2 w-2/3">
                            <div className="flex items-center gap-3 min-w-0">
                              {org.org_logo ? (
                                <img
                                  src={org.org_logo}
                                  alt={`${org.org_name} Logo`}
                                  className="w-10 h-10 object-cover rounded-full flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                                  N/A
                                </div>
                              )}
                              <span className="font-medium text-base text-gray-800 truncate">
                                {org.org_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-2 w-1/3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setDetailsItem(org);
                                  setDetailsModal(true);
                                }}
                                className="flex items-center gap-1 bg-green hover:bg-emerald-600 cursor-pointer text-white text-sm px-3 py-1 rounded-full"
                              >
                                <FaEye /> View
                              </button>
                              <button
                                onClick={() => {
                                  // Navigate to edit page
                                  window.location.href = `/edit-org/${org.slug}`;
                                }}
                                className="flex items-center gap-1 bg-mustard hover:bg-amber-300 cursor-pointer text-gray-700 text-sm px-3 py-1 rounded-full"
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setActionType("delete-org");
                                  setSelectedItem(org);
                                  setModalOpen(true);
                                }}
                                className="flex items-center gap-1 bg-maroon hover:bg-red-700 cursor-pointer text-white text-sm px-3 py-1 rounded-full"
                              >
                                <FaRegTrashAlt /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
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
        {detailsModal && (
          <OrganizationDetails
            org={detailsItem}
            setDetailsModal={setDetailsModal}
          />
        )}
      </div>
    </>
  );
}
