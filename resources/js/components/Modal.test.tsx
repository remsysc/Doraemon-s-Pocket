import { useState } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Modal from "./Modal";

describe("Modal Component", () => {
    beforeEach(() => {
        document.body.style.overflow = "";
    });

    afterEach(() => {
        document.body.style.overflow = "";
    });

    it("renders modal content with title and subtitle when isOpen is true", () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Test Dialog" subtitle="Dialog description">
                <p>Modal body content</p>
            </Modal>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Test Dialog" })).toBeInTheDocument();
        expect(screen.getByText("Dialog description")).toBeInTheDocument();
        expect(screen.getByText("Modal body content")).toBeInTheDocument();
    });

    it("does not render into DOM when isOpen is false", () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()} title="Test Dialog">
                <p>Modal body content</p>
            </Modal>
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("autofocuses the first editable form input instead of the close button on open", async () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Test Form">
                <div>
                    <label htmlFor="first-field">First Field</label>
                    <input id="first-field" type="text" placeholder="First field" />
                    <button type="button">Action Button</button>
                </div>
            </Modal>
        );

        const closeButton = screen.getByRole("button", { name: /close dialog/i });
        const firstInput = screen.getByLabelText("First Field");

        await waitFor(() => {
            expect(document.activeElement).toBe(firstInput);
            expect(document.activeElement).not.toBe(closeButton);
        });
    });

    it("never steals focus or interrupts typing when parent component re-renders while typing", async () => {
        const user = userEvent.setup();

        function StatefulModalParent() {
            const [value, setValue] = useState("");
            const [renderCount, setRenderCount] = useState(0);

            return (
                <div>
                    <span data-testid="render-count">{renderCount}</span>
                    <Modal
                        isOpen={true}
                        // Fresh inline callback on every render to stress-test dependency stability
                        onClose={() => {}}
                        title="Editing Product"
                    >
                        <div>
                            <label htmlFor="prod-name">Product Name</label>
                            <input
                                id="prod-name"
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    setRenderCount((prev) => prev + 1);
                                }}
                            />
                            <label htmlFor="prod-notes">Notes</label>
                            <input id="prod-notes" placeholder="Notes" />
                        </div>
                    </Modal>
                </div>
            );
        }

        render(<StatefulModalParent />);

        const nameInput = screen.getByLabelText("Product Name");
        await user.click(nameInput);
        expect(document.activeElement).toBe(nameInput);

        // Type multiple characters sequentially
        await user.type(nameInput, "Doraemon Gadget");

        // Input must have full typed string without focus interruption
        expect(nameInput).toHaveValue("Doraemon Gadget");
        expect(document.activeElement).toBe(nameInput);

        // Now focus on second field and type
        const notesInput = screen.getByPlaceholderText("Notes");
        await user.click(notesInput);
        expect(document.activeElement).toBe(notesInput);

        await user.type(notesInput, "Anywhere Door");
        expect(notesInput).toHaveValue("Anywhere Door");
        expect(document.activeElement).toBe(notesInput);
    });

    it("calls onClose when Escape key is pressed", async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={handleClose} title="Escape Test">
                <input placeholder="Sample input" />
            </Modal>
        );

        await user.keyboard("{Escape}");
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("traps focus between first and last focusable elements on Tab and Shift+Tab", async () => {
        const user = userEvent.setup();

        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap">
                <div>
                    <input data-testid="input-1" />
                    <input data-testid="input-2" />
                    <button data-testid="save-btn" type="button">Save</button>
                </div>
            </Modal>
        );

        const closeBtn = screen.getByRole("button", { name: /close dialog/i });
        const saveBtn = screen.getByTestId("save-btn");

        // Focus save button (last focusable element)
        saveBtn.focus();
        expect(document.activeElement).toBe(saveBtn);

        // Pressing Tab on the last element wraps to the first focusable element (closeBtn)
        await user.tab();
        expect(document.activeElement).toBe(closeBtn);

        // Pressing Shift+Tab on the first element wraps to the last focusable element (saveBtn)
        await user.tab({ shift: true });
        expect(document.activeElement).toBe(saveBtn);
    });

    it("locks body overflow when open and restores it when closed", () => {
        document.body.style.overflow = "visible";

        const { rerender } = render(
            <Modal isOpen={true} onClose={vi.fn()} title="Scroll Lock Test">
                <p>Content</p>
            </Modal>
        );

        expect(document.body.style.overflow).toBe("hidden");

        rerender(
            <Modal isOpen={false} onClose={vi.fn()} title="Scroll Lock Test">
                <p>Content</p>
            </Modal>
        );

        expect(document.body.style.overflow).toBe("visible");
    });

    it("restores focus to trigger element when closed", async () => {
        function ModalTriggerTest() {
            const [open, setOpen] = useState(false);

            return (
                <div>
                    <button data-testid="trigger-btn" onClick={() => setOpen(true)}>
                        Open Dialog
                    </button>
                    <Modal isOpen={open} onClose={() => setOpen(false)} title="Restore Focus">
                        <button onClick={() => setOpen(false)}>Close Inside</button>
                    </Modal>
                </div>
            );
        }

        const user = userEvent.setup();
        render(<ModalTriggerTest />);

        const triggerBtn = screen.getByTestId("trigger-btn");
        await user.click(triggerBtn);

        expect(screen.getByRole("dialog")).toBeInTheDocument();

        // Close via inner button
        const closeInsideBtn = screen.getByRole("button", { name: "Close Inside" });
        await user.click(closeInsideBtn);

        // Focus must return to triggerBtn
        await waitFor(() => {
            expect(document.activeElement).toBe(triggerBtn);
        });
    });
});
