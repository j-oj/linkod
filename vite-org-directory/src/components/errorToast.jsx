const ErrorToast = ({ message }) => (
  <div
    style={{
      background: "#fee2e2",
      color: "#991b1b",
      padding: "16px 24px",
      borderRadius: "10px",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      minWidth: "300px",
      textAlign: "center",
      fontWeight: "500",
    }}
  >
    ❌ {message}
  </div>
);
export default ErrorToast;
