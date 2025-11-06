
import { z } from 'zod';

const SaleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
});

const ProductStockSchema = z.object({
  id: z.string(),
  name: z.string(),
  stock: z.object({
    'front-of-house': z.number(),
    'back-of-house': z.number(),
  }),
});

export const GenerateInventoryInsightsInputSchema = z.object({
  salesData: z.array(z.object({
    date: z.string().describe("The ISO 8601 date of the sale."),
    items: z.array(SaleItemSchema),
  })).describe("An array of sales records from the last 30 days."),
  productsData: z.array(ProductStockSchema).describe("A list of all current products with their stock levels."),
});
export type GenerateInventoryInsightsInput = z.infer<typeof GenerateInventoryInsightsInputSchema>;


const SellerSchema = z.object({
  productName: z.string(),
  unitsSold: z.number(),
});

const PurchaseSuggestionSchema = z.object({
  productName: z.string(),
  currentStock: z.number(),
  predictedSales: z.number().describe("Predicted sales for the next 30 days based on last month's performance."),
  suggestedPurchaseQuantity: z.number().describe("How many units to reorder to maintain a 30-day supply plus a safety buffer."),
});

export const GenerateInventoryInsightsOutputSchema = z.object({
  bestSellers: z.array(SellerSchema).describe("Top 5 best-selling products by units sold."),
  worstSellers: z.array(SellerSchema).describe("Top 5 worst-selling products by units sold."),
  purchaseSuggestions: z.array(PurchaseSuggestionSchema).describe("Suggestions for products to reorder."),
  summary: z.string().describe("A high-level summary of the inventory situation and key recommendations."),
});
export type GenerateInventoryInsightsOutput = z.infer<typeof GenerateInventoryInsightsOutputSchema>;
