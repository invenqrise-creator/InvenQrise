import { SuggestCategoryForm } from "@/components/ai/suggest-category-form";

export default function AIToolsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-headline tracking-tight">Customer Insights AI</h1>
                <p className="text-muted-foreground">
                    Leverage AI to make smarter decisions for your inventory.
                </p>
            </div>
            <SuggestCategoryForm />
        </div>
    );
}
