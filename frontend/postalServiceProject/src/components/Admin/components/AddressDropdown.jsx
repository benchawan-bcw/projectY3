import React, { useEffect, useRef, useState } from "react";

const AddressDropdown = ({ onChange }) => {
  const formDivRef = useRef(null);
  const addressForm = useRef(null);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const initLongdo = async () => {
      await loadScript(
        "https://api.longdo.com/map/?key=fortestonlydonotuseinproduction!"
      );
      await loadScript(
        "https://api.longdo.com/address-form/js/addressform.js"
      );

      if (window.longdo && formDivRef.current) {
        addressForm.current = new window.longdo.AddressForm(formDivRef.current, {
          showLabels: true,
          type: "basic", // Basic dropdown แบบในรูป
          debugDiv: null,
        });

        addressForm.current.onChange = (data) => {
          // ส่งข้อมูลกลับ parent
          if (onChange) onChange(data);
        };
      }
    };

    initLongdo();
  }, []);

  return <div ref={formDivRef}></div>;
};

export default AddressDropdown;
