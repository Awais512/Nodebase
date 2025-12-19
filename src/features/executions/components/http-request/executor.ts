import type { NodeExecutor } from "@/features/executions/type";
import ky, { type Options as KyOptions } from "ky";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";

Handlebars.registerHelper("json", (context) => {
  const jsonStringify = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonStringify);
  return safeString;
});

type HttpRequestData = {
  variableName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  if (!data.endpoint) {
    throw new NonRetriableError("HTTP Request node: No endpoint configured");
  }

  if (!data.variableName) {
    throw new NonRetriableError("Variable Name not configured");
  }

  if (!data.method) {
    throw new NonRetriableError("Method not configured");
  }

  const result = await step.run("http-request", async () => {
    const endpoint = Handlebars.compile(data.endpoint)(context);
    const method = data.method;

    const options: KyOptions = { method };

    const methodsWithBody = ["POST", "PUT", "PATCH"];

    if (methodsWithBody.includes(method) && data.body?.trim()) {
      const resolved = Handlebars.compile(data.body)(context);
      JSON.parse(resolved);

      options.body = resolved;
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    const response = await ky(endpoint, options);
    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    const responsePayload = {
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    };

    return {
      ...context,
      [data.variableName]: responsePayload,
    };
  });

  return result;
};
