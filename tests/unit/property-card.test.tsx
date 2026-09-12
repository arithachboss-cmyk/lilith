// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PropertyCard } from "../../src/components/middle/property-card";
import type { Property } from "../../src/services/platform/records";
const property: Property = {
  id: "test-property",
  ownerId: "test-owner",
  name: "TEST ONLY Property",
  description: "",
  price: "45000.00",
  transactionType: "RENT",
  propertyType: "CONDO",
  currency: "THB",
  location: "Sukhumvit",
  bedrooms: 2,
  areaSqm: 80,
  facilities: [],
  status: "PUBLISHED",
  verified: false,
  createdAt: "2026-09-08T00:00:00Z",
};
afterEach(cleanup);
describe("PropertyCard", () => {
  it("labels missing assets/verification truthfully and invokes real action callbacks", () => {
    const action = vi.fn();
    render(<PropertyCard property={property} onInterest={action} />);
    expect(screen.getByText("Not yet verified")).toBeInTheDocument();
    expect(
      screen.getByText("Property photography pending"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Interested" }));
    expect(action).toHaveBeenCalledWith("INTERESTED");
    fireEvent.click(screen.getByRole("button", { name: "Pass" }));
    expect(action).toHaveBeenCalledWith("PASS");
    fireEvent.click(screen.getByRole("button", { name: "Super Match" }));
    expect(action).toHaveBeenCalledWith("SUPER_MATCH");
  });
  it("prevents duplicate clicks while a request is pending", () => {
    const action = vi.fn();
    render(<PropertyCard property={property} onInterest={action} busy />);
    fireEvent.click(screen.getByRole("button", { name: "Interested" }));
    expect(action).not.toHaveBeenCalled();
  });
});
