import { useState } from "react";
import { FaRegTrashAlt, FaUserTimes, FaSearch } from "react-icons/fa";
import ConfirmAction from "../components/ui/confirmAction";
import Navbar from "../components/navbar";
import ActionButton from "../components/ui/actionbutton";

const TABS = ["Activity Log", "Admins", "Organizations"];

export default function SAdminDashboard() {
  const [activeTab, setActiveTab] = useState("Activity Log");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const handleConfirm = () => {
    if (actionType === "delete-org") {
      console.log("Deleted organization:", selectedItem);
    } else if (actionType === "remove-admin") {
      console.log("Removed admin:", selectedItem);
    }
    setModalOpen(false);
  };

  const tableBaseClasses = "w-full min-w-[500px] text-sm text-left";
  const tableHeaderClasses = "bg-maroon text-white px-4 py-2";

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
            />
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto bg-white rounded-md shadow-sm mt-4">
            {activeTab === "Organizations" && (
              <table className={`min-w-full ${tableBaseClasses}`}>
                <thead>
                  <tr>
                    <th className={`text-left ${tableHeaderClasses}`}>
                      Organization
                    </th>
                    <th className={`text-center ${tableHeaderClasses}`}>
                      Last Updated
                    </th>
                    <th className={`text-center ${tableHeaderClasses}`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((org) => (
                    <tr key={org} className="border-t">
                      <td className="px-4 py-2 text-left">
                        Organization {org}
                      </td>
                      <td className="px-4 py-2 text-center">
                        mm/dd/yyyy, 0:00 PM
                      </td>
                      <td className="px-4 py-2 place-items-center">
                        <button
                          onClick={() => {
                            setActionType("delete-org");
                            setSelectedItem(`Organization ${org}`);
                            setModalOpen(true);
                          }}
                          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 cursor-pointer text-red-700 text-sm px-3 py-1 rounded-full"
                        >
                          <FaRegTrashAlt /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "Admins" && (
              <table className={`min-w-full ${tableBaseClasses}`}>
                <thead>
                  <tr>
                    <th className={`text-left ${tableHeaderClasses}`}>Admin</th>
                    <th className={`text-left ${tableHeaderClasses}`}>
                      Organization
                    </th>
                    <th className={`text-center ${tableHeaderClasses}`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((admin) => (
                    <tr key={admin} className="border-t">
                      <td className="px-4 py-2">
                        Admin {admin}
                        <div className="text-xs text-gray-500">
                          admin{admin}_Org{(admin % 2) + 1}@example.com
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        Organization {(admin % 2) + 1}
                      </td>
                      <td className="px-4 py-2 place-items-center">
                        <button
                          onClick={() => {
                            setActionType("remove-admin");
                            setSelectedItem(`Admin ${admin}`);
                            setModalOpen(true);
                          }}
                          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 cursor-pointer text-red-700 text-sm px-3 py-1 rounded-full"
                        >
                          <FaUserTimes /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "Activity Log" && (
              <table className={`min-w-full ${tableBaseClasses}`}>
                <thead className="text-center">
                  <tr>
                    <th className={`text-left ${tableHeaderClasses}`}>Admin</th>
                    <th className={tableHeaderClasses}>Organization</th>
                    <th className={tableHeaderClasses}>Action</th>
                    <th className={tableHeaderClasses}>Date and Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((log) => (
                    <tr key={log} className="border-t text-center">
                      <td className="px-4 py-2 text-left">
                        Admin {log}
                        <div className="text-xs text-gray-500">
                          admin{log}_Org{(log % 3) + 1}@example.com
                        </div>
                      </td>
                      <td className="px-4 py-2">Org {(log % 3) + 1}</td>
                      <td className="px-4 py-2">
                        {
                          [
                            "Requested logo change",
                            "Added a new announcement",
                            "Logged in",
                            "Updated description",
                          ][log % 4]
                        }
                      </td>
                      <td className="px-4 py-2">mm/dd/yyyy, 0:00 PM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ActionButton type="top" />
        </div>

        <ConfirmAction
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
          title="Confirm Action"
          warning={
            actionType === "delete-org"
              ? "Are you sure you want to delete this organization?"
              : "Are you sure you want to remove this admin?"
          }
          subtitle="This item will be deleted immediately. You can’t undo this action."
          confirmText={actionType === "delete-org" ? "Delete" : "Remove"}
          cancelText="Cancel"
        />
      </div>
    </>
  );
}
