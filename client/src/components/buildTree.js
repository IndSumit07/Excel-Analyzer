export function buildTree(data) {
  console.log("Building tree from data:", data);

  if (!data || data.length === 0) {
    return {
      name: "No Data",
      attributes: {},
      children: [],
    };
  }

  // Helper function to normalize column names
  // Removes spaces, dots, underscores, and converts to lowercase
  const normalizeKey = (key) => {
    return String(key)
      .toLowerCase()
      .replace(/[\s._-]/g, "") // Remove spaces, dots, underscores, hyphens
      .trim();
  };

  // Helper function to get value by normalized key
  const getValueByNormalizedKey = (row, searchKeys) => {
    // Create a normalized map of the row
    const normalizedRow = {};
    Object.keys(row).forEach((key) => {
      const normalizedKey = normalizeKey(key);
      normalizedRow[normalizedKey] = row[key];
    });

    // Try each search key
    for (const searchKey of searchKeys) {
      const normalizedSearchKey = normalizeKey(searchKey);
      if (
        normalizedRow[normalizedSearchKey] !== undefined &&
        normalizedRow[normalizedSearchKey] !== null &&
        normalizedRow[normalizedSearchKey] !== ""
      ) {
        return normalizedRow[normalizedSearchKey];
      }
    }
    return null;
  };

  // Debug: Log first row to see column names
  console.log("Original column names:", Object.keys(data[0]));
  console.log(
    "Normalized column names:",
    Object.keys(data[0]).map((k) => normalizeKey(k))
  );
  console.log("Total rows:", data.length);

  // Create a map of all accounts with their full data
  const accountMap = {};
  const layerMap = {};

  // First pass: Create nodes with all transaction details
  data.forEach((row, index) => {
    // Try to find Account No with various possible names
    const accountNo = getValueByNormalizedKey(row, [
      "Account No",
      "AccountNo",
      "Account Number",
      "acc_no",
      "Acknowledgement N",
      "A/C No",
      "AC No",
    ]);

    // Try to find Layer
    const layer = getValueByNormalizedKey(row, ["Layer", "Level"]) || 0;

    if (index < 3) {
      console.log(`Row ${index}: Account=${accountNo}, Layer=${layer}`);
    }

    if (!accountNo) {
      if (index < 3) {
        console.warn(`Skipping row ${index}: No account number found`);
      }
      return;
    }

    // Store all row data for tooltip display
    const nodeData = {
      name: String(accountNo),
      layer: Number(layer),
      attributes: {
        accountNo: accountNo,
        layer: layer,
        sNo: getValueByNormalizedKey(row, [
          "S.No",
          "SNo",
          "Serial No",
          "S No",
          "SerialNumber",
        ]),
        acknowledgementN: getValueByNormalizedKey(row, [
          "Acknowledgement N",
          "Acknowledgement",
          "AcknowledgementN",
        ]),
        ifscCode: getValueByNormalizedKey(row, [
          "IFSC Code",
          "IFSCCode",
          "IFSC",
        ]),
        state: getValueByNormalizedKey(row, ["State"]),
        district: getValueByNormalizedKey(row, ["District"]),
        policeStation: getValueByNormalizedKey(row, [
          "police Station Name of Complain reported officer",
          "Police Station",
          "PS Name",
          "PoliceStation",
        ]),
        designation: getValueByNormalizedKey(row, ["Designation"]),
        mobileNumber: getValueByNormalizedKey(row, [
          "Mobile Number",
          "MobileNumber",
          "Mobile",
          "Phone",
        ]),
        email: getValueByNormalizedKey(row, ["Email", "E-mail", "EmailID"]),
        // Store all original data
        ...row,
      },
      children: [],
    };

    accountMap[String(accountNo)] = nodeData;

    // Group by layer for hierarchy building
    const layerNum = Number(layer);
    if (!layerMap[layerNum]) {
      layerMap[layerNum] = [];
    }
    layerMap[layerNum].push(String(accountNo));
  });

  console.log("✅ Account map size:", Object.keys(accountMap).length);
  console.log(
    "✅ Layer distribution:",
    Object.keys(layerMap)
      .map((l) => `Layer ${l}: ${layerMap[l].length} accounts`)
      .join(", ")
  );

  // Second pass: Build parent-child relationships
  let relationshipsFound = 0;
  data.forEach((row) => {
    const accountNo = String(
      getValueByNormalizedKey(row, [
        "Account No",
        "AccountNo",
        "Account Number",
      ]) || ""
    );

    const parentAccNo = String(
      getValueByNormalizedKey(row, [
        "parent_acc_no",
        "ParentAccountNo",
        "Parent Account No",
        "Parent",
      ]) || ""
    );

    if (
      accountNo &&
      accountNo !== "null" &&
      accountNo !== "" &&
      parentAccNo &&
      parentAccNo !== "null" &&
      parentAccNo !== "" &&
      accountMap[parentAccNo] &&
      accountMap[accountNo]
    ) {
      accountMap[parentAccNo].children.push(accountMap[accountNo]);
      relationshipsFound++;
    }
  });

  console.log("✅ Parent-child relationships found:", relationshipsFound);

  // Find root nodes (nodes with no parents or layer 0)
  const roots = [];
  const layers = Object.keys(layerMap)
    .map(Number)
    .sort((a, b) => a - b);

  console.log("✅ Layers found:", layers);

  // If we have explicit parent relationships, find nodes that aren't children
  const childrenSet = new Set();
  Object.values(accountMap).forEach((node) => {
    node.children.forEach((child) => childrenSet.add(child.name));
  });

  console.log("✅ Total children nodes:", childrenSet.size);

  // Find nodes that are not children of any other node
  Object.values(accountMap).forEach((node) => {
    if (!childrenSet.has(node.name)) {
      roots.push(node);
    }
  });

  console.log("✅ Root nodes found:", roots.length);

  // If no roots found, use layer 0 or lowest layer
  if (roots.length === 0 && layers.length > 0) {
    const lowestLayer = layers[0];
    console.log("⚠️ No roots found, using lowest layer as roots:", lowestLayer);
    layerMap[lowestLayer].forEach((accountNo) => {
      if (accountMap[accountNo]) {
        roots.push(accountMap[accountNo]);
      }
    });
  }

  // If still no roots, use all nodes (they're all roots)
  if (roots.length === 0) {
    console.log(
      "⚠️ No hierarchy found, treating all accounts as independent roots"
    );
    roots.push(...Object.values(accountMap));
  }

  const result = {
    name: "Transaction Flow",
    attributes: {
      totalAccounts: Object.keys(accountMap).length,
      totalLayers: layers.length,
    },
    children: roots,
  };

  console.log("🎉 Final tree built successfully!");
  console.log("   Total accounts:", result.attributes.totalAccounts);
  console.log("   Total layers:", result.attributes.totalLayers);
  console.log("   Root nodes:", roots.length);

  return result;
}
