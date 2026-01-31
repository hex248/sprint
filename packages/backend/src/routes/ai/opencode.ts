export type AIResponse = {
    text: string;
    highlighted_issues: number[];
    suggested_actions: string[] | null;
    raw: string;
};

export const callAI = async (prompt: string): Promise<AIResponse> => {
    const models = [
        "opencode/glm-4.7-free",
        "opencode/kimi-k2.5-free",
        "opencode/minimax-m2.1-free",
        "opencode/trinity-large-preview-free",
    ];
    const model = models[3]!;

    const result = Bun.spawn(["opencode", "run", prompt, "--model", model], {
        stdout: "pipe",
        stderr: "pipe",
    });

    // Collect all output
    let rawOutput = "";
    for await (const chunk of result.stdout) {
        rawOutput += new TextDecoder().decode(chunk);
    }

    let stderrOutput = "";
    for await (const chunk of result.stderr) {
        stderrOutput += new TextDecoder().decode(chunk);
    }

    await result.exited;

    try {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawOutput;

        const response = JSON.parse(jsonStr);

        if (!response.text || !Array.isArray(response.highlighted_issues)) {
            throw new Error("Invalid response structure");
        }

        const output = {
            text: response.text,
            highlighted_issues: response.highlighted_issues,
            suggested_actions: response.suggested_actions || [],
            raw: rawOutput,
        };

        return output;
    } catch (e) {
        console.log(
            JSON.stringify(
                {
                    error: "Failed to parse AI response as JSON",
                    parse_error: e instanceof Error ? e.message : String(e),
                    raw: rawOutput,
                    stderr: stderrOutput,
                },
                null,
                2,
            ),
        );
        return {
            text: "Sorry, an error occurred while processing the AI response.",
            highlighted_issues: [],
            suggested_actions: [],
            raw: rawOutput,
        };
    }
};
