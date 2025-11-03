import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  // คำนวณราคารวมอุปกรณ์
      // const totalEquipmentPrice = equipment.reduce(
      //   (sum, item) => sum + (item.price || 0),
      //   0
      // );
      // คำนวณราคารวมทั้งหมด (รวมค่าส่ง)
      // const shippingCostNumber =
      //   typeof shippingCost === "number"
      //     ? shippingCost
      //     : shippingCost.total || 0;
      // const totalPriceNumber = totalEquipmentPrice + shippingCostNumber;

  return (
    <div>
      <h3>ใบเสร็จชำระเงิน</h3>
      
    </div>
  );
};

export default Payment;
