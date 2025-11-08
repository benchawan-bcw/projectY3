const request = require("supertest");
const chai = require("chai");
const sinon = require("sinon");
const app = require("../server");
const expect = chai.expect;
const Parcels = require("../models/parcels");

const {
  calculateCash,
  generateQrPayment,
} = require("../controllers/adminController");

const authHeader = "Basic " + Buffer.from("admin:bands").toString("base64");

describe("Users API (supertest)", function () {
  this.timeout(5000);

  let parcelId;
  let latestParcelId;

  // ===== POST registerParcel =====
  it("POST /admin-ban-poolsub/registerParcel - should create a new parcel", async () => {
    const newParcel = {
      tracking_number: `EM${Date.now()}`,
      sender: "Alice",
      sender_phone: "0812345678",
      receiver: "Bob",
      receiver_phone: "0898765432",
      address: "123/45 Some St, Bangkok",
      weight: 20.5,
      equipment: [{ name: "Box", quantity: 1, price: 50 }],
      service_type: "EMS",
      postcode: "10100",
      isIsland: false,
      packagingCost: 0,
      total_price: 100,
    };

    const res = await request(app)
      .post("/admin-ban-poolsub/registerParcel")
      .set("Authorization", authHeader)
      .send(newParcel)
      .expect(201);

    expect(res.body).to.have.property("parcel");
    expect(res.body.parcel).to.have.property("_id");
    parcelId = res.body.parcel._id;
    latestParcelId = (
      await Parcels.findOne().sort({ update_at: -1 })
    )._id.toString();
  });

  // ===== GET getParcels =====
  it("GET /admin-ban-poolsub/getParcels - should return all items with status 200", async () => {
    const res = await request(app)
      .get("/admin-ban-poolsub/getParcels")
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /json/);
    if (!Array.isArray(res.body))
      throw new Error("Response should be an array");
    if (res.body.length < 2)
      throw new Error("Should have at least 2 initial items");
  });

  // ===== PUT editParcel =====
  it("PUT /admin-ban-poolsub/editParcel/:id - should update an existing parcel", async () => {
    const updatedData = {
      sender: "Alice Updated",
      receiver: "Bob Updated",
      weight: 25.0,
      equipment: [{ name: "Box", quantity: 2, price: 60 }],
      total_price: 150,
    };

    const res = await request(app)
      .put(`/admin-ban-poolsub/editParcel/${parcelId}`)
      .set("Authorization", authHeader)
      .send(updatedData)
      .expect(200);

    expect(res.body.sender).to.equal(updatedData.sender);
  });

  // ===== DELETE deleteParcel =====
  it("DELETE /admin-ban-poolsub/deleteParcel/:id - should delete an existing parcel", async () => {
    // ตรวจสอบว่ามี parcelId
    if (!parcelId) throw new Error("parcelId is undefined");

    const res = await request(app)
      .delete(`/admin-ban-poolsub/deleteParcel/${parcelId}`)
      .set("Authorization", authHeader)
      .expect(200);

    // ตรวจสอบว่าข้อมูลที่ถูกลบตรงกับ parcelId
    expect(res.body).to.have.property("_id", parcelId);
    expect(res.body).to.have.property("sender");
    expect(res.body).to.have.property("receiver");

    // ตรวจสอบว่าใน DB ไม่มี parcelId นี้แล้ว
    const deleted = await Parcels.findById(parcelId);
    expect(deleted).to.be.null;
  });

  // ===== GET equipment =====
  it("GET /admin-ban-poolsub/equipment - should return equipment list", async () => {
    const res = await request(app)
      .get("/admin-ban-poolsub/equipment")
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /json/);

    // ตรวจสอบว่าเป็น object
    expect(res.body).to.be.an("object");

    // ตรวจสอบทุก category ว่าเป็น array
    Object.keys(res.body).forEach((category) => {
      expect(res.body[category]).to.be.an("array");
      res.body[category].forEach((item) => {
        expect(item).to.have.property("name");
        expect(item).to.have.property("price");
      });
    });
  });

  // ===== POST selectPayment =====
  describe("POST /admin-ban-poolsub/selectPayment", function () {
    it("should return 400 if paymentMethod or total_price missing", async () => {
      const res = await chai
        .request(app)
        .post("/admin-ban-poolsub/selectPayment")
        .set("Authorization", authHeader)
        .send({});
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("กรุณาระบุช่องทางชำระเงินและยอดรวม");
    });

    it("should process cash payment correctly", async () => {
      const res = await chai
        .request(app)
        .post("/admin-ban-poolsub/selectPayment")
        .set("Authorization", authHeader)
        .send({ paymentMethod: "cash", total_price: 100, customer_paid: 150 });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("change"); 
    });

    it("should generate QR for qr payment", async () => {
      const res = await chai
        .request(app)
        .post("/admin-ban-poolsub/selectPayment")
        .set("Authorization", authHeader)
        .send({ paymentMethod: "qr", total_price: 100 });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("qrCode"); // ขึ้นกับ generateQrPayment จริง
    });

    it("should return 400 for invalid paymentMethod", async () => {
      const res = await chai
        .request(app)
        .post("/admin-ban-poolsub/selectPayment")
        .set("Authorization", authHeader)
        .send({ paymentMethod: "invalid", total_price: 100 });
      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("ช่องทางชำระเงินไม่ถูกต้อง");
    });
  });

  // ===== PUT updatePayment =====
  it("PUT /admin-ban-poolsub/updatePayment - should update payment info of the latest parcel", async () => {
    const paymentData = {
      total_price: 120,
      net_price: 115,
      payment_method: "เงินสด",
      customer_paid: 120,
    };

    const res = await request(app)
      .put("/admin-ban-poolsub/updatePayment")
      .set("Authorization", authHeader)
      .send(paymentData)
      .expect(200);

    // ตรวจสอบโครงสร้าง response
    expect(res.body).to.have.property(
      "message",
      "อัปเดตข้อมูลการชำระเงินสำเร็จ"
    );
    expect(res.body).to.have.property("parcel");

    const parcel = res.body.parcel;
    expect(parcel.total_price).to.equal(paymentData.total_price);
    expect(parcel.net_price).to.equal(paymentData.net_price);
    expect(parcel.payment_method).to.equal(paymentData.payment_method);
    expect(parcel.customer_paid).to.equal(paymentData.customer_paid);
    expect(parcel.payment_status).to.equal("ชำระเงินเรียบร้อย");
    expect(parcel).to.have.property("receipt_number");
    expect(parcel.update_at).to.be.a("string");
  });
});
