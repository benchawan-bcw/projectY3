const request = require("supertest");
const { expect } = require("chai");
const chai = require("chai");
const app = require("../server");
const authHeader = "Basic " + Buffer.from("admin:bands").toString("base64");


describe("Users API (supertest)", function () {
  this.timeout(5000);

  let testItemId;
  let parcelId;

  // ===== CREATE =====
  it("POST /admin-ban-poolsub/registerParcel - should create a new parcel", (done) => {
    const newParcel = {
      tracking_number:  `EM${Date.now()}`,
      sender: "Alice",
      sender_phone: "0812345678",
      receiver: "Bob",
      receiver_phone: "0898765432",
      address: "123/45 Some St, Bangkok",
      weight: 20.5,
      equipment: [{ name: "Box", quantity: 1, price: 50 }],
      service_type: "EMS", // เพิ่ม
      postcode: "10100", // เพิ่ม
      isIsland: false, // เพิ่ม
      packagingCost: 0, // เพิ่ม
      total_price: 100, // เพิ่ม
    };

    request(app)
      .post("/admin-ban-poolsub/registerParcel")
      .set("Authorization", authHeader)
      .send(newParcel)
      .expect(201)
      .expect((res) => {
        console.log("res.body registerParcel:", res.body);
        expect(res.body).to.have.property("parcel"); // แก้ตรงนี้
        expect(res.body.parcel).to.have.property("_id"); // _id อยู่ใน parcel
        parcelId = res.body.parcel._id;
      })
      .end(done);
  });

  // ===== GET =====
  describe("GET /admin-ban-poolsub/getParcels", function () {
    it("should return all items with status 200", function (done) {
      request(app)
        .get("/admin-ban-poolsub/getParcels")
        .set("Authorization", authHeader)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(function (res) {
          // ตรวจสอบว่า response เป็น array
          if (!Array.isArray(res.body)) {
            throw new Error("Response should be an array");
          }
          // ตรวจสอบว่ามีข้อมูลเริ่มต้น
          if (res.body.length < 2) {
            throw new Error("Should have at least 2 initial items");
          }
        })
        .end(done);
    });
  });

});
