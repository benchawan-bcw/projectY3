import React, { useEffect } from "react";

const LongdoAddressIframe = ({ onChange }) => {
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === "LONGDO_ADDRESS") {
        onChange?.(event.data.data);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onChange]);

  return (
    <iframe
  src="/longdo-form.html"
  title="Longdo Address Form"
  style={{
    width: "100%",
    height: "290px",
    border: "none",
    outline: "none",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  }}
/>
  );
};

export default LongdoAddressIframe;
