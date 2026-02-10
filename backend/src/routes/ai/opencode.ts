export type AIResponse = {
    text: string;
    highlighted_issues: number[];
    suggested_actions: string[] | null;
    raw: string;
};

export interface OpencodeModel {
    id: string;
    providerID: string;
    name: string;
    family: string;
    api: {
        id: string;
        url: string;
        npm: string;
    };
    status: string;
    headers: Record<string, string>;
    options: Record<string, unknown>;
    cost: {
        input: number;
        output: number;
        cache: {
            read: number;
            write: number;
        };
    };
    limit: {
        context: number;
        output: number;
        input?: number;
    };
    capabilities: {
        temperature: boolean;
        reasoning: boolean;
        attachment: boolean;
        toolcall: boolean;
        input: {
            text: boolean;
            audio: boolean;
            image: boolean;
            video: boolean;
            pdf: boolean;
        };
        output: {
            text: boolean;
            audio: boolean;
            image: boolean;
            video: boolean;
            pdf: boolean;
        };
        interleaved: boolean | { field: string };
    };
    release_date: string;
    variants: Record<string, unknown>;
}

export interface FreeModel {
    name: string;
    id: string;
}

const ignore = ["gpt-5-nano"];

function parseOpencodeModelsOutput(output: string, provider: string): OpencodeModel[] {
    let models: OpencodeModel[] = [];
    const lines = output.split("\n");
    let currentModelId: string | null = null;
    let jsonBuffer: string[] = [];
    const providerPrefix = `${provider}/`;

    for (const line of lines) {
        const trimmed = line.trim();

        // Check if line starts with provider prefix (model ID header)
        if (trimmed.startsWith(providerPrefix)) {
            // Save previous model if exists
            if (currentModelId && jsonBuffer.length > 0) {
                try {
                    const model = JSON.parse(jsonBuffer.join("\n")) as OpencodeModel;
                    models.push(model);
                } catch {
                    // skip invalid JSON
                }
            }
            currentModelId = trimmed;
            jsonBuffer = [];
        } else if (trimmed.startsWith("{")) {
            jsonBuffer.push(trimmed);
        } else if (jsonBuffer.length > 0 && trimmed) {
            // Continue accumulating JSON lines
            jsonBuffer.push(trimmed);
        }
    }

    // Don't forget the last model
    if (currentModelId && jsonBuffer.length > 0) {
        try {
            const model = JSON.parse(jsonBuffer.join("\n")) as OpencodeModel;
            models.push(model);
        } catch {
            // skip invalid JSON
        }
    }

    models = models.filter((model) => !ignore.includes(model.id));

    return models;
}

// cached models storage
let cachedFreeModels: FreeModel[] | null = null;

// fallback models when opencode CLI fails
const FALLBACK_MODELS: FreeModel[] = [
    { name: "GLM 4.7 Free", id: "glm-4.7-free" },
    { name: "Kimi K2.5 Free", id: "kimi-k2.5-free" },
    { name: "MiniMax M2.1 Free", id: "minimax-m2.1-free" },
    { name: "Trinity Large", id: "trinity-large-preview-free" },
];

// initialize the cache by fetching from opencode CLI
export async function initializeFreeModelsCache(): Promise<void> {
    try {
        const models = await fetchFreeOpencodeModels();
        cachedFreeModels = models;
        console.log(`loaded ${models.length} free opencode models`);
    } catch (error) {
        console.error("failed to initialize free models cache:", error);
        cachedFreeModels = FALLBACK_MODELS;
    }
}

// refresh the cached models
export async function refreshFreeModelsCache(): Promise<FreeModel[]> {
    try {
        const models = await fetchFreeOpencodeModels();
        cachedFreeModels = models;
        console.log(`refreshed ${models.length} free opencode models`);
        return models;
    } catch (error) {
        console.error("failed to refresh free models cache:", error);
        // keep existing cache if refresh fails
        return cachedFreeModels ?? FALLBACK_MODELS;
    }
}

// get cached models (returns fallback if not initialized)
export function getCachedFreeModels(): FreeModel[] {
    return cachedFreeModels ?? FALLBACK_MODELS;
}

async function fetchFreeModelsForProvider(provider: string): Promise<FreeModel[]> {
    const proc = Bun.spawn({
        cmd: ["opencode", "models", provider, "--verbose"],
        stdout: "pipe",
        stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        const error = await new Response(proc.stderr).text();
        console.error(`opencode models command failed for ${provider}:`, error);
        throw new Error(`Failed to fetch ${provider} models`);
    }

    const allModels = parseOpencodeModelsOutput(output, provider);

    // filter to free models only (cost.input === 0 && cost.output === 0)
    const freeModels = allModels.filter((model) => model.cost.input === 0 && model.cost.output === 0);

    const banList = ["qwen3-embedding-4b"];
    // map to the expected format { name, id }
    return freeModels
        .filter((m) => !banList.includes(m.id))
        .map((model) => ({
            name: model.name,
            id: `${provider}/${model.id}`,
        }));
}

// internal function to actually fetch from CLI
async function fetchFreeOpencodeModels(): Promise<FreeModel[]> {
    const results = await Promise.allSettled([
        fetchFreeModelsForProvider("opencode"),
        fetchFreeModelsForProvider("privatemode-ai"),
    ]);

    const models: FreeModel[] = [];
    for (const result of results) {
        if (result.status === "fulfilled") {
            models.push(...result.value);
        }
    }

    if (models.length === 0) {
        throw new Error("Failed to fetch models from all providers");
    }

    return models;
}

export const callAI = async (prompt: string, model: string): Promise<AIResponse> => {
    if (!model.includes("/")) model = `opencode/${model}`;
    const result = Bun.spawn(["opencode", "run", prompt, "--model", model, "--title", "SPRINT_AUTOMATED"], {
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
