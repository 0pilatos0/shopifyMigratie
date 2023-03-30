const fs = require("fs");

//check if input file exists
if (!fs.existsSync("input.json")) {
  console.log("input.json does not exist");
  process.exit(1);
}

const input = JSON.parse(fs.readFileSync("input.json", "utf8"));
const newConnectors = [];

input.forEach((item) => {
  if (item.name === "usersettings") {
    item.data.forEach((connector) => {
      let date = new Date(connector.minimumdate);
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      let newDate = `${year}-${month}-${day}`;

      if (isNaN(Date.parse(newDate))) {
        date = new Date();
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();

        newDate = `${year}-${month}-${day}`;
      }

      let newConnector = {
        name: connector.shop,
        instalation_date: newDate,
        __temp_id: connector.id,
        __temp_access_token: connector.accesstoken,
      };

      newConnectors.push(newConnector);
    });
  }
});

input.forEach((item) => {
  if (item.name === "servicelayer") {
    item.data.forEach((connector) => {
      newConnectors.forEach((element) => {
        if (element.__temp_id === connector.usersettings_id) {
          element.apiurl = connector.url;
          element.apikey = connector.apikey;
          element.apisecret = connector.apisecret;
          element.erp = "SAASSHOP";
          element.company_id = 1;
          element.active = 1;
          element.user_id = 1;
          element.authorized = 0;
          element.servicelayer_webhooks_registered = 0;

          let isUseStockSync = connector.use_stocksync === "on" ? "1" : "0";
          let isUseShippingTag = connector.use_shippingtag === "on" ? "1" : "0";
          let isUseSerialnumbers =
            connector.use_serialnumbers === "on" ? "1" : "0";
          let isUsePrices = connector.use_prices === "on" ? "1" : "0";
          let isNotifyShipment = connector.notify_shipment === "on" ? "1" : "0";
          let isUsePendingPaymentOrders =
            connector.use_payment_pending_orders === "on" ? "1" : "0";
          let isUseOnlyLocationOrders =
            connector.use_only_location_orders === "on" ? "1" : "0";

          element.metadata = `a:12:{s:4:"shop";s:${element.name.length}:"${
            element.name
          }";s:11:"accessToken";s:${element.__temp_access_token.length}:"${
            element.__temp_access_token
          }";s:9:"webshopId";s:${connector.webshop_id.toString().length}:"${
            connector.webshop_id
          }";s:10:"locationId";i:${
            connector.location
          };s:14:"isUseStockSync";b:${isUseStockSync};s:16:"isUseShippingTag";b:${isUseShippingTag};s:18:"isUseSerialnumbers";b:${isUseSerialnumbers};s:11:"isUsePrices";b:${isUsePrices};s:16:"isNotifyShipment";b:${isNotifyShipment};s:25:"isUsePendingPaymentOrders";b:${isUsePendingPaymentOrders};s:23:"isUseOnlyLocationOrders";b:${isUseOnlyLocationOrders};s:14:"needsMigration";b:1;}`;

          delete element.__temp_id;
          delete element.__temp_access_token;
        }
      });
    });
  }
});

console.log(newConnectors);

//delete output.sql file if exists
if (fs.existsSync("output.sql")) {
  fs.unlinkSync("output.sql");
}
if (fs.existsSync("failed.json")) {
  fs.unlinkSync("failed.json");
}

let failed = [];
newConnectors.forEach((element) => {
  //if connector is incomplete, add to failed array, you can count the number of properties in the object and compare it to the number of properties you expect
  if (Object.keys(element).length !== 12) {
    failed.push(element);
    return;
  }

  if (
    Object.values(element).includes(null) ||
    Object.values(element).includes("") ||
    Object.values(element).includes("undefined") ||
    Object.values(element).some(
      (value) => value === undefined || value === "undefined"
    )
  ) {
    failed.push(element);
    return;
  }
  insertString = `INSERT INTO connector (name, installation_date, apiurl, apikey, apisecret, erp, company_id, active, user_id, authorized, servicelayer_webhooks_registered, metadata) VALUES ('${element.name}', '${element.instalation_date}', '${element.apiurl}', '${element.apikey}', '${element.apisecret}', '${element.erp}', ${element.company_id}, ${element.active}, ${element.user_id}, ${element.authorized}, ${element.servicelayer_webhooks_registered}, '${element.metadata}');`;
  fs.appendFileSync("output.sql", insertString + "\r\n");
});

if (failed.length > 0) {
  fs.writeFileSync("failed.json", JSON.stringify(failed));
}
