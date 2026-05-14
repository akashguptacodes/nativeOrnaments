const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

// 1. Notify when Rates are updated
exports.onRateUpdate = functions.database.instance("om-ornament-default-rtdb").ref("/data/rates")
    .onUpdate(async (change, context) => {
      const after = change.after.val() || {};
      
      const rateList = [
        `NUMBER Rate: ₹${after['नंबर Rate'] || '...'} /10g`,
        `BREAD Rate: ₹${after['ब्रेड Rate'] || '...'} /10g`,
        `RTGS Rate: ₹${after['RTGS Rate'] || '...'} /10g`,
        `SILVER BATIYA: ₹${after['चांदी बटिया Rate'] || '...'} /kg`
      ];

      console.log("Sending full market update notification");

      const message = {
        notification: {
          title: "📈 Market Rates Updated!",
          body: rateList.join("\n"),
        },
        android: {
          notification: {
            channelId: "updates",
            priority: "high",
          },
        },
        topic: "all_updates",
      };
      
      try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    });

// 2. Notify when a new Product is added
exports.onProductAdd = functions.database.instance("om-ornament-default-rtdb").ref("/assetimage/{category}/{productId}")
    .onCreate(async (snapshot, context) => {
      const product = snapshot.val();
      // Skip the initialization flag
      if (context.params.productId === "_initialized") return null;

      const message = {
        notification: {
          title: `🆕 New ${context.params.category} Added!`,
          body: `Check out our latest ${product.name} design.`,
        },
        android: {
          notification: {
            channelId: "updates",
            priority: "high",
            imageUrl: product.image,
          },
        },
        topic: "all_updates",
      };

      try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent product notification:", response);
        return response;
      } catch (error) {
        console.error("Error sending product notification:", error);
        throw error;
      }
    });

// 3. Notify when a new Category is added
exports.onCategoryAdd = functions.database.instance("om-ornament-default-rtdb").ref("/assetimage/{category}")
    .onCreate(async (snapshot, context) => {
      const message = {
        notification: {
          title: "📂 New Category Available!",
          body: `We've added a new collection: ${context.params.category}`,
        },
        android: {
          notification: {
            channelId: "updates",
            priority: "high",
          },
        },
        topic: "all_updates",
      };

      try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent category notification:", response);
        return response;
      } catch (error) {
        console.error("Error sending category notification:", error);
        throw error;
      }
    });
