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
      style={{ width: "100%", height: "290px", border: "0" }}
      title="Longdo Address Form"
    />
  );
};

export default LongdoAddressIframe;
