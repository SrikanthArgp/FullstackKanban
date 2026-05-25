import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Home login flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows the sign in form when unauthenticated", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  it("shows an error on invalid credentials", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText(/username/i), "wrong");
    await userEvent.type(screen.getByLabelText(/password/i), "nope");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i);
  });

  it("allows login with demo credentials", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText(/username/i), "user");
    await userEvent.type(screen.getByLabelText(/password/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      await screen.findByRole("heading", { name: /kanban studio/i })
    ).toBeVisible();
  });

  it("logs out and returns to sign in", async () => {
    render(<Home />);
    await userEvent.type(screen.getByLabelText(/username/i), "user");
    await userEvent.type(screen.getByLabelText(/password/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});
