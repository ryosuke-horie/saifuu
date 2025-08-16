/**
 * AmountRangeFilterコンポーネントのテスト
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AmountRangeFilter } from "../AmountRangeFilter";

describe("AmountRangeFilter", () => {
        const setup = (autoCorrect = false) => {
                const Wrapper = () => {
                        const [min, setMin] =
                                React.useState<number | undefined>();
                        const [max, setMax] =
                                React.useState<number | undefined>();
                        return (
                                <AmountRangeFilter
                                        minAmount={min}
                                        maxAmount={max}
                                        onMinAmountChange={setMin}
                                        onMaxAmountChange={setMax}
                                        onReset={() => {
                                                setMin(undefined);
                                                setMax(undefined);
                                        }}
                                        autoCorrect={autoCorrect}
                                />
                        );
                };
                render(<Wrapper />);
        };

        it("負の金額入力時にエラーを表示する", async () => {
                setup();
                const user = userEvent.setup();
                const minInput = screen.getByLabelText("最小金額");
                await user.type(minInput, "-100");
                expect(
                        await screen.findByText(
                                "最小金額は0以上を指定してください",
                        ),
                ).toBeInTheDocument();
        });

        it("最小金額が最大金額より大きい場合に自動で入れ替える", async () => {
                setup(true);
                const user = userEvent.setup();
                const minInput = screen.getByLabelText(
                        "最小金額",
                ) as HTMLInputElement;
                const maxInput = screen.getByLabelText(
                        "最大金額",
                ) as HTMLInputElement;

                await user.type(maxInput, "100");
                await user.type(minInput, "1000");

                await waitFor(() => {
                        expect(minInput.value).toBe("100");
                        expect(maxInput.value).toBe("1000");
                });

                expect(
                        screen.queryByText(
                                "最小金額は最大金額以下を指定してください",
                        ),
                ).not.toBeInTheDocument();
        });
});

