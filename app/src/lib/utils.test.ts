import { cn } from "@/lib/utils";

describe("cn", () => {
    it("merges multiple class name arguments into one string", () => {
        expect(cn("a", "b")).toBe("a b");
    });

    it("keeps conditional classes only when truthy", () => {
        expect(cn("base", false && "hidden", "shown")).toBe("base shown");
    });

    it("resolves conflicting tailwind classes to the last one", () => {
        expect(cn("p-2", "p-4")).toBe("p-4");
    });
});
