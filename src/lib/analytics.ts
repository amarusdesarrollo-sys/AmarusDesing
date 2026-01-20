import { getAnalyticsInstance } from "./firebase";
import { logEvent } from "firebase/analytics";

// Initialize Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, "page_view", {
      page_location: url,
      page_title: document.title,
    });
  }
};

// Track events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Ecommerce specific events
export const trackPurchase = (transactionData: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, "purchase", {
      transaction_id: transactionData.transaction_id,
      value: transactionData.value,
      currency: transactionData.currency,
      items: transactionData.items,
    });
  }
};

export const trackAddToCart = (itemData: {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
}) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, "add_to_cart", {
      currency: "EUR",
      value: itemData.price * itemData.quantity,
      items: [itemData],
    });
  }
};

export const trackViewItem = (itemData: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
}) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, "view_item", {
      currency: "EUR",
      value: itemData.price,
      items: [itemData],
    });
  }
};

export const trackBeginCheckout = (
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>,
  value: number
) => {
  const analytics = getAnalyticsInstance();
  if (analytics && typeof window !== "undefined") {
    logEvent(analytics, "begin_checkout", {
      currency: "EUR",
      value: value,
      items: items,
    });
  }
};

// Custom events for AmarusDesign
export const trackArtisanView = (artisanName: string) => {
  event({
    action: "view_artisan",
    category: "engagement",
    label: artisanName,
  });
};

export const trackNewsletterSignup = () => {
  event({
    action: "newsletter_signup",
    category: "engagement",
    label: "homepage",
  });
};

export const trackLoyaltyPointsEarned = (points: number) => {
  event({
    action: "loyalty_points_earned",
    category: "loyalty",
    value: points,
  });
};
