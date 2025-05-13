export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
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
  );
}
