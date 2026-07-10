import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/* Proves the full test harness wiring end to end: the React JSX transform
 * (@vitejs/plugin-react), the jsdom DOM environment, React Testing Library's
 * render/screen, and the jest-dom matchers registered in vitest.setup.ts.
 * If any of those are misconfigured this fails, so downstream component
 * tests can rely on the harness being sound. */
describe("test harness", () => {
    it("renders JSX into jsdom and finds it with jest-dom matchers", () => {
        render(<button data-testid="probe">click me</button>);

        const probe = screen.getByTestId("probe");
        expect(probe).toBeInTheDocument();
        expect(probe).toHaveTextContent("click me");
    });
});
