const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");
const request = require("supertest");
// const chai = require("chai");
// const chaiHttp = require("chai-http");
const sinon = require("sinon");
const axios = require("axios");
const app = require("../server");
// chai.use(chaiHttp);
// const expect = chai.expect;
const { expect } = require("chai");
const { describe } = require("mocha");

const Parcels = require("../models/parcels");
const thaiPostToken = require("../config/memberToken");
const tempPath = path.join(__dirname, "../config/tempEquipment.json");
const authHeader = "Basic " + Buffer.from("admin:bands").toString("base64");

const sampleData = [
  { name: "Box", price: 50 },
  { name: "Envelope", price: 20 },
];

describe("Users API (supertest)", function () {
  this.timeout(10000);

  let mongoServer;
  let parcelId;

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

  before(async function () {
    // สร้าง MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(uri);

    // Mock fetch ให้เหมือน response จริง
    global.fetch = sinon.stub().resolves({
      text: async () =>
        JSON.stringify({
          items: [{ barcode: newParcel.tracking_number, status: "รออัปเดต" }],
        }),
    });

    // Mock getThaiPostToken
    sinon.stub(thaiPostToken, "getThaiPostToken").resolves("dummy-token");
  });

  after(async function () {
    await mongoose.disconnect();
    await mongoServer.stop();
    sinon.restore();
  });

  // ===== POST registerParcel =====
  describe("POST /admin-ban-poolsub/registerParcel", function () {
    it("should create a new parcel successfully", async () => {
      const parcelData = { ...newParcel, tracking_number: `EM${Date.now()}` };
      const res = await request(app)
        .post("/admin-ban-poolsub/registerParcel")
        .set("Authorization", authHeader)
        .send(newParcel)
        .expect(201);

      expect(res.body).to.have.property("message", "ลงทะเบียนพัสดุสำเร็จ");
      expect(res.body).to.have.property("parcel");

      const parcel = res.body.parcel;
      expect(parcel).to.have.property("_id");
      expect(parcel.sender).to.equal(newParcel.sender);
      expect(parcel.receiver).to.equal(newParcel.receiver);
      expect(parcel.total_price).to.equal(newParcel.total_price);
      expect(parcel.parcel_status).to.equal("รออัปเดต");

      parcelId = parcel._id.toString();

      // ตรวจสอบใน DB
      const dbParcel = await Parcels.findById(parcelId);
      expect(dbParcel).to.not.be.null;
      expect(dbParcel.sender).to.equal(newParcel.sender);
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/admin-ban-poolsub/registerParcel")
        .set("Authorization", authHeader)
        .send({ sender: "Alice" })
        .expect(400);

      expect(res.body).to.have.property(
        "message",
        "กรุณากรอกข้อมูลให้ครบทุกช่อง"
      );
    });

    it("should return 400 if tracking_number already exists", async () => {
      const parcelData = {
        tracking_number: "EM123456",
        sender: "Alice",
        sender_phone: "0812345678",
        receiver: "Bob",
        receiver_phone: "0898765432",
        address: "123/45 Some St, Bangkok",
        weight: 20.5,
        equipment: [{ name: "Box", quantity: 1, price: 50 }],
        service_type: "EMS",
        postcode: "10100",
        total_price: 100,
      };

      // สร้าง parcel ก่อน
      await Parcels.create(parcelData);

      // ส่งซ้ำ
      const res = await request(app)
        .post("/admin-ban-poolsub/registerParcel")
        .set("Authorization", authHeader)
        .send(parcelData)
        .expect(400);

      expect(res.body).to.have.property(
        "message",
        "Tracking number already exists"
      );
    });
  });

  // ===== GET getParcels =====
  describe("GET /admin-ban-poolsub/getParcels", function () {
    beforeEach(async () => {
      await Parcels.deleteMany({});
    });

    // ===== TEST 1: ไม่มีข้อมูลพัสดุ =====
    it("should return empty array if no parcels exist", async () => {
      const res = await request(app)
        .get("/admin-ban-poolsub/getParcels")
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });

    // ===== TEST 2: มีข้อมูลพัสดุในระบบ =====
    it("should return all parcels sorted by update_at descending", async () => {
      const now = new Date();

      // สร้างพัสดุจำลอง 2 รายการ
      const parcel1 = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_1`,
      });
      const parcel2 = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_2`,
      });

      const res = await request(app)
        .get("/admin-ban-poolsub/getParcels")
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.be.an("array");
      expect(res.body.length).to.equal(2);

      // ตรวจสอบว่ารายการล่าสุดอยู่ลำดับแรก
      expect(res.body[0].tracking_number).to.equal(parcel2.tracking_number);
      expect(res.body[1].tracking_number).to.equal(parcel1.tracking_number);
    });

    // ===== TEST 3: ตรวจสอบโครงสร้างข้อมูลที่ส่งกลับ =====
    it("should return parcels with required fields", async () => {
      await Parcels.create({
        tracking_number: `EM${Date.now()}`,
        sender: "Charlie",
        sender_phone: "0812345678",
        receiver: "David",
        receiver_phone: "0898765432",
        address: "123/45 Some St, Bangkok",
        weight: 20.5,
        equipment: [{ name: "Box", quantity: 1, price: 50 }],
        service_type: "EMS",
        postcode: "10100",
        isIsland: false,
        packagingCost: 0,
        total_price: 100,
      });

      const res = await request(app)
        .get("/admin-ban-poolsub/getParcels")
        .set("Authorization", authHeader)
        .expect(200);

      const parcel = res.body[0];
      expect(parcel).to.have.property("_id");
      expect(parcel).to.have.property("tracking_number");
      expect(parcel).to.have.property("sender");
      expect(parcel).to.have.property("receiver");
      expect(parcel).to.have.property("weight");
    });

    // ===== TEST 4: จำลอง DB error =====
    it("should handle database errors gracefully", async () => {
      const stub = sinon.stub(Parcels, "find").throws(new Error("DB failure"));

      const res = await request(app)
        .get("/admin-ban-poolsub/getParcels")
        .set("Authorization", authHeader)
        .expect(500);

      expect(res.body).to.have.property("message", "Server error");

      stub.restore();
    });
  });

  // ===== PUT editParcel =====
  describe("PUT /admin-ban-poolsub/editParcel/:id", function () {
    beforeEach(async function () {
      // ล้าง DB ก่อนทุก test
      await Parcels.deleteMany({});

      const parcel = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_PUT`,
      });

      parcelId = parcel._id.toString();
    });

    afterEach(function () {
      sinon.restore();
    });

    it("should update a parcel successfully", async () => {
      const updatedData = {
        tracking_number: `EM${Date.now()}`,
        sender: "Alice update",
        sender_phone: "0812345678",
        receiver: "Bob update",
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
        .put(`/admin-ban-poolsub/editParcel/${parcelId}`)
        .set("Authorization", authHeader)
        .send(updatedData)
        .expect(200);

      expect(res.body).to.have.property("_id", parcelId);
      expect(res.body.sender).to.equal(updatedData.sender);
      expect(res.body.receiver).to.equal(updatedData.receiver);
      expect(res.body.weight).to.equal(updatedData.weight);

      // ตรวจสอบ update_at เปลี่ยน
      const oldDate = new Date();
      expect(new Date(res.body.update_at).getTime()).to.be.at.least(
        oldDate.getTime() - 1000
      );
    });

    it("should return null if parcel id does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/admin-ban-poolsub/editParcel/${nonExistentId}`)
        .set("Authorization", authHeader)
        .send({ sender: "X" })
        .expect(200);

      expect(res.body).to.be.null;
    });

    it("should handle database errors gracefully", async () => {
      const stub = sinon
        .stub(Parcels, "findOneAndUpdate")
        .throws(new Error("DB failure"));

      const res = await request(app)
        .put(`/admin-ban-poolsub/editParcel/${parcelId}`)
        .set("Authorization", authHeader)
        .send({ sender: "Error" })
        .expect(500);

      expect(res.body).to.have.property("message", "Server error");

      stub.restore();
    });
  });

  // ===== DELETE deleteParcel =====
  describe("DELETE /admin-ban-poolsub/deleteParcel/:id", function () {
    let parcelId;

    // ก่อนแต่ละ test ล้าง DB และสร้างพัสดุตัวอย่าง
    beforeEach(async function () {
      await Parcels.deleteMany({});

      const parcel = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_DEL`,
      });
      parcelId = parcel._id.toString();
    });

    afterEach(function () {
      sinon.restore();
    });

    it("should delete a parcel successfully", async () => {
      const res = await request(app)
        .delete(`/admin-ban-poolsub/deleteParcel/${parcelId}`)
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.have.property("_id", parcelId);
      expect(res.body.sender).to.equal("Alice");

      // ตรวจสอบว่า DB ไม่มีข้อมูลนี้แล้ว
      const dbParcel = await Parcels.findById(parcelId);
      expect(dbParcel).to.be.null;
    });

    it("should return null if parcel id does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/admin-ban-poolsub/deleteParcel/${nonExistentId}`)
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.be.null;
    });

    it("should handle database errors gracefully", async () => {
      const stub = sinon
        .stub(Parcels, "findOneAndDelete")
        .throws(new Error("DB failure"));

      const res = await request(app)
        .delete(`/admin-ban-poolsub/deleteParcel/${parcelId}`)
        .set("Authorization", authHeader)
        .send()
        .expect(500);

      expect(res.body).to.have.property("message", "Server error");

      stub.restore();
    });
  });

  // ===== POST calculateEms =====
  describe("POST /admin-ban-poolsub/calculateEms", function () {
    it("should calculate EMS cost correctly for normal area", async () => {
      const res = await request(app)
        .post("/admin-ban-poolsub/calculateEms")
        .set("Authorization", authHeader)
        .send({ weight: 50, postcode: "10100", packagingCost: 5 })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.isIsland).to.be.false;
      // จาก emsCost.json: weight=50 → price=47 + packagingCost=5 = 52
      expect(res.body.totalCost).to.equal(52);
    });

    it("should add island surcharge if postcode is island", async () => {
      const res = await request(app)
        .post("/admin-ban-poolsub/calculateEms")
        .set("Authorization", authHeader)
        .send({ weight: 50, postcode: "20120", packagingCost: 0 })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.isIsland).to.be.true;
      // price=47 + island=15 = 62
      expect(res.body.totalCost).to.equal(62);
    });

    it("should return 400 for invalid postcode", async () => {
      const res = await request(app)
        .post("/admin-ban-poolsub/calculateEms")
        .set("Authorization", authHeader)
        .send({ weight: 50, postcode: "abcde", packagingCost: 0 })
        .expect(400);

      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal("Invalid postcode");
    });

    it("should throw error if weight exceeds EMS rate table", async () => {
      const res = await request(app)
        .post("/admin-ban-poolsub/calculateEms")
        .set("Authorization", authHeader)
        .send({ weight: 50000, postcode: "10100", packagingCost: 0 })
        .expect(500);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("ไม่พบอัตราค่าส่งสำหรับน้ำหนักนี้");
    });
  });

  // ===== GET equipment =====
  describe("GET /admin-ban-poolsub/equipment", function () {
    beforeEach(() => {
      fs.writeFileSync(tempPath, JSON.stringify(sampleData), "utf-8");
      sinon.stub(path, "join").returns(tempPath);
    });

    // หลัง test: ลบไฟล์ชั่วคราว
    afterEach(() => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      sinon.restore();
    });

    it("should return equipment data successfully", async () => {
      const res = await request(app)
        .get("/admin-ban-poolsub/equipment")
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.be.an("array");
      expect(res.body.length).to.equal(sampleData.length);
      expect(res.body[0]).to.have.property("name", "Box");
      expect(res.body[0]).to.have.property("price", 50);
    });

    it("should handle empty equipment file", async () => {
      // เขียนไฟล์ว่าง
      fs.writeFileSync(tempPath, "[]", "utf-8");

      const res = await request(app)
        .get("/admin-ban-poolsub/equipment")
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.be.an("array").that.is.empty;
    });

    it("should handle invalid JSON in file", async () => {
      // เขียน JSON ผิดพลาด
      fs.writeFileSync(tempPath, "{invalid_json}", "utf-8");

      const res = await request(app)
        .get("/admin-ban-poolsub/equipment")
        .set("Authorization", authHeader)
        .expect(500);

      expect(res.body).to.have.property(
        "message",
        "ไม่สามารถอ่านไฟล์อุปกรณ์ได้"
      );
    });

    it("should handle fs.readFileSync throwing error", async () => {
      // stub ให้ fs.readFileSync throw error
      sinon.stub(fs, "readFileSync").throws(new Error("File read error"));

      const res = await request(app)
        .get("/admin-ban-poolsub/equipment")
        .set("Authorization", authHeader)
        .expect(500);

      expect(res.body).to.have.property(
        "message",
        "ไม่สามารถอ่านไฟล์อุปกรณ์ได้"
      );
    });
  });

  // // ===== POST selectPayment =====
  // describe("POST /admin-ban-poolsub/selectPayment", function () {
  //   it("should return 400 if paymentMethod or total_price missing", async () => {
  //     const res = await chai
  //       .request(app)
  //       .post("/admin-ban-poolsub/selectPayment")
  //       .set("Authorization", authHeader)
  //       .send({});
  //     expect(res).to.have.status(400);
  //     expect(res.body.message).to.equal("กรุณาระบุช่องทางชำระเงินและยอดรวม");
  //   });

  //   it("should process cash payment correctly", async () => {
  //     const res = await chai
  //       .request(app)
  //       .post("/admin-ban-poolsub/selectPayment")
  //       .set("Authorization", authHeader)
  //       .send({ paymentMethod: "cash", total_price: 100, customer_paid: 150 });
  //     expect(res).to.have.status(200);
  //     expect(res.body).to.have.property("change");
  //   });

  //   it("should generate QR for qr payment", async () => {
  //     const res = await chai
  //       .request(app)
  //       .post("/admin-ban-poolsub/selectPayment")
  //       .set("Authorization", authHeader)
  //       .send({ paymentMethod: "qr", total_price: 100 });
  //     expect(res).to.have.status(200);
  //     expect(res.body).to.have.property("qrCode"); // ขึ้นกับ generateQrPayment จริง
  //   });

  //   it("should return 400 for invalid paymentMethod", async () => {
  //     const res = await chai
  //       .request(app)
  //       .post("/admin-ban-poolsub/selectPayment")
  //       .set("Authorization", authHeader)
  //       .send({ paymentMethod: "invalid", total_price: 100 });
  //     expect(res).to.have.status(400);
  //     expect(res.body.message).to.equal("ช่องทางชำระเงินไม่ถูกต้อง");
  //   });
  // });

  // ===== PUT updatePayment =====
  describe("PUT /admin-ban-poolsub/updatePayment", function () {
    afterEach(async () => {
      await Parcels.deleteMany({});
    });

    it("should update payment successfully", async function () {
      const parcel = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_PUT`,
      });

      const payload = {
        total_price: 120,
        net_price: 110,
        payment_method: "Cash",
        customer_paid: 120,
      };

      const res = await request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .send(payload)
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).to.have.property(
        "message",
        "อัปเดตข้อมูลการชำระเงินสำเร็จ"
      );
      expect(res.body.parcel).to.have.property(
        "tracking_number",
        parcel.tracking_number
      );
      expect(res.body.parcel).to.have.property(
        "total_price",
        payload.total_price
      );
      expect(res.body.parcel).to.have.property("net_price", payload.net_price);
      expect(res.body.parcel).to.have.property(
        "payment_method",
        payload.payment_method
      );
      expect(res.body.parcel).to.have.property(
        "customer_paid",
        payload.customer_paid
      );
      expect(res.body.parcel).to.have.property(
        "payment_status",
        "ชำระเงินเรียบร้อย"
      );
      expect(res.body.parcel.receipt_number).to.match(/^BILL-\d{6}$/);
    });

    it("should return 404 if no parcels in database", async function () {
      const payload = {
        total_price: 120,
        net_price: 110,
        payment_method: "Cash",
        customer_paid: 120,
      };

      const res = await request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .send(payload)
        .set("Authorization", authHeader)
        .expect(404);

      expect(res.body).to.have.property("message", "ไม่พบพัสดุในระบบ");
    });

    it("should return 404 if parcel to update not found", async function () {
      const parcel = await Parcels.create({
        ...newParcel,
        tracking_number: `EM${Date.now()}_PUT`,
      });

      // stub ให้ findOneAndUpdate คืนค่า null
      sinon.stub(Parcels, "findOneAndUpdate").resolves(null);

      const payload = {
        total_price: 120,
        net_price: 110,
        payment_method: "Cash",
        customer_paid: 120,
      };

      const res = await request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .send(payload)
        .set("Authorization", authHeader)
        .expect(404);

      expect(res.body).to.have.property(
        "message",
        "ไม่พบข้อมูลพัสดุที่ต้องการอัปเดต"
      );
    });

    it("should handle database errors gracefully", async function () {
      sinon.stub(Parcels, "findOne").throws(new Error("DB failure"));

      const payload = {
        total_price: 120,
        net_price: 110,
        payment_method: "Cash",
        customer_paid: 120,
      };

      const res = await request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .send(payload)
        .set("Authorization", authHeader)
        .expect(500);

      expect(res.body).to.have.property(
        "message",
        "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
      );
      expect(res.body).to.have.property("error", "DB failure");
    });
  });
});
