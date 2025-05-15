const SuccessToast = ({ message }) => (
  <div
    style={{
      background: "#d1fae5",
      color: "#065f46",
      padding: "16px 24px",
      borderRadius: "10px",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      minWidth: "300px",
      textAlign: "center",
      fontWeight: "500",
    }}
    className="flex justify-center mt-30"
  >
    ✅ {message}
  </div>
);
export default SuccessToast;
