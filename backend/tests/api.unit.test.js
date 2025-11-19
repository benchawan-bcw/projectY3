const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");
const request = require("supertest");
const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const axios = require("axios");
const app = require("../server");
chai.use(chaiHttp);
// const expect = chai.expect;
const { expect } = chai;
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

      expect(res.body).to.have.property("message", "ลบข้อมูลพัสดุสําเร็จ");
      expect(res.body).to.have.property("deletedParcel");
      expect(res.body.deletedParcel).to.have.property("_id", parcelId);
      expect(res.body.deletedParcel.sender).to.equal("Alice");

      // ตรวจสอบว่า DB ไม่มีข้อมูลนี้แล้ว
      const dbParcel = await Parcels.findById(parcelId);
      expect(dbParcel).to.be.null;
    });

    it("should return error message if parcel id does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/admin-ban-poolsub/deleteParcel/${nonExistentId}`)
        .set("Authorization", authHeader)
        .expect(404);

      expect(res.body).to.have.property("message", "ไม่พบข้อมูลพัสดุ");
    });

    it("should handle database errors gracefully", async () => {
      const stub = sinon
        .stub(Parcels, "findOneAndDelete")
        .throws(new Error("DB failure"));

      const res = await request(app)
        .delete(`/admin-ban-poolsub/deleteParcel/${parcelId}`)
        .set("Authorization", authHeader)
        .expect(404);

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

  // ===== PUT updatePaymentForQrCode =====
  describe("PUT /admin-ban-poolsub/updatePaymentForQrCode", function () {
    let bulkWriteStub;

    beforeEach(() => {
      bulkWriteStub = sinon.stub(Parcels, "bulkWrite");
    });

    afterEach(() => {
      sinon.restore();
    });

    // กรณี 1: ไม่ส่ง parcels -> 400
    it("should return 400 if parcels not provided", async () => {
      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePaymentForQrCode")
        .set("Authorization", authHeader)
        .send({
          payment_method: "qr",
          customer_paid: 100,
          receipt_number: "RC12345",
        });

      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.property("message")
        .that.equals("ต้องระบุพัสดุที่จะอัปเดต");
    });

    // กรณี 2: ส่ง parcels = [] -> 400
    it("should return 400 if parcels array is empty", async () => {
      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePaymentForQrCode")
        .set("Authorization", authHeader)
        .send({ parcels: [] });

      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.property("message")
        .that.equals("ต้องระบุพัสดุที่จะอัปเดต");
    });

    // กรณี 3: อัปเดตสำเร็จ (200)
    it("should update payment successfully", async () => {
      bulkWriteStub.resolves({ modifiedCount: 2 });

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePaymentForQrCode")
        .set("Authorization", authHeader)
        .send({
          parcels: [
            { _id: new mongoose.Types.ObjectId(), total_price: 100 },
            { _id: new mongoose.Types.ObjectId(), total_price: 200 },
          ],
          payment_method: "qr",
          customer_paid: 300,
          receipt_number: "RC999",
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("modifiedCount", 2);
      expect(res.body.message).to.include("อัปเดตข้อมูลการชำระเงินเรียบร้อย");
    });

    // กรณี 4: ไม่มีพัสดุในฐานข้อมูล (bulkWrite คืนค่า modifiedCount = 0)
    it("should return 404 if no parcels were updated", async () => {
      bulkWriteStub.resolves({ modifiedCount: 0 });

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePaymentForQrCode")
        .set("Authorization", authHeader)
        .send({
          parcels: [{ _id: new mongoose.Types.ObjectId(), total_price: 100 }],
          payment_method: "qr",
          customer_paid: 100,
          receipt_number: "RC404",
        });

      expect(res).to.have.status(404); // ❗ ถ้าอยากให้เป็น 404 ต้องแก้ใน controller ด้วย
      expect(res.body.modifiedCount).to.equal(0);
      expect(res.body.message).to.include("ไม่พบพัสดุ");
    });

    // กรณี 5: เกิดข้อผิดพลาดในฐานข้อมูล (throw error)
    it("should handle database errors gracefully", async () => {
      bulkWriteStub.rejects(new Error("Database connection failed"));

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePaymentForQrCode")
        .set("Authorization", authHeader)
        .send({
          parcels: [{ _id: new mongoose.Types.ObjectId(), total_price: 100 }],
          payment_method: "qr",
          customer_paid: 100,
          receipt_number: "RCERR",
        });

      expect(res).to.have.status(500);
      expect(res.body)
        .to.have.property("message")
        .that.equals("เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์");
      expect(res.body.error).to.include("Database connection failed");
    });
  });

  // ===== PUT updatePayment =====
  describe("PUT /admin-ban-poolsub/updatePayment", function () {
    let bulkWriteStub;

    beforeEach(() => {
      // stub bulkWrite ของ Mongoose model
      bulkWriteStub = sinon.stub(Parcels, "bulkWrite");
    });

    afterEach(() => {
      // restore stub หลังแต่ละ test
      bulkWriteStub.restore();
    });

    // กรณี 1: ไม่ส่ง parcels -> 400
    it("should return 400 if parcels not provided", async () => {
      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          net_price: 500,
          payment_method: "cash",
          customer_paid: 500,
        });

      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.property("message")
        .that.equals("ต้องระบุพัสดุที่จะอัปเดต");
    });

    // กรณี 2: ส่ง parcels = [] -> 400
    it("should return 400 if parcels array is empty", async () => {
      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          parcels: [],
          net_price: 500,
          payment_method: "cash",
          customer_paid: 500,
        });

      expect(res).to.have.status(400);
      expect(res.body)
        .to.have.property("message")
        .that.equals("ต้องระบุพัสดุที่จะอัปเดต");
    });

    // กรณี 3: อัปเดตสำเร็จ (cash) -> 200
    it("should update payment successfully with cash", async () => {
      bulkWriteStub.resolves({ modifiedCount: 2 });

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          parcels: [
            { _id: new mongoose.Types.ObjectId(), total_price: 150 },
            { _id: new mongoose.Types.ObjectId(), total_price: 250 },
          ],
          net_price: 400,
          payment_method: "cash",
          customer_paid: 500,
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.include("อัปเดตข้อมูลการชำระเงินเรียบร้อย");
    });

    // กรณี 4: อัปเดตสำเร็จ (non-cash) -> 200
    it("should update payment successfully with non-cash", async () => {
      bulkWriteStub.resolves({ modifiedCount: 2 });

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          parcels: [
            { _id: new mongoose.Types.ObjectId(), total_price: 300 },
            { _id: new mongoose.Types.ObjectId(), total_price: 400 },
          ],
          net_price: 700,
          payment_method: "credit",
          customer_paid: 0,
        });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.include("อัปเดตข้อมูลการชำระเงินเรียบร้อย");
    });

    // กรณี 5: ไม่มีพัสดุถูกอัปเดต -> 404
    it("should return 404 if no parcels were updated", async () => {
      bulkWriteStub.resolves({ modifiedCount: 0 });

      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          parcels: [{ _id: new mongoose.Types.ObjectId(), total_price: 100 }],
          net_price: 100,
          payment_method: "cash",
          customer_paid: 100,
        });

      expect(res).to.have.status(404);
      expect(res.body.modifiedCount).to.equal(0);
      expect(res.body.message).to.include("ไม่พบพัสดุ");
    });

    // กรณี 6: _id ไม่ถูกต้อง -> 500
    it("should return 500 if _id is invalid", async () => {
      const res = await chai
        .request(app)
        .put("/admin-ban-poolsub/updatePayment")
        .set("Authorization", authHeader)
        .send({
          parcels: [{ _id: "123", total_price: 100 }],
          net_price: 100,
          payment_method: "cash",
          customer_paid: 100,
        });

      expect(res).to.have.status(500);
      expect(res.body.message).to.equal("เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์");
      expect(res.body.error).to.include("_id ของพัสดุไม่ถูกต้อง");
    });
  });
});
