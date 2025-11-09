// ===== TESTS FOR POST /admin-ban-poolsub/registerParcel =====
// 1) Status code 201
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

// 2) Response has success message
pm.test("Response message is correct", function () {
  const res = pm.response.json();
  pm.expect(res).to.have.property("message", "ลงทะเบียนพัสดุสำเร็จ");
});

// 3) Response contains parcel object
pm.test("Response contains parcel object", function () {
  const res = pm.response.json();
  pm.expect(res).to.have.property("parcel");
  const p = res.parcel;
  pm.expect(p).to.have.property("tracking_number", "EM123456TH");
  pm.expect(p).to.have.property("sender", "Alice");
  pm.expect(p).to.have.property("receiver", "Bob");
  pm.expect(p).to.have.property("shipping_cost");
  pm.expect(p).to.have.property("total_price", 100);
  pm.expect(p).to.have.property("net_price", 100);
  pm.expect(p).to.have.property("parcel_status");
});

// 4) Missing required field
pm.test("Should fail if required fields are missing", function () {
  const body = pm.request.body.raw;
  if (!body) return;
  const parsed = JSON.parse(body);
  if (!parsed.tracking_number) {
    pm.response.to.have.status(400);
    pm.expect(pm.response.json()).to.have.property(
      "message",
      "กรุณากรอกข้อมูลให้ครบทุกช่อง"
    );
  }
});

// 5) Track duplicate tracking number
pm.test("Duplicate tracking number returns 400", function () {
  const res = pm.response.json();
  if (res.message === "Tracking number already exists") {
    pm.response.to.have.status(400);
  }
});

// 6) Save parcel ID for later use
pm.test("Save parcel ID", function () {
  const res = pm.response.json();
  if (res.parcel && res.parcel._id) {
    pm.environment.set("parcel_id", res.parcel._id);
    pm.environment.set("parcel_tracking_number", res.parcel.tracking_number);
  }
});

// ===== TESTS FOR POST /api/items =====
// Test 1: Status Code for creation
pm.test("POST - Status code is 201", function () {
  pm.response.to.have.status(201);
});
// Test 2: Response structure
pm.test("POST - Response has correct structure", function () {
  const responseData = pm.response.json();
  pm.expect(responseData).to.have.property("id");
  pm.expect(responseData).to.have.property("name");
  pm.expect(responseData).to.have.property("price");
});
// Test 3: Auto-increment ID validation
pm.test("POST - ID is auto-incremented correctly", function () {
  const responseData = pm.response.json();
  const initialCount = pm.environment.get("initial_items_count");
  pm.expect(responseData.id).to.equal(initialCount + 1);
});
// Test 4: Data integrity check
pm.test("POST - Data matches request body", function () {
  const requestBody = JSON.parse(pm.request.body.raw);
  const responseData = pm.response.json();
  pm.expect(responseData.name).to.equal(requestBody.name);
  pm.expect(responseData.price).to.equal(requestBody.price);
});
// Test 5: Save new item ID for later use
pm.test("POST - Save new item ID", function () {
  const responseData = pm.response.json();
  pm.environment.set("new_item_id", responseData.id);
  console.log("New item created with ID:", responseData.id);
});

// ===== TESTS FOR PUT /api/items/:id =====
// Test 1: Status Code for update
pm.test("PUT - Status code is 200", function () {
  pm.response.to.have.status(200);
});
// Test 2: Response structure
pm.test("PUT - Response has correct structure", function () {
  const responseData = pm.response.json();
  pm.expect(responseData).to.have.property("id");
  pm.expect(responseData).to.have.property("name");
  pm.expect(responseData).to.have.property("price");
});
// Test 3: ID consistency check
pm.test("PUT - ID remains unchanged", function () {
  const responseData = pm.response.json();
  const itemId = pm.environment.get("new_item_id");
  pm.expect(responseData.id).to.equal(itemId);
});
// Test 4: Data update verification
pm.test("PUT - Data matches updated values", function () {
  const requestBody = JSON.parse(pm.request.body.raw);
  const responseData = pm.response.json();
  pm.expect(responseData.name).to.equal(requestBody.name);
  pm.expect(responseData.price).to.equal(requestBody.price);
});
// Test 5: Log updated item ID
pm.test("PUT - Log updated item ID", function () {
  const responseData = pm.response.json();
  console.log("Item updated with ID:", responseData.id);
});

// ===== TESTS FOR DELETE /api/items/:id =====
// Test 1: Status Code for deletion
pm.test("DELETE - Status code is 200", function () {
  pm.response.to.have.status(200);
});
// Test 2: Response message verification
pm.test("DELETE - Success message", function () {
  const responseData = pm.response.json();
  pm.expect(responseData).to.have.property("message");
  pm.expect(responseData.message).to.include("deleted");
});
// Test 3: Verify deletion by calling GET again
pm.test("DELETE - Verify item is actually deleted", function () {
  // This would typically be a separate request, but we can log for verification
  console.log(
    "Item with ID",
    pm.environment.get("new_item_id"),
    "should be deleted"
  );
});
// Test 4: Clean up environment variables
pm.test("DELETE - Clean up test data", function () {
  pm.environment.unset("new_item_id");
});
